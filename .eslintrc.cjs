/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
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
    'no-alert': 'off',
    'vue/html-button-has-type': 'off',
    'guard-for-in': 'off',
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-underscore-dangle': 'off',
    'arrow-body-style': 'off',
    'import/prefer-default-export': 'off',
    'quote-props': 'off',
  },
};
