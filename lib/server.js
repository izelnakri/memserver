import chalk from 'chalk';
import { classify, underscore } from 'ember-cli-string-utils';
import Inflector from 'i';

const { pluralize, singularize } = Inflector();
const targetNamespace = typeof global === 'object' ? global : window;
const DEFAULT_PASSTHROUGHS = [
  'http://localhost:0/chromecheckurl', 'http://localhost:30820/socket.io'
];

export default function(Server, options={}) {
  window.Pretender.prototype.namespace = options.namespace;
  window.Pretender.prototype.urlPrefix = options.urlPrefix;
  window.Pretender.prototype.timing = options.timing;

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

  Server.apply(pretender, [targetNamespace.MemServer.Models]);

  return pretender;
}

function colorStatusCode(statusCode) {
  if (statusCode === 200 || statusCode === 201) {
    return chalk.green(statusCode);
  } else if (statusCode === 404 || statusCode === 204) {
    return chalk.cyan(statusCode);
  }

  return chalk.red(statusCode);
}
