var http = require('http');

var createMiddleware = require('./lib/middleware'),
    createReactor = require('./lib/reactor');

var dash = module.exports = {};

dash.createServer = function (options) {
  var server = http.createServer(createMiddleware(options));

  var reactor = createReactor({ server: server });

  server.reactor = reactor;

  return server;
}

dash.createMiddleware = createMiddleware;
dash.createReactor = createReactor;
