require('babel-register')({
  presets: ['env']
});

const fs = require('fs');
const chalk = require('chalk');
const { classify, dasherize } = require('ember-cli-string-utils');
const Inflector = require('i');

const { pluralize } = Inflector();

const JSDOM = require('jsdom').JSDOM;
const dom = new JSDOM('<p>Hello</p>', { url: 'http://localhost' });
const CWD = process.cwd();

global.window = dom.window;
global.document = window.document;
global.self = window.self;

window.FakeXMLHttpRequest = require('fake-xml-http-request');
window.RouteRecognizer = require('route-recognizer');

if (!fs.existsSync(`${CWD}/memserver`)) {
  throw new Error(chalk.red('/memserver folder doesn\'t exist for this directory!'));
} else if (!fs.existsSync(`${CWD}/memserver/models`)) {
  throw new Error(chalk.red('/memserver/models folder doesn\'t exist for this directory!'));
} else if (!fs.existsSync(`${CWD}/memserver/server.js`)) {
  throw new Error(chalk.red('/memserver/server.js doesn\'t exist for this directory!'));
}

const modelFileNames = fs.readdirSync(`${process.cwd()}/memserver/models`);
const modelFixtureTree = modelFileNames.reduce((tree, fileName) => {
  const modelName = fileName.slice(0, -3);
  const fixturePath = `${CWD}/memserver/fixtures/${dasherize(pluralize(modelName))}.js`;

  return Object.assign(tree, {
    [classify(modelName)]: {
      model: require(`${CWD}/memserver/models/${fileName}`).default,
      fixtures: fs.existsSync(fixturePath) ? require(fixturePath).default : []
    }
  });
}, {});

let MEMSERVER = require('./mem-server-cjs.js');
const Server = require(`${CWD}/memserver/server`).default;
const initializer_path = `${CWD}/memserver/initializer.js`;
const initializer = fs.existsSync(initializer_path) ? require(initializer_path).default : () => {};

module.exports = MEMSERVER(modelFixtureTree, Server, initializer);
