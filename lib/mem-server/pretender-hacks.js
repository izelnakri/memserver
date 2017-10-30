import qs from 'qs';

// HACK START: Pretender Request Parameter Type Casting Hack: Because types are important.
window.Pretender.prototype._handlerFor = function(verb, url, request) {
  var registry = this.hosts.forURL(url)[verb];

  var matches = registry.recognize(window.Pretender.parseURL(url).fullpath);
  var match = matches ? matches[0] : null;

  if (match) {
    request.headers = request.requestHeaders;
    request.params = Object.keys(match.params).reduce((result, key) => {
      var value = match.params[key];

      return Object.assign(result, { [key]: parseInt(value, 10) || value });
    }, {});
    request.queryParams = Object.keys(matches.queryParams).reduce((result, key) => {
      var value = matches.queryParams[key];
      var targetValue = castCorrectType(value);

      return Object.assign(result, { [key]: targetValue });
    }, {});

    if (request.requestBody && request.requestHeaders['Content-Type'] === 'application/json') {
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
  }

  return value;
}
// END: Pretender Request Parameter Type Casting Hack

// HACK START: Pretender Response Defaults UX Hack: Because Pretender Response types suck UX-wise.
window.Pretender.prototype.handleRequest = function(request) {
  var pretender = this;
  var verb = request.method.toUpperCase();
  var path = request.url;
  var handler = pretender._handlerFor(verb, path, request);

  var _handleRequest = function(result) {
    if (Array.isArray(result) && result.length === 3) {
      var statusCode = result[0];
      var headers = pretender.prepareHeaders(result[1]);
      var body = pretender.prepareBody(result[2], headers);

      return pretender.handleResponse(request, async, function() {
        request.respond(statusCode, headers, body);
        pretender.handledRequest(verb, path, request);
      })
    } else if (!result) {
      var headers = pretender.prepareHeaders({ 'Content-Type': 'application/json' });

      if (verb === 'DELETE') {
        return pretender.handleResponse(request, async, function() {
          request.respond(204, headers, pretender.prepareBody('{}', headers));
          pretender.handledRequest(verb, path, request);
        })
      }

      return pretender.handleResponse(request, async, function() {
        request.respond(500, headers, pretender.prepareBody({
          error: 'MemServer didnt handle this route!'
        }, headers));
        pretender.handledRequest(verb, path, request);
      });
    }

    var statusCode = getDefaultStatusCode(verb);
    var headers = pretender.prepareHeaders({ 'Content-Type': 'application/json' });
    var targetResult = typeof result === 'string' ? result : JSON.stringify(result);
    var body = pretender.prepareBody(targetResult, headers);

    return pretender.handleResponse(request, async, function() {
      request.respond(statusCode, headers, body);
      pretender.handledRequest(verb, path, request);
    })
  }

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
}

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
