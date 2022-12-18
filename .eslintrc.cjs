/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-strongly-recommended',
    '@vue/airbnb',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-plusplus': 'off',
    'vuejs-accessibility/form-control-has-label': 'off',
    'prefer-destructuring': 'off',
    'no-multi-str': 'off',
    'vue/html-quotes': ['error', 'double', { avoidEscape: false }],
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/html-button-has-type': 'off',
    'guard-for-in': 'off',
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-underscore-dangle': 'off',
    'arrow-body-style': 'off',
    'import/prefer-default-export': 'off',
    'quote-props': 'off',
    'complexity': ['error', 9],
    'semi': ['error', 'never'],
    'vue/max-len': [
      'error',
      110,
      2,
      {
        'ignoreUrls': true,
        'ignoreComments': false,
        'ignoreRegExpLiterals': true,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true,
        'ignoreHTMLAttributeValues': true,
        'ignoreHTMLTextContents': false,
      },
    ],

    'curly': 'error',
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src/']],
        extensions: ['.js', '.vue'],
      },
    },
  },
}
