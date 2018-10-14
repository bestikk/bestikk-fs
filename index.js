const fs = require('fs')
const zlib = require('zlib')
const tar = require('tar-fs')
const path = require('path')
const log = require('bestikk-log')

const FS = function () {
}

FS.prototype.removeSync = function (dir) {
  let files = []
  const bfs = this
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir)
    files.forEach(function (file) {
      var curPath = dir + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        bfs.removeSync(curPath)
      } else { // delete file
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(dir)
  }
}

// https://github.com/jprichardson/node-fs-extra/blob/master/lib/mkdirs/mkdirs-sync.js
FS.prototype.mkdirsSync = function (p, made) {
  p = path.resolve(p)
  try {
    fs.mkdirSync(p)
    made = made || p
  } catch (err0) {
    switch (err0.code) {
      case 'ENOENT' :
        made = this.mkdirsSync(path.dirname(p), made)
        this.mkdirsSync(p, made)
        break

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        let stat
        try {
          stat = fs.statSync(p)
        } catch (err1) {
          throw err0
        }
        if (!stat.isDirectory()) throw err0
        break
    }
  }
  return made
}

FS.prototype.copySync = function (src, dest) {
  const bfs = this
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()
  if (exists && isDirectory) {
    fs.readdirSync(src).forEach(function (childItemName) {
      bfs.copySync(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    this.mkdirsSync(path.dirname(dest))
    const data = fs.readFileSync(src)
    log.transform('copy', src, dest)
    fs.writeFileSync(dest, data)
  }
}

FS.prototype.walk = function (dir, action) {
  const bfs = this
  fs.readdirSync(dir).forEach(function (name) {
    const filePath = path.join(dir, name)
    const stat = fs.statSync(filePath)
    if (stat.isFile()) {
      action(filePath, stat)
    } else if (stat.isDirectory()) {
      bfs.walk(filePath, action)
    }
  })
}

FS.prototype.untar = function (source, baseDirName, destinationDir) {
  log.transform('untar', source, destinationDir + '/' + baseDirName)
  const stream = fs.createReadStream(source).pipe(zlib.createGunzip()).pipe(tar.extract(destinationDir, {
    map: function (header) {
      // REMIND Do NOT user path.sep!
      // In this case, even on Windows, the separator is '/'.
      var paths = header.name.split('/')
      // replace base directory with 'baseDirName'
      paths.shift()
      paths.unshift(baseDirName)
      header.name = paths.join('/')
      return header
    }
  }))
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

FS.prototype.concatSync = function (files, destination) {
  const buffers = []
  const filesLength = files.length
  for (var i = 0; i < filesLength; i++) {
    const buffer = fs.readFileSync(files[i])
    if (i === (files.length - 1)) {
      buffers.push(buffer)
    } else {
      buffers.push(Buffer.concat([buffer, Buffer.from('\n')]))
    }
  }
  fs.writeFileSync(destination, Buffer.concat(buffers))
}

FS.prototype.copyToDirSync = function (from, toDir) {
  const basename = path.basename(from)
  this.copySync(from, path.join(toDir, basename))
}

FS.prototype.updateFileSync = function (file, regexp, newSubString) {
  log.debug('update ' + file)
  const data = fs.readFileSync(file, 'utf8')
  const dataUpdated = data.replace(regexp, newSubString)
  fs.writeFileSync(file, dataUpdated, 'utf8')
}

module.exports = new FS()
