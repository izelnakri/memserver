'use strict';

function response(statusCode=200, data={}, headers={}) {
  return [
    statusCode, Object.assign({ 'Content-Type': 'application/json' }, headers), JSON.stringify(data)
  ];
}

module.exports = response;
