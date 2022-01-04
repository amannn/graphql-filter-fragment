require('eslint-config-molindo/setupPlugins');

module.exports = {
  extends: ['molindo/typescript'],
  rules: {
    'no-prototype-builtins': 'off'
  }
};
