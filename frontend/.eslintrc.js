module.exports = {
  extends: ['../.eslintrc.js'],
  plugins: ['react', 'react-hooks'],
  extends: [
    '../.eslintrc.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  },
  env: {
    browser: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};