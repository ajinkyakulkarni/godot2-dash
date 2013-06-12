var path = require('path');

var ecstatic = require('ecstatic');

module.exports = function createMiddleware(options) {

  options = options || {};

  var mount = options.mount || '/',
      root = options.root || path.resolve(__dirname, '../public'),
      cFile = options.config || path.resolve(__dirname, '../config.json');

  if (mount.slice(-1) !== '/') {
    mount += '/';
  }
  if (mount.slice(0, 1) !== '/') {
    mount = '/' + mount;
  }

  var configRoute = new RegExp('^' + mount + 'config'),
      config = require('./config')(cFile),
      static = ecstatic({ root: root, mount: mount });

  return function middleware(req, res, next) {
    next = next || function (err) {
      //
      // Very basic error handling
      //
      res.setHeader('content-type', 'text/plain');
      if (err) {
        res.statusCode = 500;
        res.end(err.stack);
      }
      else {
        res.statusCode = 404;
        res.end('404 Not Found');
      }
    };

    var conf = '';

    if (req.url.match(configRoute)) {
      switch (req.method) {
        case 'GET':
          config.load(function (err, conf) {
            if (err) {
              if (err.code == 'ENOENT') {
                return json(res, {});
              }
              return next(err);
            }
            json(res, conf);
          });
        break;
        case 'POST':
          if (req.body) {
            conf = req.body;
            save();
          }
          else {
            req.on('data', function (d) {
              conf += d.toString();
            });
            req.on('end', function () {
              try {
                conf = JSON.parse(conf);
              }
              catch (err) {
                return next(err);
              }
              save();
            });
          }

          function save() {
            config.save(conf, function (err, conf) {
              if (err) {
                return next(err);
              }
              json(res, conf);
            });
          }
        break;
        default:
          next();
        break;
      }

      return;
    }

    static(req, res, next);
  };

  function json(res, obj) {
    res.setHeader('content-type', 'application/json');
    try {
      res.end(JSON.stringify(obj, true, 2));
    }
    catch (err) {
      next(err);
    }
  }
};
