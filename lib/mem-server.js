import fs from 'fs';
import chalk from 'chalk';
import stringUtils from 'ember-cli-string-utils';

const inflect = require('i')(); // NOTE: make this ES6 import
const ENVIRONMENT_IS_NODE = typeof global === 'object';
const ENVIRONMENT_IS_BROWSER = !ENVIRONMENT_IS_NODE;

if (!fs.existsSync('memserver')) {
  throw new Error(chalk.red('/memserver folder doesn\'t exist for this directory!'));
} else if (!fs.existsSync('memserver/models')) {
  throw new Error(chalk.red('/memserver/models folder doesn\'t exist for this directory!'));
} else if (!fs.existsSync('memserver/server.js')) {
  throw new Error(chalk.red('/memserver/server.js doesn\'t exist for this directory!'));
}

const Server = require(`${process.cwd()}/memserver/server`).default; // NOTE: make this ES6 import
const modelFileNames = fs.readdirSync(`${process.cwd()}/memserver/models`);
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
      console.log('REQUEST:\n', request);
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

    result[ModelName] = require(`${process.cwd()}/memserver/models/${modelFileName}`).default; // NOTE: make this ES6 import
    result[ModelName].modelName = ModelName;

    return result;
  }, {});
}

function resetDatabase(models) {
  // NOTE: maybe also eliminate duplicates
  return Object.keys(models).reduce((result, modelName) => {
    const fileName = stringUtils.dasherize(inflect.pluralize(modelName));
    const path = `${process.cwd()}/memserver/fixtures/${fileName}.js`;

    if (!fs.existsSync(path)) {
      result[modelName] = []

      return result;
    }

    const fixtureModels = require(path).default; // NOTE: make this ES6 import

    if (fixtureModels.length === 0) {
      result[modelName] = []

      return result;
    }

    const modelPrimaryKey = fixtureModels.reduce((existingPrimaryKey, model) => {
      const primaryKey = getModelPrimaryKey(model, existingPrimaryKey, modelName);

      if (!primaryKey) {
        throw new Error(chalk.red(`MemServer DATABASE ERROR: At least one of your ${modelName} fixtures missing a primary key. Please make sure all your ${modelName} fixtures have either id or uuid primaryKey`));
      }

      return primaryKey;
    }, null);

    targetNamespace.MemServer.Models[modelName].primaryKey = modelPrimaryKey;
    result[modelName] = fixtureModels;

    return result;
  }, {});
}


function getModelPrimaryKey(model, existingPrimaryKeyType, modelName) {
  if (!existingPrimaryKeyType) {
    const primaryKey = model.id || model.uuid;

    if (!primaryKey) {
      return;
    }

    existingPrimaryKeyType = model.id ? 'id' : 'uuid';

    return primaryKeyTypeCheck(existingPrimaryKeyType, primaryKey, modelName);
  }

  return primaryKeyTypeCheck(existingPrimaryKeyType, model[existingPrimaryKeyType], modelName);
}

// NOTE: move this to utils
function primaryKeyTypeCheck(targetPrimaryKeyType, primaryKey, modelName) {
  const primaryKeyType = typeof primaryKey;

  if (targetPrimaryKeyType === 'id' && (primaryKeyType !== 'number')) {
    throw new Error(chalk.red(`MemServer ${modelName} model primaryKeyType is 'id'. Instead you've tried to enter id: ${primaryKey} with ${primaryKeyType} type`));
  } else if (targetPrimaryKeyType === 'uuid' && (primaryKeyType !== 'string')) {
    throw new Error(chalk.red(`MemServer ${modelName} model primaryKeyType is 'uuid'. Instead you've tried to enter uuid: ${primaryKey} with ${primaryKeyType} type`));
  }

  return targetPrimaryKeyType;
}

// TODO: BUILD A CLI
