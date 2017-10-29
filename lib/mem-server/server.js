import chalk from 'chalk';
import { classify, underscore } from 'ember-cli-string-utils';

const { pluralize, singularize } = require('i')(); // NOTE: move to ES6 imports

const targetNamespace = typeof global === 'object' ? global : window;

export default function(options) {
  const Server = require(`${process.cwd()}/memserver/server`).default; // NOTE: make this ES6 import

  // HACK: Pretender REST defaults hack: For better UX
  ['get', 'put', 'post', 'delete'].forEach((verb) => {
    window.Pretender.prototype[verb] = function (path, handler, async) {
      const { urlPrefix, namespace } = options; // NOTE: this doesnt allow for this.namespace declaration in the server.js
      const fullPath = (urlPrefix || '') + (namespace ? ('/' + namespace) : '') + path;
      const targetHandler = handler || getDefaultRouteHandler(verb.toUpperCase(), fullPath);

      return this.register(verb.toUpperCase(), fullPath, targetHandler, async || options.timing);
    }
  });
  // END: Pretender REST default hack: FOr better UX

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

    this.unhandledRequest = function(verb, path, request) {
      console.log(MemServer, chalk.red('[UNHANDLED REQUEST]', verb, path));
      console.log(chalk.red('UNHANDLED REQUEST WAS:\n'), request);
      console.log(request);
    }
  }, { trackRequests: false });

  // NOTE: maybe passthrough() api here
  // NOTE: maybe this.resource()

  Server.apply(pretender, [global.MemServer.Models]);

  return pretender;
}

function getDefaultRouteHandler(verb, path) {
  const paths = path.split(/\//g);
  const lastPath = paths[paths.length - 1];

  // TODO: if resourceModel not found throw error? with tests

  if (verb === 'GET') {
    if (lastPath.includes(':')) {
      return (request) => {
        const resourceKey = singularize(paths[paths.length - 2]);
        const ResourceModel = targetNamespace.MemServer.Models[classify(resourceKey)];

        return { [resourceKey]: ResourceModel.serializer(ResourceModel.find(request.params.id)) };
      }
    }

    return (request) => {
      const ResourceModel = targetNamespace.MemServer.Models[classify(singularize(lastPath))];

      return { [lastPath]: ResourceModel.serializer(ResourceModel.findAll()) };
    };
  } else if (verb === 'POST') {
    return (request) => {
      const resourceKey = singularize(lastPath);
      const ResourceModel = targetNamespace.MemServer.Models[classify(resourceKey)];
      const resourceParams = request.params[resourceKey];

      return { [resourceKey]: ResourceModel.serializer(ResourceModel.insert(resourceParams)) };
    };
  } else if (verb === 'PUT') {
    return (request) => {
      const resourceKey = singularize(paths[paths.length - 2]);
      const ResourceModel = targetNamespace.MemServer.Models[classify(resourceKey)];
      const resourceParams = request.params[resourceKey];

      return { [resourceKey]: ResourceModel.serializer(ResourceModel.update(resourceParams)) };
    };
  } else if (verb === 'DELETE') {
    const resourceKey = singularize(paths[paths.length - 2]);
    const ResourceModel = targetNamespace.MemServer.Models[classify(resourceKey)];

    return (request) => { ResourceModel.delete({ id: request.params.id }) };
  }
}

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  } else if (statusCode === 404 || statusCode === 204) {
    return chalk.cyan(statusCode);
  }

  return chalk.red(statusCode);
}


// TODO:
// const defaultPassthroughs = [
//   'http://localhost:0/chromecheckurl', // mobile chrome
//   'http://localhost:30820/socket.io' // electron
// ];

// MOTE: Check/test that only routes defined after this.namespace are affected.
// This is useful if you have a few one-off routes that you don’t want under your namespace:

// NOTE: test this.timing = '';
// this.passthrough?

// You can also pass a list of paths, or call passthrough multiple times:
// this.passthrough('http://api.foo.bar/**');
// this.passthrough('http://api.twitter.com/v1/cards/**');

// this.get('http://api.twitter.com/v1', ...)
// this.urlPrefix = 'https://my.api.com';

// { coalasce: true } ?!? // NOTE: definitely test this: typeCasting on queryParams

// this.resource()
