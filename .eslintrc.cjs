/* eslint-env node */
module.exports = {
  root: true,
  'parser': 'vue-eslint-parser',
  'parserOptions': {
    'parser': '@typescript-eslint/parser',
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  extends: [
    'plugin:vue/vue3-strongly-recommended',
    '@vue/airbnb',
  ],
  plugins: ['@typescript-eslint'],
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
      112,
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
    'object-curly-newline': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        '': 'never',
        'js': 'never',
        'jsx': 'never',
        'ts': 'never',
        'tsx': 'never',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    'camelcase': 'off',
    'no-undef': 'warn',
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src/']],
        extensions: ['.js', '.vue'],
      },
      typescript: {
        alwaysTryTypes: true, // fix .ts imports
      },
    },
  },
}
