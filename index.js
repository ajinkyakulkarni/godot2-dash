var http = require('http');

var middleware = require('./lib/middleware'),
    reactor = require('./lib/reactor');

var dash = module.exports = {};

dash.createServer = function (options) {
  var server = http.createServer(middleware(options));

  server.register = function (godot) {
    godot.reactor.register('dashboard', reactor(server));
    return server;
  };

  return server;
}

dash.middleware = middleware;
dash.reactor = reactor;
