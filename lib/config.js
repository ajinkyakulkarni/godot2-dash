var fs = require('fs'),
    path = require('path');

module.exports = function config(fname) {
  var filename = path.resolve(fname);
 
  return {
    save: function save(data, cb) {
      if (typeof data !== 'string') {
        data = JSON.stringify(data, true, 2);
      }

      fs.writeFile(filename, data, function (err) {
        cb(err, data);
      });
    },
    load: function load(cb) {
      fs.readFile(filename, function (err, buff) {
        if (err) {
          return cb(err);
        }
        try {
          cb(null, JSON.parse(buff.toString()));
        }
        catch (err) {
          cb(err);
        }
      });
    }
  };
};
