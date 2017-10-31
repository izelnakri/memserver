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

global.self = window.self;

require('pretender');
require('./pretender-hacks.js');

const MemServer = require('./mem-server.js').default;

module.exports = MemServer;

// this.get('/lol', this.passthrough);
