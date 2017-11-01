require('babel-register')({
  presets: ['env']
});

import fs from 'fs';
import util from 'util';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import Inflector from 'i';
import { classify, dasherize } from 'ember-cli-string-utils';

import JSToCode from './js-to-code';

const { pluralize } = Inflector();

const modelFileNames = fs.readdirSync(`${process.cwd()}/memserver/models`);
const targetMemServerPath = `${process.cwd()}/memserver/server.js`;

if (!fs.existsSync(targetMemServerPath)) {
  throw new Error('memserver/server.js doesnt exist! Please create a memserver/server.js to use MemServer');
}

const targetMemServer = require(targetMemServerPath).default;
const modelFixtureTree = modelFileNames.reduce((tree, fileName) => {
  const modelName = fileName.slice(0, -3);
  const fixturePath = `${process.cwd()}/memserver/fixtures/${dasherize(pluralize(modelName))}.js`;

  return Object.assign(tree, {
    [classify(modelName)]: {
      model: require(`${process.cwd()}/memserver/models/${fileName}`).default,
      fixtures: fs.existsSync(fixturePath) ? require(fixturePath).default : []
    }
  });
}, {});
const modelFixtureTreeCode = '{' + modelFileNames.reduce((string, modelFileName) => {
  const modelName = classify(modelFileName.slice(0, -3));

  return string + `${modelName}: {
      model: ${JSToCode(modelFixtureTree[modelName].model)},
      fixtures: ${util.inspect(modelFixtureTree[modelName].fixtures, { depth: null })}
   }`
}, '') + `}`;

// TODO: INVESTIGATE ROLLUP: inject targetMemServer, modelFixtureTree from NODE -> BROWSER without dynamic import problem

export default {
  input: 'lib/mem-server.js',
  output: {
    file: 'dist/lol.js',
    format: 'iife'
  },
  name: 'MEMSERVER',
  footer: `
    const targetNamespace = typeof global === 'object' ? global : window;
    window.MemServer = MEMSERVER(${modelFixtureTreeCode}, ${targetMemServer})
  `,
  plugins: [
    resolve({ jsnext: true }),
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
