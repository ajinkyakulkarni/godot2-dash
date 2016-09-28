util   = require "util"
url    = require "url"
stream = require "readable-stream"
engine = require "engine.io"
Parser = require "riemann-query-parser/stream"
extend = util._extend


class EngineIOReactor extends stream.PassThrough
  constructor: (@server, options = {}) ->
    super extend options, objectMode: true

    @engine = engine.attach @server
    @engine.on "connection", @attachToSocket

  attachToSocket: (socket) =>
    {query} = url.parse socket.request.url, true
    {query} = query
    return socket.close() unless query

    try
      filter = new Parser query
    catch e
      console.error e
      return socket.close()

    @pipe filter, end: false
    filter.on "data", (data) ->
      socket.send JSON.stringify data
    socket.on "close", =>
      @unpipe filter
      filter.removeAllListeners "data"


module.exports = EngineIOReactor
