var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var engine = require('engine.io'),
    ReadWriteStream = require('godot').common.ReadWriteStream;

//
// Use an event emitter to manage connected sockets
//
var sockets = new EventEmitter();

//
// ### function EngineIO (options)
// #### @engine {Object} An engine.io server
// Constructor function for the EngineIO stream responsible for re-emitting data
// events over engine.io.
//
var EngineIO = function EngineIO(engine) {
  ReadWriteStream.call(this);
  this.engine = engine;
};

//
// Inherit from ReadWriteStream.
//
util.inherits(EngineIO, ReadWriteStream);

//
// ### function write (data)
// #### @data {Object} Data to emit over engine.io.
// Emit the specified data over engine.io.
//
EngineIO.prototype.write = function (data) {
  sockets.emit('data', JSON.stringify(data));
};

//
// Takes an instance of godot to avoid the "two versions of godot" problem
//
var createReactor = module.exports = function (options) {

  var server = engine.attach(options.server);

  //
  // Add/remove sockets to/from EventEmitter
  //
  server.on('connection', function (socket) {
    sockets.on('data', listener);
    socket.on('close', function () {
      sockets.removeListener('data', listener);
    });

    function listener(data) {
      socket.send(data);
    };
  });

  return function (godot) {
    godot.reactor.register('engineIO', EngineIO);
    return godot.reactor().engineIO(server);
  };
}

createReactor.EngineIO = EngineIO;
