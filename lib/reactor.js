var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var engine = require('engine.io'),
    ReadWriteStream = require('godot').common.ReadWriteStream;

//
// ### function EngineIO (options)
// #### @options {Object} Options for sending email.
// ####   @options.port     {Number} Port for engine.io to listen on.
// ####   @options.host     {String} Optional host to listen on.
// ####   @options.server   {Object} Custom webserver to use.
// Constructor function for the EngineIO stream responsible for re-emitting data
// events over engine.io.
//
var EngineIO = function EngineIO(options) {

  if (!options.server && !options.port && !options.engine) {
    throw new Error(
      'options.port, options.server or options.engine is required'
    );
  }

  var self = this;

  ReadWriteStream.call(this);

  if (options.engine) {
    this.engine = options.engine;
  }
  else if (options.server) {
    this.engine = engine.attach(options.server);
  }
  else {
    this.engine = engine.listen(options.port, options.host, options.backlog);
  }

  //
  // Use an event emitter to manage connected sockets
  //
  this._sockets = new EventEmitter();
  this.engine.on('connection', function (socket) {
    var listener = function (data) {
      socket.send(data);
    };
    self._sockets.on('data', listener);

    socket.on('close', function () {
      self._sockets.removeListener('data', listener);
    });

  });
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
  this._sockets.emit('data', JSON.stringify(data));
};

//
// Takes an instance of godot to avoid the "two versions of godot" problem
//
var createReactor = module.exports = function (options) {

  var io = engine.attach(options.server);

  //
  // TODO: Handle engine.io connect/disconnect logic here, since reactors are
  // instantiated lazily
  //

  return function (godot) {
    godot.reactor.register('engineIO', EngineIO);
    return godot.reactor().engineIO({ engine: io });
  };
}

createReactor.EngineIO = EngineIO;
