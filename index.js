var fs = require('fs');
var zlib = require('zlib');
var tar = require('tar-fs');
var path = require('path');
var log = require('bestikk-log');

var FS = function() {
}

FS.prototype.removeSync = function(dir) {
  var files = [];
  var bfs = this;
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir);
    files.forEach(function(file){
      var curPath = dir + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        bfs.removeSync(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
};

// https://github.com/jprichardson/node-fs-extra/blob/master/lib/mkdirs/mkdirs-sync.js
FS.prototype.mkdirsSync = function(p, made) {
  p = path.resolve(p);
  try {
    fs.mkdirSync(p);
    made = made || p;
  } catch (err0) {
    switch (err0.code) {
      case 'ENOENT' :
        made = this.mkdirsSync(path.dirname(p), made);
        this.mkdirsSync(p, made);
        break;

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        var stat;
        try {
          stat = fs.statSync(p);
        } catch (err1) {
          throw err0;
        }
        if (!stat.isDirectory()) throw err0;
        break;
    }
  }
  return made;
}

FS.prototype.copySync = function(src, dest) {
  var bfs = this;
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    fs.readdirSync(src).forEach(function(childItemName) {
      bfs.copySync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    this.mkdirsSync(path.dirname(dest));
    var data = fs.readFileSync(src);
    log.transform('copy', src, dest);
    fs.writeFileSync(dest, data);
  }
};

FS.prototype.walk = function(dir, callback) {
  var bfs = this;
  fs.readdirSync(dir).forEach(function(name) {
    var filePath = path.join(dir, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      bfs.walk(filePath, callback);
    }
  });
};

FS.prototype.untar = function(source, baseDirName, destinationDir, callback) {
  log.transform('untar', source, destinationDir + '/' + baseDirName); 
  var stream = fs.createReadStream(source).pipe(zlib.createGunzip()).pipe(tar.extract(destinationDir, {
    map: function (header) {
      // REMIND Do NOT user path.sep!
      // In this case, even on Windows, the separator is '/'.
      var paths = header.name.split('/');
      // replace base directory with 'baseDirName'
      paths.shift();
      paths.unshift(baseDirName);
      header.name = paths.join('/');
      return header;
    }
  }));
  stream.on('finish', function () {
    callback();
  });
};

FS.prototype.concatSync = function(files, destination) {
  var fs = require('fs');
  var buffers = [];
  var filesLength = files.length;
  for (var i = 0; i < filesLength; i++) {
    var buffer = fs.readFileSync(files[i]);
    if (i == (files.length - 1)) {
      buffers.push(buffer);
    } else {
      buffers.push(Buffer.concat([buffer, new Buffer('\n')]));
    }
  }
  fs.writeFileSync(destination, Buffer.concat(buffers));
};

FS.prototype.copyToDirSync = function(from, toDir) {
  var basename = path.basename(from);
  this.copySync(from, path.join(toDir, basename));
};

module.exports = new FS();
