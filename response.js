require('babel-register')({
  presets: ['env']
});

const Response = require('./lib/response').default;

module.exports = Response;
