import fs from 'fs';
import chalk from 'chalk';
import stringUtils from 'ember-cli-string-utils';

const inflect = require('i')(); // NOTE: make this ES6 import
const ENVIRONMENT_IS_NODE = typeof global === 'object';
const ENVIRONMENT_IS_BROWSER = !ENVIRONMENT_IS_NODE;

if (!fs.existsSync('memserver')) {
  throw new Error(chalk.red('/memserver folder doesn\'t exist for this directory!'));
}

if (!fs.existsSync('memserver/server.js')) {
  throw new Error(chalk.red('/memserver/server.js doesn\'t exist for this directory!'));
}

const Server = require('./memserver/server.js').default; // NOTE: make this ES6 import
const modelFileNames = fs.readdirSync('memserver/models');
const targetNamespace = ENVIRONMENT_IS_NODE ? global : window;

targetNamespace.MemServer = {
  DB: {},
  Pretender: {},
  Models: registerModels(modelFileNames),
  start(options={ logging: true }) {
    this.DB = resetDatabase(this.Models);
    this.Pretender = new window.Pretender(Server); // NOTE: maybe customize it here, make it shorter

    const MemServer = chalk.cyan('MemServer');

    if (options.logging) {
      this.Pretender.handledRequest = function(verb, path, request) {
        console.log(MemServer, verb.toUpperCase(), request.url, colorStatusCode(request.status));
        console.log(JSON.parse(request.responseText));
      }
      this.Pretender.passthroughRequest = function(verb, path, request) {
        console.log(MemServer, chalk.yellow('[PASSTHROUGH]'), verb, path);
      }
    }

    this.Pretender.unhandledRequest = function(verb, path, request) {
      console.log(MemServer, chalk.red('[UNHANDLED REQUEST]', verb, path));
      console.log('REQUEST:');
      console.log(request);
    }

    return this;
  },
  shutdown() {
    this.Pretender.shutdown();

    return this;
  }
};

export default targetNamespace.MemServer;

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  }

  return chalk.red(statusCode);
}

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

// TODO: BUILD A CLI
