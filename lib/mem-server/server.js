import chalk from 'chalk';

const Server = require(`${process.cwd()}/memserver/server`).default; // NOTE: make this ES6 import

export default function(options) {
  let pretender = new window.Pretender(function() {
    const MemServer = chalk.cyan('[MemServer]');

    if (options.logging) {
      this.handledRequest = function(verb, path, request) {
        console.log(MemServer, colorStatusCode(request.status), verb.toUpperCase(), request.url);
        console.log(JSON.parse(request.responseText));
      }
      this.passthroughRequest = function(verb, path, request) {
        console.log(MemServer, chalk.yellow('[PASSTHROUGH]'), verb, path);
      }
    }

    this.unhandledRequest = function(verb, path, request) { // NOTE: check when this happens
      console.log(MemServer, chalk.red('[UNHANDLED REQUEST]', verb, path));
      console.log(chalk.red('UNHANDLED REQUEST WAS:\n'), request);
      console.log(request);
    }

    this.erroredRequest = function(verb, path, request, error) {
      console.log('erroredRequest');
      console.log('verb', verb);
      console.log('path', path);
      console.log('request', request);
      console.log('error', error);
      // console.warn("There was an error", error);
    }
  });

  Server.apply(pretender, [global.MemServer.Models])
  // eval(pry.it);
  // TODO: intercept Server.get, post, put, delete. put default responses
  return pretender;
}

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  }

  return chalk.red(statusCode);
}

// TODO:
// const defaultPassthroughs = [
//   'http://localhost:0/chromecheckurl', // mobile chrome
//   'http://localhost:30820/socket.io' // electron
// ];

// NOTE: maybe do { trackRequests: false }

// this.namespace = '';
// Note that only routes defined after this.namespace are affected.
// This is useful if you have a few one-off routes that you don’t want under your namespace:


// this.timing = '';
// this.logging
// this.passthrough?
// You can also pass a list of paths, or call passthrough multiple times:
// this.passthrough('http://api.foo.bar/**');
// this.passthrough('http://api.twitter.com/v1/cards/**');

// status code defaults:
// GET is 200
// PUT/PATCH is 200
// POST is 201
// DEL is 204

// routes should also accept timing option that overrides default:
// this.get('/complex_query', () => {
// return [1, 2, 3, 4, 5];
// }, { timing: 3000 });

// this.get('http://api.twitter.com/v1', ...)
// this.urlPrefix = 'https://my.api.com';

// { coalasce: true } ?!?

// this.resource()
