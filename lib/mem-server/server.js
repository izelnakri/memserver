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

    this.unhandledRequest = function(verb, path, request) {
      console.log(MemServer, chalk.red('[UNHANDLED REQUEST]', verb, path));
      console.log(chalk.red('UNHANDLED REQUEST WAS:\n'), request);
      console.log(request);
    }
  });

  // HACK: Pretender REST defaults hack: For better UX
  ['get', 'put', 'post', 'delete'].forEach((verb) => {
    window.Pretender.prototype[verb] = function (path, handler, async) {
      const { urlPrefix, namespace } = options; // NOTE: this doesnt allow for this.namespace declaration in the server.js
      const fullPath = (urlPrefix || '') + (namespace ? ('/' + namespace) : '') + path;
      const targetHandler = handler || getDefaultRouteHandler(verb, fullPath);

      return this.register(verb, fullPath, targetHandler, async || options.timing);
    }
  });
  // END: Pretender REST default hack: FOr better UX

  // NOTE: maybe passthrough() api here
  // NOTE: maybe this.resource()

  Server.apply(pretender, [global.MemServer.Models]);

  return pretender;
}

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  }

  return chalk.red(statusCode);
}

function getDefaultRouteHandler(verb, path) {
  const paths = path.split(/\//g);
  const resourceReference = paths[paths.length - 1];
  const ResourceModel = undefined; // TODO: change this
  // TODO: if resourceModel not found throw error?

  if (verb === 'GET') {
    if (resourceReference.includes(':')) {
      return (request) => {
        const resourceKey = undefined; // TODO

        return { [resourceKey]: ResourceModel.serialize(ResourceModel.find(request.params.id)) };
      }
    }

    return (request) => {
      return { [resourceReference]: ResourceModel.serialize(ResourceModel.findAll()) };
    };
  } else if (verb === 'POST') {
    return (request) => {
      return { [resourceReference]: ResourceModel.serialize(ResourceModel.insert(request.params)) };
    };
  } else if (verb === 'PUT') {
    return (request) => {
      const resourceKey = undefined; // TODO

      return { [resourceKey]: ResourceModel.serialize(ResourceModel.update(request.params)) };
    };
  } else if (verb === 'DELETE') {
    return (request) => { ResourceModel.delete(request.params) };
  }
}


// TODO:
// const defaultPassthroughs = [
//   'http://localhost:0/chromecheckurl', // mobile chrome
//   'http://localhost:30820/socket.io' // electron
// ];

// NOTE: maybe do { trackRequests: false }

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
