require('@babel/register')({
  presets: ['@babel/preset-env']
});

import fs from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import Inflector from 'i';
import { classify, dasherize } from 'ember-cli-string-utils';
import virtual from 'rollup-plugin-virtual';

const CWD = process.cwd();
const { pluralize } = Inflector();

const modelFileNames = fs.readdirSync(`${CWD}/memserver/models`);
const targetMemServerPath = `${CWD}/memserver/server.js`;

if (!fs.existsSync(targetMemServerPath)) {
  throw new Error('memserver/server.js doesnt exist! Please create a memserver/server.js to use MemServer');
}

const IS_DEVELOPMENT = process.env.BUILD === 'development';
const targetInput = IS_DEVELOPMENT ? 'lib/browser.js' : `${require.resolve('memserver')}/../browser.js`;

export default {
  input: targetInput,
  output: {
    file: IS_DEVELOPMENT ? 'dist/memserver.dist.js' : `${CWD}/dist/memserver.dist.js`,
    format: 'iife'
  },
  name: 'MEMSERVER',
  footer: 'window.MemServer = MEMSERVER;',
  plugins: [
    virtual({
      '_memserver_models': generateInMemoryModelsImport(modelFileNames),
      '_memserver_fixtures': generateInMemoryFixturesImport(modelFileNames),
      '_memserver_initializer': generateInitializerImport(),
      '_memserver': `
        import server from '${CWD}/memserver/server';
        export default server;`
    }),
    resolve({ jsnext: true }),
    commonjs({
      include: IS_DEVELOPMENT ? 'node_modules/**' : [
        `${require.resolve('memserver')}/../../node_modules/**`, 'node_modules/**'
      ],
      namedExports: {
        'node_modules/ember-cli-string-utils/index.js': ['classify', 'underscore', 'dasherize'],
        'node_modules/ember-inflector/index.js': ['singularize', 'pluralize']
      }
    }),
    globals(),
    builtins()
  ]
};

function generateInMemoryFixturesImport(modelFileNames) {
  const imports = modelFileNames.reduce((codeText, modelFileName) => {
    const modelName = classify(modelFileName.slice(0, -3));

    return codeText + `import ${modelName} from '${CWD}/memserver/fixtures/${dasherize(pluralize(modelName))}';`;
  }, '');

  return imports.concat(createObjectFromModels(modelFileNames));
}

function generateInMemoryModelsImport(modelFileNames) {
  const imports = modelFileNames.reduce((codeText, modelFileName) => {
    const modelName = classify(modelFileName.slice(0, -3));

    return codeText + `import ${modelName} from '${CWD}/memserver/models/${modelFileName}';`;
  }, '');

  return imports.concat(createObjectFromModels(modelFileNames));
}

function createObjectFromModels(modelFileNames) {
  return 'export default { ' + modelFileNames.reduce((codeText, modelFileName) => {
    const modelName = classify(modelFileName.slice(0, -3));

    if (codeText === '') {
      return modelName;
    }

    return [codeText, modelName].join(', ');
  }, '') + ' };';
}

function generateInitializerImport() {
  const initializerExists = fs.existsSync(`${CWD}/memserver/initializer`);

  if (initializerExists) {
    return `import server from '${CWD}/memserver/server';
            export default server;`;
  }

  return 'export default function(Models) {};';
}
