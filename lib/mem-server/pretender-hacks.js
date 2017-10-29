// HACK START: Pretender Request Parameter Type Casting Hack: Because types are important.
window.Pretender.prototype._handlerFor = function(verb, url, request) {
  var registry = this.hosts.forURL(url)[verb];
  var matches = registry.recognize(window.Pretender.parseURL(url).fullpath);
  var match = matches ? matches[0] : null;

  if (match) {
    request.params = Object.keys(match.params).reduce((result, key) => {
      var value = match.params[key];

      return Object.assign(result, { [key]: parseInt(value, 10) || value });
    }, {});
    request.queryParams = Object.keys(matches.queryParams).reduce((result, key) => {
      var value = matches.queryParams[key];

      return Object.assign(result, { [key]: parseInt(value, 10) || value });
    }, {});
  }

  return match;
};
// END: Pretender Request Parameter Type Casting Hack

// HACK START: Pretender Response Defaults UX Hack: Because Pretender Response types suck UX-wise.
window.Pretender.prototype.handleRequest = function(request) {
  var pretender = this;
  var verb = request.method.toUpperCase();
  var path = request.url;
  var handler = this._handlerFor(verb, path, request);

  console.log('HANDLER REQUST IS CALLED');
  console.log('handler:');
  console.log(handler);
  var _handleRequest = function(result) {
    var statusCode, headers, body;
    if (Array.isArray(result) && result.length === 3) {
      statusCode = result[0],
      headers = pretender.prepareHeaders(result[1]),
      body = pretender.prepareBody(result[2], headers);

      return pretender.handleResponse(request, async, function() {
        request.respond(statusCode, headers, body);
        pretender.handledRequest(verb, path, request);
      })
    } else if (!result) {
      if (verb === 'DELETE') {
        headers = pretender.prepareHeaders({ 'Content-Type': 'application/json' });

        return pretender.handleResponse(request, async, function() {
          request.respond(204, headers, pretender.prepareBody({}, headers));
          pretender.handledRequest(verb, path, request);
        })
      }

      throw new Error('Nothing returned by handler for ' + path +
        '. Remember to return something in your route handler.');
    }

    var targetResult = typeof result === 'string' ? result : JSON.stringify(result);

    statusCode = getDefaultStatusCode(verb);
    headers = pretender.prepareHeaders({ 'Content-Type': 'application/json' });
    body = pretender.prepareBody(targetResult, headers);
    console.log('UPCOMING RESPONSE PARAMS', statusCode, headers, body);
    pretender.handleResponse(request, async, function() {
      request.respond(statusCode, headers, body);
      pretender.handledRequest(verb, path, request);
    })
  }

  if (handler) {
    handler.handler.numberOfCalls++;
    var async = handler.handler.async;
    this.handledRequests.push(request);

    try {
      var result = handler.handler(request);

      if (result && typeof result.then === 'function') { // `result` is a promise, resolve it
        result.then(function(resolvedResult) { _handleRequest(resolvedResult); });
      } else {
        _handleRequest(result);
      }
    } catch (error) {
      this.erroredRequest(verb, path, request, error);
      this.resolve(request);
    }
  } else {
    if (!this.disableUnhandled) {
      this.unhandledRequests.push(request);
      this.unhandledRequest(verb, path, request);
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
}
// END: Pretender Response Defaults UX Hack
