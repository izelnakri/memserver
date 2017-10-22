import fs from 'fs';
import chalk from 'chalk';
import stringUtils from 'ember-cli-string-utils';

const inflect = require('i')(); // NOTE: make this ES6 import
const ENVIRONMENT_IS_NODE = typeof global === 'object';
const ENVIRONMENT_IS_BROWSER = !ENVIRONMENT_IS_NODE;

if (!fs.existsSync('memserver')) {
  throw new Error(chalk.red('/memserver folder doesn\'t exist for this directory!'));
}

const modelFileNames = fs.readdirSync('memserver/models');
const targetNamespace = ENVIRONMENT_IS_NODE ? global : window;

targetNamespace.MemServer = {
  DB: {},
  Pretender: {},
  Routes: [],
  Models: registerModels(modelFileNames),
  start(options) {
    this.DB = resetDatabase(this.Models);
    delete this.start;

    return this;
  },
  shutdown() {

  }
};

export default MemServer;

function registerModels(modelFileNames) {
  return modelFileNames.reduce((result, modelFileName) => {
    const ModelName = stringUtils.classify(modelFileName.slice(0, -3));

    result[ModelName] = require(`./memserver/models/${modelFileName}`).default; // NOTE: make this ES6 import
    result[ModelName].modelName = ModelName;
    return result;
  }, {});
}

function resetDatabase(models) {
  return Object.keys(models).reduce((result, modelName) => {
    const fileName = stringUtils.dasherize(inflect.pluralize(modelName));
    const path = `./memserver/fixtures/${fileName}.js`;

    if (fs.existsSync(path)) {
      result[modelName] = require(path).default; // NOTE: make this ES6 import
      // TODO: maybe check ids must exist and all of them are integers
    } else {
      result[modelName] = []
    }

    return result;
  }, {});
}

// BUILD A CLI
