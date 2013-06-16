var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var engine = require('engine.io'),
    ReadWriteStream = require('godot').common.ReadWriteStream;

//
// Use an event emitter to manage connected sockets
//
var sockets = new EventEmitter();

module.exports = function (server) {
  var EngineIO = function () {
    if (!(this instanceof EngineIO)) {
      return new EngineIO(server);
    }

    ReadWriteStream.call(this);

    var e = engine.attach(server);

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
  util.inherits(EngineIO, ReadWriteStream);

  EngineIO.prototype.write = function (data) {
    sockets.emit('data', JSON.stringify(data));
  };

  return EngineIO;
};
