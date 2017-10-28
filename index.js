#! /usr/bin/env node
require('babel-register')({
  presets: ['env']
});

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

// window.self = window; // NOTE: maybe removing this is dangerous
global.self = window.self;

require('pretender');

const MemServer = require('./lib/mem-server.js').default;

module.exports = MemServer;


// let server = new window.Pretender(function(){
//   this.get('/photos', (request) => {
//     var all =  JSON.stringify(Object.keys(PHOTOS).map((k) => PHOTOS[k]));
//     return [200, {'Content-Type': 'application/json'}, all];
//   });
//
//   this.get('/photos/:id', (request) => {
//     return [200, {'Content-Type': 'application/json'}, JSON.stringify(PHOTOS[request.params.id])];
//   });
//
//   this.get('/lol', this.passthrough);
// });
//
// server.handledRequest = function(verb, path, request) {
//   console.log(chalk.cyan('MemServer'), chalk.green('[HANDLED]'), verb, path, colorStatusCode(request.status));
//   console.log(JSON.parse(request.responseText));
// }
//
// server.passthroughRequest = function(verb, path, request) {
//   console.log(chalk.cyan('MemServer'), chalk.yellow('[PASSTHROUGH]'), verb, path);
// }
//
// server.unhandledRequest = function(verb, path, request) {
//   console.log(chalk.cyan('MemServer'), chalk.red('[UNHANDLED REQUEST]', verb, path));
//   console.log('REQUEST:');
//   console.log(request);
// }

// window.$.getJSON('/photos/10');
// window.$.getJSON('/lol');
