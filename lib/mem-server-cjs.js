'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var chalk = _interopDefault(require('chalk'));
var FakeXMLHttpRequest = _interopDefault(require('fake-xml-http-request'));
var RouteRecognizer = _interopDefault(require('route-recognizer'));
require('pretender');
var qs = _interopDefault(require('qs'));
var Inflector = _interopDefault(require('i'));
var stringUtils = _interopDefault(require('ember-cli-string-utils'));

function primaryKeyTypeSafetyCheck(targetPrimaryKeyType, primaryKey, modelName) {
  const primaryKeyType = typeof primaryKey;

  if (targetPrimaryKeyType === 'id' && (primaryKeyType !== 'number')) {
    throw new Error(chalk.red(`[MemServer] ${modelName} model primaryKey type is 'id'. Instead you've tried to enter id: ${primaryKey} with ${primaryKeyType} type`));
  } else if (targetPrimaryKeyType === 'uuid' && (primaryKeyType !== 'string')) {
    throw new Error(chalk.red(`[MemServer] ${modelName} model primaryKey type is 'uuid'. Instead you've tried to enter uuid: ${primaryKey} with ${primaryKeyType} type`));
  }

  return targetPrimaryKeyType;
}

const targetNamespace$1 = typeof global === 'object' ? global : window;
const DEFAULT_PASSTHROUGHS = [
  'http://localhost:0/chromecheckurl', 'http://localhost:30820/socket.io'
];

var startServer = function(Server, options={}) {
  window.Pretender.prototype.namespace = options.namespace;
  window.Pretender.prototype.urlPrefix = options.urlPrefix;
  window.Pretender.prototype.timing = options.timing;

  let pretender$$1 = new window.Pretender(function() {
    const MemServer = chalk.cyan('[MemServer]');

    if (options.logging) {
      this.handledRequest = function(verb, path, request) {
        const method = verb.toUpperCase();

        console.log(MemServer, colorStatusCode(request.status), method, request.url);

        if (['POST', 'PUT'].includes(method)) {
          console.log(`${method} REQUEST BODY IS:`, request.params);
        }

        console.log(JSON.parse(request.responseText));
      };
      this.passthroughRequest = function(verb, path, request) {
        console.log(MemServer, chalk.yellow('[PASSTHROUGH]'), verb, request.url);
      };
    }

    this.unhandledRequest = function(verb, path, request) {
      console.log(MemServer, chalk.red('[UNHANDLED REQUEST]', verb, path));
      console.log(chalk.red('UNHANDLED REQUEST WAS:\n'), request);
      console.log(request);
    };
  }, { trackRequests: false });

  // HACK: Pretender this.passthrough for better UX
  // TODO: this doesnt passthrough full http:// https://
  pretender$$1.passthrough = function(url) {
    const parent = window.Pretender.prototype;
    const verbs = ['get', 'post', 'put', 'delete'];

    if (!url) {
      ['/**', '/', '/*'].forEach((path) => {
        verbs.forEach((verb) => pretender$$1[verb](path, parent.passthrough));
      });

      return;
    }

    const fullUrl = (this.urlPrefix || '') + (this.namespace ? ('/' + this.namespace) : '') + url;

    verbs.forEach((verb) => pretender$$1[verb](fullUrl, parent.passthrough));
  };

  DEFAULT_PASSTHROUGHS.forEach((url) => pretender$$1.passthrough(url));
  // END: Pretender this.passthrough for better UX

  Server.apply(pretender$$1, [targetNamespace$1.MemServer.Models]);

  return pretender$$1;
};

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  } else if (statusCode === 404 || statusCode === 204) {
    return chalk.cyan(statusCode);
  }

  return chalk.red(statusCode);
}

const { classify } = stringUtils;
const { singularize } = Inflector();
const targetNamespace$2 = typeof global === 'object' ? global : window;

// HACK START: Pretender Request Parameter Type Casting Hack: Because types are important.
window.Pretender.prototype._handlerFor = function(verb, url, request) {
  var registry = this.hosts.forURL(url)[verb];

  var matches = registry.recognize(window.Pretender.parseURL(url).fullpath);
  var match = matches ? matches[0] : null;
  var headers = request.requestHeaders || {};

  if (match) {
    request.headers = headers;
    request.params = Object.keys(match.params).reduce((result, key) => {
      var value = castCorrectType(match.params[key]);

      return Object.assign(result, { [key]: value });
    }, {});
    request.queryParams = Object.keys(matches.queryParams).reduce((result, key) => {
      var targetValue = castCorrectType(matches.queryParams[key]);

      return Object.assign(result, { [key]: targetValue });
    }, {});

    var contentHeader = request.headers['Content-Type'] || request.headers['content-type'];

    if (request.requestBody && contentHeader && contentHeader.includes('application/json')) {
      request.params = Object.assign(request.params, JSON.parse(request.requestBody));
    } else {
      request.params = Object.assign(request.params, qs.parse(request.requestBody ));
    }
  }

  return match;
};

function castCorrectType(value) {
  if (Array.isArray(value)) {
    return value.map((element) => castCorrectType(element));
  } else if (parseInt(value, 10)) {
    return parseInt(value, 10);
  } else if (value === 'false') {
    return false;
  } else if (value === 'true') {
    return true;
  } else if (value === '') {
    return null;
  } else if (typeof value === 'object') {
    return Object.keys(value).reduce((object, key) => {
      return Object.assign(object, { [key]: value[key] === '' ? null : value[key] });
    }, {});
  }

  return value;
}
// END: Pretender Request Parameter Type Casting Hack

// HACK START: Pretender Response Defaults UX Hack: Because Pretender Response types suck UX-wise.
window.Pretender.prototype.handleRequest = function(request) {
  var pretender$$1 = this;
  var verb = request.method.toUpperCase();
  var path = request.url;
  var handler = pretender$$1._handlerFor(verb, path, request);

  var _handleRequest = function(result) {
    var statusCode, headers, body;

    if (Array.isArray(result) && result.length === 3) {
      statusCode = result[0];
      headers = pretender$$1.prepareHeaders(result[1]);
      body = pretender$$1.prepareBody(result[2], headers);

      return pretender$$1.handleResponse(request, async, function() {
        request.respond(statusCode, headers, body);
        pretender$$1.handledRequest(verb, path, request);
      });
    } else if (!result) {
      headers = pretender$$1.prepareHeaders({ 'Content-Type': 'application/json' });

      if (verb === 'DELETE') {
        return pretender$$1.handleResponse(request, async, function() {
          request.respond(204, headers, pretender$$1.prepareBody('{}', headers));
          pretender$$1.handledRequest(verb, path, request);
        });
      }

      return pretender$$1.handleResponse(request, async, function() {
        request.respond(500, headers, pretender$$1.prepareBody(JSON.stringify({
          error: `[MemServer] ${verb} ${path} route handler did not return anything to respond to the request!`
        }), headers));
        pretender$$1.handledRequest(verb, path, request);
      });
    }

    statusCode = getDefaultStatusCode(verb);
    headers = pretender$$1.prepareHeaders({ 'Content-Type': 'application/json' });
    var targetResult = typeof result === 'string' ? result : JSON.stringify(result);
    body = pretender$$1.prepareBody(targetResult, headers);

    return pretender$$1.handleResponse(request, async, function() {
      request.respond(statusCode, headers, body);
      pretender$$1.handledRequest(verb, path, request);
    });
  };

  if (handler) {
    var async = handler.handler.async;
    handler.handler.numberOfCalls++;
    this.handledRequests.push(request);

    var result = handler.handler(request);

    if (result && typeof result.then === 'function') { // `result` is a promise, resolve it
      result.then(function(resolvedResult) { _handleRequest(resolvedResult); });
    } else {
      _handleRequest(result);
    }
  } else {
    if (!this.disableUnhandled) {
      this.unhandledRequests.push(request);
      this.unhandledRequest(verb, path, request);
    }
  }
};

function getDefaultStatusCode(verb) {
  if (['GET', 'PUT', 'PATCH'].includes(verb)) {
    return 200;
  } else if (verb === 'POST') {
    return 201;
  } else if (verb === 'DELETE') {
    return 204;
  }

  return 500;
}
// END: Pretender Response Defaults UX Hack


// HACK: Pretender REST defaults hack: For better UX
['get', 'put', 'post', 'delete'].forEach((verb) => {
  window.Pretender.prototype[verb] = function(path, handler, async) {
    const fullPath = (this.urlPrefix || '') + (this.namespace ? ('/' + this.namespace) : '') + path;
    const targetHandler = handler || getDefaultRouteHandler(verb.toUpperCase(), fullPath);
    const timing = async ? async.timing || this.timing : this.timing;
    // console.log('timing is', timing);
    // console.log('async is', async);
    return this.register(verb.toUpperCase(), fullPath, targetHandler, timing);
  };
});
// END: Pretender REST default hack: For better UX

function getDefaultRouteHandler(verb, path) {
  const paths = path.split(/\//g);
  const lastPath = paths[paths.length - 1];
  const pluralResourceName = lastPath.includes(':') ? paths[paths.length - 2] : lastPath;
  const resourceName = singularize(pluralResourceName);
  const ResourceModel = targetNamespace$2.MemServer.Models[classify(resourceName)];

  if (!ResourceModel) {
    throw new Error(chalk.red(`[MemServer] ${verb} ${path} route handler cannot be generated automatically: ${classify(resourceName)} is not a valid MemServer.Model, please check that your route name matches the model reference or create a custom handler function`));
  } else if (verb === 'GET') {
    if (lastPath.includes(':')) {
      return (request) => {
        return { [resourceName]: ResourceModel.serializer(ResourceModel.find(request.params.id)) };
      };
    }

    return () => {
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
    return (request) => { ResourceModel.delete({ id: request.params.id }); };
  }
}

const ENVIRONMENT_IS_NODE = typeof global === 'object';
const targetNamespace = ENVIRONMENT_IS_NODE ? global : window;

if (ENVIRONMENT_IS_NODE) {
  global.self = window.self;
}

window.FakeXMLHttpRequest = FakeXMLHttpRequest;
window.RouteRecognizer = RouteRecognizer;

var memServer = function(modelFixtureTree, Server, initializer=() => {}) {
  if (!Server) {
    throw new Error('memserver/server.js doesnt exist! Please create a memserver/server.js to use MemServer');
  }

  targetNamespace.MemServer = {
    DB: {},
    Server: {},
    Models: registerModels(modelFixtureTree),
    start(options={ logging: true }) {
      this.DB = resetDatabase(this.Models, modelFixtureTree);
      this.Server = startServer(Server, options);

      initializer(this.Models);

      return this;
    },
    shutdown() {
      this.Server.shutdown();
      this.DB = {};

      return this;
    }
  };

  return targetNamespace.MemServer;
};

function registerModels(modelFixtureTree) {
  return Object.keys(modelFixtureTree).reduce((result, ModelName) => {
    result[ModelName] = Object.assign(modelFixtureTree[ModelName].model, {
      modelName: ModelName,
      primaryKey: null,
      attributes: Object.keys(modelFixtureTree[ModelName].model.defaultAttributes)
    });

    return result;
  }, {});
}

function resetDatabase(models, modelFixtureTree) {
  return Object.keys(models).reduce((result, modelName) => {
    result[modelName] = Array.from(modelFixtureTree[modelName].fixtures);

    const modelPrimaryKey = result[modelName].reduce(([existingPrimaryKey, primaryKeys], model) => {
      const primaryKey = getModelPrimaryKey(model, existingPrimaryKey, modelName);

      if (!primaryKey) {
        throw new Error(chalk.red(`[MemServer] DATABASE ERROR: At least one of your ${modelName} fixtures missing a primary key. Please make sure all your ${modelName} fixtures have either id or uuid primaryKey`));
      } else if (primaryKeys.includes(model[primaryKey])) {
        throw new Error(chalk.red(`[MemServer] DATABASE ERROR: Duplication in ${modelName} fixtures with ${primaryKey}: ${model[primaryKey]}`));
      }

      const existingAttributes = targetNamespace.MemServer.Models[modelName].attributes;

      Object.keys(model).forEach((key) => {
        if (!existingAttributes.includes(key)) {
          targetNamespace.MemServer.Models[modelName].attributes.push(key);
        }
      });

      return [primaryKey, primaryKeys.concat([model[primaryKey]])];
    }, [targetNamespace.MemServer.Models[modelName].primaryKey, []])[0];

    targetNamespace.MemServer.Models[modelName].primaryKey = modelPrimaryKey;

    return result;
  }, {});
}

function getModelPrimaryKey(model, existingPrimaryKeyType, modelName) {
  if (existingPrimaryKeyType) {
    return primaryKeyTypeSafetyCheck(existingPrimaryKeyType, model[existingPrimaryKeyType], modelName);
  }

  const primaryKey = model.id || model.uuid;

  if (!primaryKey) {
    return;
  }

  existingPrimaryKeyType = model.id ? 'id' : 'uuid';

  return primaryKeyTypeSafetyCheck(existingPrimaryKeyType, primaryKey, modelName);
}

module.exports = memServer;
