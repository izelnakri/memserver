import fs from 'fs';
import chalk from 'ansi-colors';
import emberCliStringUtils from 'ember-cli-string-utils';
import Inflector from 'i';
import jsdom from 'jsdom';
import { createRequire } from 'module';
import { fileURLToPath as fromURL } from 'url';

const require = createRequire(import.meta.url);

const { classify, dasherize } = emberCliStringUtils;
const { pluralize } = Inflector();
const { JSDOM } = jsdom;
const dom = new JSDOM('<p>Hello</p>', { url: 'http://localhost' });
const CWD = process.cwd();

global.window = dom.window;
global.document = window.document;
global.self = window.self;

console.log('Runnninnng');

if (!fs.existsSync(`${CWD}/memserver`)) {
  throw new Error(chalk.red('/memserver folder doesn\'t exist for this directory!'));
} else if (!fs.existsSync(`${CWD}/memserver/models`)) {
  throw new Error(chalk.red('/memserver/models folder doesn\'t exist for this directory!'));
} else if (!fs.existsSync(`${CWD}/memserver/server.js`)) {
  throw new Error(chalk.red('/memserver/server.js doesn\'t exist for this directory!'));
}

async function main() {
  window.FakeXMLHttpRequest = require('fake-xml-http-request').default;
  window.RouteRecognizer = require('route-recognizer').default;

  const modelFileNames = fs.readdirSync(`${CWD}/memserver/models`);

  // let Server;
  // let initializer;
  let { Server, initializer } = {
    Server: (await import(`${CWD}/memserver/server.js`)).default, // NOTE: these have to be loaded async
    initializer: (await import(`${CWD}/memserver/initializer.js`)).default
  }

  const modelFixtureTree = await modelFileNames.reduce(async (tree, fileName) => {
    // Server = Server ||  (await import(`${CWD}/memserver/server.js`)).default; // NOTE: these have to be loaded async
    // initializer = initializer || (await import(`${CWD}/memserver/initializer.js`)).default;

    const modelName = fileName.slice(0, -3);
    const fixturePath = `${CWD}/memserver/fixtures/${dasherize(pluralize(modelName))}.js`;

    return Object.assign(tree, {
      [classify(modelName)]: {
        model: (await import(`${CWD}/memserver/models/${fileName}`)).default,
        fixtures: (await getFixtures(fixturePath))
      }
    });
  }, {});

  console.log('Server is', Server);
  console.log('modelFixtureTree is', modelFixtureTree);
  let MEMSERVER = require('./mem-server-cjs.js');

  return MEMSERVER(modelFixtureTree, Server, initializer);
};

void (async function() {
  export default await main();
})();

async function getFixtures(fixturePath) {
  if (await fs.exists(fixturePath)) {
    return (await import(fixturePath)).default;
  }

  return [];
}
