var http = require('http');

var createMiddleware = require('./middleware'),
    createReactor = require('./reactor');

var dash = module.exports = {};

dash.createServer = function (options) {
  var server = http.createServer(createMiddleware(options));

  var reactor = createReactor({ server: server });

  return {
    server: server,
    reactor: reactor
  };
}

dash.createMiddleware = createMiddleware;
dash.createReactor = createReactor;
