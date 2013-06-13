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

Returns an object with two properties:

* server: An HTTP server with the dashboard loaded, engine.io attached, and
  ready to listen.
* reactor: A godot reactor initialized and ready to be passed to godot

Usage looks something like this:

```js
var godot = require('godot'),
    dash = require('godot-dash');

var dashboard = dash.createServer();

godot.createServer({
  type: 'tcp',
  reactors: [
    dashboard.reactor(godot)
  ]
}).listen(1337);

dashboard.listen(1338);
```

If you want to use the dash in your own middleware stack, you can create the
middleware and reactor separately using `dash.createMiddleware` and
`dash.createReactor` individually.

### dash.createMiddleware(options)

Returns a middleware. Options are the same as those of `dash.createServer`.

### dash.createReactor(server)

Returns a function used for creating a reactor. Pass in a server to attach
engine.io to.

#### reactor(godot)

Returns a reactor. Pass in an instance of godot to register the reactor with.

# License

MIT
