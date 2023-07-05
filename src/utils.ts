import { decode } from 'html-entities'
import { parse } from 'node-html-parser'
import { Image } from 'react-native'

import { PreviewData, PreviewDataImage, Size } from './types'

export const getActualImageUrl = (baseUrl: string, imageUrl?: string) => {
  let actualImageUrl = imageUrl?.trim()
  if (!actualImageUrl || actualImageUrl.startsWith('data')) return

  if (actualImageUrl.startsWith('//'))
    actualImageUrl = `https:${actualImageUrl}`

  if (!actualImageUrl.startsWith('http')) {
    if (baseUrl.endsWith('/') && actualImageUrl.startsWith('/')) {
      actualImageUrl = `${baseUrl.slice(0, -1)}${actualImageUrl}`
    } else if (!baseUrl.endsWith('/') && !actualImageUrl.startsWith('/')) {
      actualImageUrl = `${baseUrl}/${actualImageUrl}`
    } else {
      actualImageUrl = `${baseUrl}${actualImageUrl}`
    }
  }

  return actualImageUrl
}

export const getHtmlEntitiesDecodedText = (text?: string) => {
  const actualText = text?.trim()
  if (!actualText) return

  return decode(actualText)
}

export const getImageSize = (url: string) => {
  return new Promise<Size>((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => {
        resolve({ height, width })
      },
      // type-coverage:ignore-next-line
      (error) => reject(error)
    )
  })
}

// Functions below use functions from the same file and mocks are not working
/* istanbul ignore next */
export const getPreviewData = async (text: string, requestTimeout = 5000) => {
  const previewData: PreviewData = {
    description: undefined,
    image: undefined,
    link: undefined,
    title: undefined,
  }

  try {
    const textWithoutEmails = text.replace(REGEX_EMAIL, '').trim()

    if (!textWithoutEmails) return previewData

    const link = textWithoutEmails.match(REGEX_LINK)?.[0]

    if (!link) return previewData

    let url = link

    // force https urls
    if (url.toLowerCase().startsWith('http:')) {
      url = url.replace('http:', 'https:')
    }

    // handle absolute urls
    if (!url.toLowerCase().includes('://')) {
      url = `https://${url}`
    }

    const abortController = new AbortController()
    const request = fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
      },
      signal: abortController.signal,
    })
    const abortControllerTimeout = setTimeout(() => {
      abortController.abort()
    }, requestTimeout)
    const response = await request

    clearTimeout(abortControllerTimeout)

    previewData.link = url

    const contentType = response.headers.get('content-type') ?? ''

    if (REGEX_IMAGE_CONTENT_TYPE.test(contentType)) {
      const image = await getPreviewDataImage(url)
      previewData.image = image
      return previewData
    }

    const html = await response.text()

    // Some pages return undefined
    if (!html) return previewData

    const htmlElements = parse(html)

    // Get page title
    previewData.title = getHtmlEntitiesDecodedText(
      htmlElements.getAttribute('title')
    )

    const meta = htmlElements
      .querySelectorAll('meta')
      .filter(
        (m) =>
          m.getAttribute('property')?.startsWith('og:') ||
          m.getAttribute('property') === 'description'
      )
      .map((e) => e.attrs)

    if (meta.length === 0) {
      return previewData
    }

    const metaPreviewData = meta.reduce<{
      description?: string
      imageUrl?: string
      title?: string
    }>(
      (acc, { property, content }) => {
        // Takes the last occurrence
        // For description, take the meta description tag into consideration
        const description = ['description', 'og:description'].includes(property)
          ? getHtmlEntitiesDecodedText(content)
          : undefined

        const ogImageUrl =
          property === 'og:image'
            ? getHtmlEntitiesDecodedText(content)
            : undefined
        const ogTitle =
          property === 'og:title'
            ? getHtmlEntitiesDecodedText(content)
            : undefined

        return {
          description: description || acc.description,
          imageUrl: getActualImageUrl(url, ogImageUrl) || acc.imageUrl,
          title: ogTitle || acc.title,
        }
      },
      { title: previewData.title }
    )

    previewData.description = metaPreviewData.description
    previewData.image = await getPreviewDataImage(metaPreviewData.imageUrl)
    previewData.title = metaPreviewData.title

    if (!previewData.image) {
      const imageSources = htmlElements
        .querySelectorAll('img')
        .filter((e) => e.hasAttribute('src'))
        .filter(({ attrs }) => !attrs.src.startsWith('data'))
        .map(({ attrs }) => attrs.src)

      let images: PreviewDataImage[] = []

      for (const src of imageSources.slice(0, 5)) {
        const image = await getPreviewDataImage(getActualImageUrl(url, src))

        if (!image) continue

        images = [...images, image]
      }

      previewData.image = images.sort(
        (a, b) => b.height * b.width - a.height * a.width
      )[0]
    }

    return previewData
  } catch {
    return previewData
  }
}

/* istanbul ignore next */
export const getPreviewDataImage = async (url?: string) => {
  if (!url) return

  try {
    const { height, width } = await getImageSize(url)
    const aspectRatio = width / (height || 1)

    if (height > 100 && width > 100 && aspectRatio > 0.1 && aspectRatio < 10) {
      const image: PreviewDataImage = { height, url, width }
      return image
    }
  } catch {}
}

export const oneOf =
  <T extends (...args: A) => any, U, A extends any[]>(
    truthy: T | undefined,
    falsy: U
  ) =>
  (...args: Parameters<T>): ReturnType<T> | U => {
    return truthy ? truthy(...args) : falsy
  }

export const REGEX_EMAIL = /([a-zA-Z0-9+._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
export const REGEX_IMAGE_CONTENT_TYPE = /image\/*/g
export const REGEX_LINK =
  /((http|ftp|https):\/\/)?([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i
