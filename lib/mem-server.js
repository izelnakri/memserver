import fs from 'fs';
import chalk from 'chalk';
import stringUtils from 'ember-cli-string-utils';

const inflect = require('i')(); // NOTE: make this ES6 import

if (!fs.existsSync('memserver')) {
  throw new Error(chalk.red('/memserver folder doesn\'t exist for this directory!'));
}

const modelFileNames = fs.readdirSync('memserver/models');
const Models = modelFileNames.reduce((result, modelFileName) => {
  const ModelName = stringUtils.classify(modelFileName.slice(0, -3));

  result[ModelName] = require(`./memserver/models/${modelFileName}`).default; // NOTE: make this ES6 import
  result[ModelName].modelName = ModelName;
  return result;
}, {});

const DB = Object.keys(Models).reduce((result, modelName) => {
  console.log('modelName is', modelName);
  const fileName = stringUtils.dasherize(inflect.pluralize(modelName));
  console.log('fileName is', fileName);
  const path = `./memserver/fixtures/${fileName}.js`;

  if (fs.existsSync(path)) {
    result[modelName] = require(path).default; // NOTE: make this ES6 import
    // TODO: maybe check ids must exist and all of them are integers
  }

  return result;
}, {});


export default {
  DB: DB,
  Models: Models,
  Pretender: {},
  Routes: [],
  start(options) {
    delete this.start;
    
    return this;
  },
  shutdown() {

  }
}


// BUILD A CLI
