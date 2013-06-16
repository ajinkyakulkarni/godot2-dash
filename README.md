# Godot-Dash

A javascript, engine.io-powered dashboard for Godot. A port of riemann-dash
from ruby/sinatra to node.js.

# Get started

``` bash
$ sudo npm install godot-dash -g
$ godot-dash
```

Then open http://localhost:1338 in a browser.

# API

## dash.createServer(options)

Use this if you want to just create a dashboard server with minimal ceremony.

Takes an options hash with the following properties:

* mount: Where to mount the dashboard (defaults to `/`)
* config: File location for the config file (defaults to
  ./godot-dash/config.json )

Returns an HTTP server with an extra method, `register`.

Usage looks something like this:

```js
var godot = require('godot'),
    dash = require('godot-dash');

var dashboard = dash
  .createServer()
  .register(godot)
;

godot.createServer({
  type: 'tcp',
  reactors: [
    godot.reactor()
      .dashboard()
  ]
}).listen(1337);

dashboard.listen(1338);
```

### server.register(godot)

Register the dashboard reactor with godot, as "dashboard". Returns `server`.

### dash.middleware(options)

Returns a middleware. Options are the same as those of `dash.createServer`. You
can use this if you want to add the godot dashboard to an existing middleware
stack without creating a new server.

### dash.reactor(server)

Returns a reactor constructor. Pass in an http server to attach
engine.io to. You can use this in conjunction with `dash.middleware` to add the
dashboard to an existing middleware stack.

In order to use a third-party godot reactor, one must register it with godot
by running something like:

```js

var Dashboard = dash.reactor(server); // server is an http server

godot.reactor.register('dashboard', Dashboard);
```

# License

MIT
