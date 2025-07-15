import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        '@babel/runtime/helpers/typeof',
        'html2canvas',
        'core-js/modules/es.promise.js',
        'core-js/modules/es.string.match.js',
        'core-js/modules/es.string.replace.js',
        'core-js/modules/es.string.starts-with.js',
        'core-js/modules/es.array.iterator.js',
        'core-js/modules/web.dom-collections.iterator.js',
        'core-js/modules/es.array.reduce.js',
        'core-js/modules/es.string.ends-with.js',
        'core-js/modules/es.string.split.js',
        'core-js/modules/es.string.trim.js',
        'core-js/modules/es.array.index-of.js',
        'core-js/modules/es.string.includes.js',
        'core-js/modules/es.array.reverse.js',
        'core-js/modules/es.regexp.to-string.js',
        '@babel/runtime/helpers/asyncToGenerator',
        '@babel/runtime/helpers/defineProperty',
        '@babel/runtime/helpers/toPropertyKey',
        '@babel/runtime/helpers/objectWithoutProperties',
        '@babel/runtime/helpers/objectWithoutPropertiesLoose',
        '@babel/runtime/helpers/extends',
        '@babel/runtime/helpers/classCallCheck',
        '@babel/runtime/helpers/createClass',
        '@babel/runtime/helpers/inherits',
        '@babel/runtime/helpers/possibleConstructorReturn',
        '@babel/runtime/helpers/getPrototypeOf',
        '@babel/runtime/helpers/assertThisInitialized',
        '@babel/runtime/helpers/slicedToArray',
        '@babel/runtime/helpers/arrayWithHoles',
        '@babel/runtime/helpers/iterableToArrayLimit',
        '@babel/runtime/helpers/unsupportedIterableToArray',
        '@babel/runtime/helpers/nonIterableRest',
        '@babel/runtime/helpers/regeneratorRuntime',
        '@babel/runtime/helpers/esm/defineProperty',
        '@babel/runtime/helpers/esm/objectWithoutProperties',
        '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose',
        '@babel/runtime/helpers/esm/extends',
        '@babel/runtime/helpers/esm/classCallCheck',
        '@babel/runtime/helpers/esm/createClass',
        '@babel/runtime/helpers/esm/inherits',
        '@babel/runtime/helpers/esm/possibleConstructorReturn',
        '@babel/runtime/helpers/esm/getPrototypeOf',
        '@babel/runtime/helpers/esm/assertThisInitialized',
        '@babel/runtime/helpers/esm/slicedToArray',
        '@babel/runtime/helpers/esm/arrayWithHoles',
        '@babel/runtime/helpers/esm/iterableToArrayLimit',
        '@babel/runtime/helpers/esm/unsupportedIterableToArray',
        '@babel/runtime/helpers/esm/nonIterableRest',
        '@babel/runtime/helpers/esm/regeneratorRuntime',
        './toPropertyKey.js',
        '../node_modules/@babel/runtime/helpers/toPropertyKey.js',
        'jspdf/node_modules/@babel/runtime/helpers/toPropertyKey.js'
      ]
    }
  }
})
