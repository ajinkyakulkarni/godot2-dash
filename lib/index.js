var path = require('path');

var ecstatic = require('ecstatic');

var dash = module.exports = function createDash(options) {

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

  return function dash(req, res, next) {
    next = next || function (err) {
      if (err) {
        throw err;
      }
    };

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
          config.save(function (err, conf) {
            if (err) {
              return next(err);
            }
            json(res, conf);
          });
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
    res.end(JSON.stringify(obj, true, 2));
  }
};
