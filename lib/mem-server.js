import chalk from 'chalk';
import { primaryKeyTypeSafetyCheck } from './utils';

const ENVIRONMENT_IS_NODE = typeof global === 'object';
const targetNamespace = ENVIRONMENT_IS_NODE ? global : window;

global.self = window.self;

import FakeXMLHttpRequest from 'fake-xml-http-request';
import RouteRecognizer from 'route-recognizer';

window.FakeXMLHttpRequest = FakeXMLHttpRequest;
window.RouteRecognizer = RouteRecognizer;

import 'pretender';
import './pretender-hacks.js';

import startServer from './server';

export default function(modelFixtureTree, Server, initializer=() => {}) {
  if (!Server) {
    throw new Error('memserver/server.js doesnt exist! Please create a memserver/server.js to use MemServer');
  }

  targetNamespace.MemServer = {
    DB: {},
    Server: {},
    Models: registerModels(modelFixtureTree),
    start(options={ logging: true }) {
      this.DB = resetDatabase(this.Models, modelFixtureTree);
      this.Server = startServer(Server, options);

      initializer(this.Models);

      return this;
    },
    shutdown() {
      this.Server.shutdown();

      return this;
    }
  };

  return targetNamespace.MemServer;
}

function registerModels(modelFixtureTree) {
  return Object.keys(modelFixtureTree).reduce((result, ModelName) => {
    result[ModelName] = Object.assign(modelFixtureTree[ModelName].model, {
      modelName: ModelName,
      primaryKey: null,
      attributes: Object.keys(modelFixtureTree[ModelName].model.defaultAttributes)
    });

    return result;
  }, {});
}

function resetDatabase(models, modelFixtureTree) {
  return Object.keys(models).reduce((result, modelName) => {
    result[modelName] = modelFixtureTree[modelName].fixtures;

    const modelPrimaryKey = result[modelName].reduce(([existingPrimaryKey, primaryKeys], model) => {
      const primaryKey = getModelPrimaryKey(model, existingPrimaryKey, modelName);

      if (!primaryKey) {
        throw new Error(chalk.red(`[MemServer] DATABASE ERROR: At least one of your ${modelName} fixtures missing a primary key. Please make sure all your ${modelName} fixtures have either id or uuid primaryKey`));
      } else if (primaryKeys.includes(model[primaryKey])) {
        throw new Error(chalk.red(`[MemServer] DATABASE ERROR: Duplication in ${modelName} fixtures with ${primaryKey}: ${model[primaryKey]}`));
      }

      const existingAttributes = targetNamespace.MemServer.Models[modelName].attributes;

      Object.keys(model).forEach((key) => {
        if (!existingAttributes.includes(key)) {
          targetNamespace.MemServer.Models[modelName].attributes.push(key);
        }
      });

      return [primaryKey, primaryKeys.concat([model[primaryKey]])];
    }, [null, []])[0];

    targetNamespace.MemServer.Models[modelName].primaryKey = modelPrimaryKey;

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

    return primaryKeyTypeSafetyCheck(existingPrimaryKeyType, primaryKey, modelName);
  }

  return primaryKeyTypeSafetyCheck(existingPrimaryKeyType, model[existingPrimaryKeyType], modelName);
}
