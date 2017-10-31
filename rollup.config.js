// NOTE: banner + footer can fix it
// TODO: footer puts the tree and the server!!

import fs from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';

// const modelFileNames = fs.readdirSync(`${process.cwd()}/memserver/models`);
// console.log('modelFileNames are:');
// console.log(modelFileNames);

export default {
  input: 'lib/mem-server.js',
  output: {
    file: 'dist/lol.js',
    format: 'iife'
  },
  name: 'MEMSERVER',
  plugins: [
    resolve({
      jsnext: true,
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/ember-cli-string-utils/index.js': ['classify', 'underscore', 'dasherize'],
        'node_modules/ember-inflector/index.js': ['singularize', 'pluralize']
      }
    }),
    globals(),
    builtins()
  ]
};
