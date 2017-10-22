// require('@std/esm');
// pry = require('pryjs');

const ENVIRONMENT_IS_NODE = typeof global === 'object';
const ENVIRONMENT_IS_BROWSER = !ENVIRONMENT_IS_NODE;
const chalk = require('chalk');

const JSDOM = require('jsdom').JSDOM;
const dom = new JSDOM(`<p>Hello</p>`, { url: 'http://localhost' });

global.window = dom.window;
global.document = window.document;

window.FakeXMLHttpRequest = require('fake-xml-http-request');
window.RouteRecognizer = require('route-recognizer');
window.$ = require('jquery');

window.self = window;
global.self = window.self;

require('pretender');

// register models

// register fixtures

// scenario starts

// configurations

// register routes

let PHOTOS = {
  '10': {
    id: 10,
    src: 'http://media.giphy.com/media/UdqUo8xvEcvgA/giphy.gif'
  },
  '42': {
    id: 42,
    src: 'http://media0.giphy.com/media/Ko2pyD26RdYRi/giphy.gif'
  }
};

let server = new window.Pretender(function(){
  this.get('/photos', (request) => {
    var all =  JSON.stringify(Object.keys(PHOTOS).map((k) => PHOTOS[k]));
    return [200, {'Content-Type': 'application/json'}, all];
  });

  this.get('/photos/:id', (request) => {
    return [200, {'Content-Type': 'application/json'}, JSON.stringify(PHOTOS[request.params.id])];
  });

  this.get('/lol', this.passthrough);
});

server.handledRequest = function(verb, path, request) {
  console.log(chalk.cyan('MemServer'), chalk.green('[HANDLED]'), verb, path, colorStatusCode(request.status));
  console.log(JSON.parse(request.responseText));
}

server.passthroughRequest = function(verb, path, request) {
  console.log(chalk.cyan('MemServer'), chalk.yellow('[PASSTHROUGH]'), verb, path);
}

server.unhandledRequest = function(verb, path, request) {
  console.log(chalk.cyan('MemServer'), chalk.red('[UNHANDLED REQUEST]', verb, path));
  console.log('REQUEST:');
  console.log(request);
}

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  }

  return chalk.red(statusCode);
}


window.$.getJSON('/photos/10');
window.$.getJSON('/lol');

// setTimeout(() => console.log('done'), 10000);


// export function start() {
//
//   // parse all the models
//
//
//   // inject all the fixture data to memory
//
//   // parse and inject pretender routes
//
//   // NOTE: do we need shutdown?
//
//   // returns db and routes
// }


// NOTE: namespace addition, this.timing, this.logging, this.passthrough, this.loadFixtures(?)
// this.pretender
