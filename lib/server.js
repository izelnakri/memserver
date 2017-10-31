import chalk from 'chalk';
import { classify, underscore } from 'ember-cli-string-utils';
import { pluralize, singularize } from 'ember-inflector'; // NOTE: this probably aint working

const targetNamespace = typeof global === 'object' ? global : window;
const DEFAULT_PASSTHROUGHS = [
  'http://localhost:0/chromecheckurl', 'http://localhost:30820/socket.io'
];

export default function(options={}) {
  const Server = require(`${process.cwd()}/memserver/server`).default; // NOTE: make this ES6 import

  window.Pretender.prototype.namespace = options.namespace;
  window.Pretender.prototype.urlPrefix = options.urlPrefix;
  window.Pretender.prototype.timing = options.timing;

  // HACK: Pretender REST defaults hack: For better UX
  ['get', 'put', 'post', 'delete'].forEach((verb) => {
    window.Pretender.prototype[verb] = function (path, handler, async) {
      const fullPath = (this.urlPrefix || '') + (this.namespace ? ('/' + this.namespace) : '') + path;
      const targetHandler = handler || getDefaultRouteHandler(verb.toUpperCase(), fullPath);
      const timing = async ? async.timing || this.timing : this.timing;
      // console.log('timing is', timing);
      // console.log('async is', async);
      return this.register(verb.toUpperCase(), fullPath, targetHandler, timing);
    }
  });
  // END: Pretender REST default hack: For better UX

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

  // HACK: Pretender this.passthrough for better UX
  pretender.passthrough = function(url) {
    const parent = window.Pretender.prototype;
    const verbs = ['get', 'post', 'put', 'delete'];

    if (!url) {
      ['/**', '/'].forEach((path) => {
        verbs.forEach((verb) => pretender[verb](path, parent.passthrough));
      });

      return;
    }

    const fullUrl = (this.urlPrefix || '') + (this.namespace ? ('/' + this.namespace) : '') + url;

    verbs.forEach((verb) => pretender[verb](fullUrl, parent.passthrough));
  }

  DEFAULT_PASSTHROUGHS.forEach((url) => pretender.passthrough(url));
  // END: Pretender this.passthrough for better UX

  Server.apply(pretender, [global.MemServer.Models]);

  return pretender;
}

function getDefaultRouteHandler(verb, path) {
  const paths = path.split(/\//g);
  const lastPath = paths[paths.length - 1];
  const pluralResourceName = lastPath.includes(':') ? paths[paths.length - 2] : lastPath;
  const resourceName = singularize(pluralResourceName);
  const ResourceModel = targetNamespace.MemServer.Models[classify(resourceName)];

  if (!ResourceModel) {
    throw new Error(chalk.red(`[MemServer] ${verb} ${path} route handler cannot be generated automatically: ${classify(resourceName)} is not a valid MemServer.Model, please check that your route name matches the model reference or create a custom handler function`));
  } else if (verb === 'GET') {
    if (lastPath.includes(':')) {
      return (request) => {
        return { [resourceName]: ResourceModel.serializer(ResourceModel.find(request.params.id)) };
      }
    }

    return (request) => {
      return { [pluralResourceName]: ResourceModel.serializer(ResourceModel.findAll()) };
    };
  } else if (verb === 'POST') {
    return (request) => {
      const resourceParams = request.params[resourceName];

      return { [resourceName]: ResourceModel.serializer(ResourceModel.insert(resourceParams)) };
    };
  } else if (verb === 'PUT') {
    return (request) => {
      const resourceParams = request.params[resourceName];

      return { [resourceName]: ResourceModel.serializer(ResourceModel.update(resourceParams)) };
    };
  } else if (verb === 'DELETE') {
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
