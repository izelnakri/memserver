mocha --retries 3
mocha ./test/cli
mocha ./test/server/mem-server.server.js
mocha ./test/server/mem-server.server.defaults.js
mocha ./test/server/mem-server.server.passthrough.js
mocha ./test/server/mem-server.server.config.js
