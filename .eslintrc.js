/** @type {import('eslint').Linter.Config} */
module.exports = {
  parserOptions: {
    ecmaVersion: 2021,
  },
  extends: [
    'airbnb-base',
    'plugin:node/recommended',
    'plugin:eslint-comments/recommended',
  ],
  rules: {
    'no-console': 'off',
    'no-plusplus': 'off',
  },
};
