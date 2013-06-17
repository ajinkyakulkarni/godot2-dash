var util = require('util'),
    Stream = require('stream').Stream,
    EventEmitter = require('events').EventEmitter;

var engine = require('engine.io');

//
// Use an event emitter to manage connected sockets
//
var sockets = new EventEmitter();

module.exports = function (server) {
  var EngineIO = function () {
    if (!(this instanceof EngineIO)) {
      return new EngineIO(server);
    }

    var e = engine.attach(server);

    Stream.call(this);

    this.readable = true;
    this.writable = true;

    this.setMaxListeners(0);

    //
    // Add/remove sockets to/from EventEmitter
    //
    e.on('connection', function (socket) {
      sockets.on('data', listener);
      socket.on('close', function () {
        sockets.removeListener('data', listener);
      });

      function listener(data) {
        socket.send(data);
      };
    });
  };
  util.inherits(EngineIO, Stream);

  EngineIO.prototype.write = function (data) {
    sockets.emit('data', JSON.stringify(data));
  };

  EngineIO.prototype.end = function () {
    this.emit('end');
  };

  return EngineIO;
};


