import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';

export default {
  input: 'lib/mem-server.js',
  output: {
    file: 'dist/lol.js',
    format: 'iife'
  },
  name: 'memserver',
  plugins: [
    resolve({
      jsnext: true,
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/ember-cli-string-utils/index.js': ['classify', 'underscore'],
        'node_modules/ember-inflector/index.js': ['singularize', 'pluralize']
      }
    }),
    globals(),
    builtins()
  ]
};
