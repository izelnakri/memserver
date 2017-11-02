require('babel-register')({
  presets: ['env']
});

const Model = require('./lib/model').default;

module.exports = Model;
