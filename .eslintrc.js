module.exports = {
  env: {
    jest: true,
  },
  extends: [
    '@react-native-community',
    'plugin:jest/all',
    'plugin:prettier/recommended',
  ],
  plugins: ['simple-import-sort', 'jest', '@typescript-eslint'],
  root: true,
  parser: '@typescript-eslint/parser',
  rules: {
    'import/order': 'off',
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
    'sort-imports': 'off',
  },
}
