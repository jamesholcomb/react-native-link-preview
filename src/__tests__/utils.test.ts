import { act } from '@testing-library/react-native'
import { Image } from 'react-native'

import * as utils from '../utils'

describe('getActualImageUrl', () => {
  it('returns undefined if no image url is provided', () => {
    expect.assertions(1)
    const baseUrl = 'https://github.com/flyerhq/'
    const url = utils.getActualImageUrl(baseUrl)
    expect(url).toBeUndefined()
  })

  it('returns undefined if image is base64 formatted', () => {
    expect.assertions(1)
    const baseUrl = 'https://github.com/flyerhq/'
    const url = utils.getActualImageUrl(baseUrl, 'data://')
    expect(url).toBeUndefined()
  })

  it('adds https: if image url starts with //', () => {
    expect.assertions(1)
    const baseUrl = 'https://github.com/flyerhq/'
    const imageUrl = '//avatars2.githubusercontent.com/u/59206044'
    const url = utils.getActualImageUrl(baseUrl, imageUrl)
    expect(url).toStrictEqual('https:' + imageUrl)
  })

  it("adds base url if image url doesn't start with a http and removes double slash", () => {
    expect.assertions(1)
    const baseUrl = 'https://avatars2.githubusercontent.com/'
    const imageUrl = '/u/59206044'
    const url = utils.getActualImageUrl(baseUrl, imageUrl)
    expect(url).toBe('https://avatars2.githubusercontent.com/u/59206044')
  })

  it("adds base url if image url doesn't start with a http and adds a slash if needed", () => {
    expect.assertions(1)
    const baseUrl = 'https://avatars2.githubusercontent.com'
    const imageUrl = 'u/59206044'
    const url = utils.getActualImageUrl(baseUrl, imageUrl)
    expect(url).toBe('https://avatars2.githubusercontent.com/u/59206044')
  })

  it("adds base url if image url doesn't start with a http", () => {
    expect.assertions(1)
    const baseUrl = 'https://avatars2.githubusercontent.com/'
    const imageUrl = 'u/59206044'
    const url = utils.getActualImageUrl(baseUrl, imageUrl)
    expect(url).toStrictEqual(baseUrl + imageUrl)
  })

  it('returns the same image url if provided image url is full', () => {
    expect.assertions(1)
    const baseUrl = 'https://github.com/flyerhq/'
    const imageUrl = 'https://avatars2.githubusercontent.com/u/59206044'
    const url = utils.getActualImageUrl(baseUrl, imageUrl)
    expect(url).toStrictEqual(imageUrl)
  })
})

describe('getHtmlEntitiesDecodedText', () => {
  it('returns undefined if text is not provided', () => {
    expect.assertions(1)
    const decodedText = utils.getHtmlEntitiesDecodedText()
    expect(decodedText).toBeUndefined()
  })

  it('decodes HTML entities', () => {
    expect.assertions(1)
    const text = 'text'
    const decodedText = utils.getHtmlEntitiesDecodedText(text)
    expect(decodedText).toStrictEqual(text)
  })
})

describe('getImageSize', () => {
  it('gets image size', () => {
    expect.assertions(2)
    const getSizeMock = jest.spyOn(Image, 'getSize')
    getSizeMock.mockImplementation(() => {})
    const imageUrl = 'https://avatars2.githubusercontent.com/u/59206044'
    utils.getImageSize(imageUrl)
    expect(getSizeMock).toHaveBeenCalledTimes(1)
    const getSizeArgs = getSizeMock.mock.calls[0]
    expect(getSizeArgs[0]).toBe(imageUrl)
    const success = getSizeArgs[1]
    const error = getSizeArgs[2]
    act(() => {
      success(460, 460)
    })
    act(() => {
      error?.(new Error())
    })
    getSizeMock.mockRestore()
  })
})

describe('getUrl', () => {
  it('returns empty if no url is provided', () => {
    expect.assertions(1)
    const url = utils.getUrl('hi')
    expect(url).toBe('')
  })

  it('handles links', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out https://yahoo.com')
    expect(url).toBe('https://yahoo.com')
  })

  it('forces https', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out http://yahoo.com')
    expect(url).toBe('https://yahoo.com')
  })

  it('handles links with query params', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out https://yahoo.com?query=param')
    expect(url).toBe('https://yahoo.com?query=param')
  })

  it('handles links with query params and hash', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out https://yahoo.com?query=param#hash')
    expect(url).toBe('https://yahoo.com?query=param#hash')
  })

  it('ignores text that look like an absolute link', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out yahoo.com')
    expect(url).toBe('')
  })

  it('handles links that include a redirect', () => {
    expect.assertions(1)
    const url = utils.getUrl(
      'check out https://yahoo.com?redirect=https://google.com'
    )
    expect(url).toBe('https://yahoo.com?redirect=https://google.com')
  })

  it('handles inputs with non-link grammar', () => {
    expect.assertions(1)
    const url = utils.getUrl('I will be there tonight.it works for me')
    expect(url).toBe('')
  })

  it('handles links with IP address', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out https://192.168.0.1')
    expect(url).toBe('https://192.168.0.1')
  })

  it('handles links with port number', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out https://yahoo.com:8080')
    expect(url).toBe('https://yahoo.com:8080')
  })

  it('handles links with unsupported protocol', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out ftp://yahoo.com')
    expect(url).toBe('')
  })

  it('returns first link from input with multiple links', () => {
    expect.assertions(1)
    const url = utils.getUrl(
      'check out https://yahoo.com and https://google.com'
    )
    expect(url).toBe('https://yahoo.com')
  })

  it('ignores emails', () => {
    expect.assertions(1)
    const url = utils.getUrl('hi bill@ms.com and steve@ms.com are going')
    expect(url).toBe('')
  })

  it('ignores email handles link', () => {
    expect.assertions(1)
    const url = utils.getUrl('check out https://yahoo.com for me bill@ms.com')
    expect(url).toBe('https://yahoo.com')
  })

  it('ignores mentions', () => {
    expect.assertions(1)
    const url = utils.getUrl('hi @[Bill Gates (ms.com)] are you going?')
    expect(url).toBe('')
  })

  it('ignores mention, handles link', () => {
    expect.assertions(1)
    const url = utils.getUrl(
      'hey @[Bill Gates (ms.com)] check out https://yahoo.com'
    )
    expect(url).toBe('https://yahoo.com')
  })
})

describe('oneOf', () => {
  it('returns a truthy param', () => {
    expect.assertions(1)
    const param = utils.oneOf(() => 'truthy', 'falsy')()
    expect(param).toBe('truthy')
  })

  it('returns a falsy param', () => {
    expect.assertions(1)
    const param = utils.oneOf(undefined, 'falsy')()
    expect(param).toBe('falsy')
  })
})
