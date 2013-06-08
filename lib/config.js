var fs = require('fs'),
    path = require('path');

module.exports = function config(fname) {
  var filename = path.resolve(fname);
 
  return {
    save: function save(data, cb) {
      fs.writeFile(filename, JSON.stringify(data, true, 2), function (err) {
        cb(err, data);
      });
    },
    load: function load(cb) {
      fs.readFile(filename, function (err, buff) {
        if (err) {
          return cb(err);
        }
        cb(null, JSON.parse(buff.toString()));
      });
    }
  };
};
