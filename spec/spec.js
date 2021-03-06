const fs = require('fs')
const path = require('path')
const os = require('os')
const chai = require('chai')
const assert = chai.assert

const main = require('../index.js')

describe('Bestikk', function () {
  let TEST_DIR

  beforeEach(function () {
    TEST_DIR = path.join(os.tmpdir(), 'test', 'mkdir')
    main.removeSync(TEST_DIR)
  })

  afterEach(function () {
    main.removeSync(TEST_DIR)
  })

  describe('+ copySync()', function () {
    it('should copy the directory and all its content', function (done) {
      const src = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())
      const dest = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(src))
      assert(!fs.existsSync(dest))
      main.mkdirsSync(src)
      assert(fs.existsSync(src))
      // src/foo
      fs.openSync(path.join(src, 'foo'), 'w')
      // src/bar/baz
      main.mkdirsSync(path.join(src, 'bar'))
      fs.openSync(path.join(src, 'bar', 'baz'), 'w')
      main.copySync(src, dest)
      assert(fs.existsSync(dest))
      assert(fs.existsSync(path.join(dest, 'foo')))
      assert(fs.existsSync(path.join(dest, 'bar')))
      assert(fs.existsSync(path.join(dest, 'bar', 'baz')))

      done()
    })
  })

  describe('+ mkdirsSync()', function () {
    it('should make the directory', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(dir))
      main.mkdirsSync(dir)
      assert(fs.existsSync(dir))

      done()
    })

    it('should make the entire directory path', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())
      const newDir = path.join(dir, 'dfdf', 'ffff', 'aaa')

      assert(!fs.existsSync(newDir))
      main.mkdirsSync(newDir)
      assert(fs.existsSync(newDir))

      done()
    })
  })

  describe('+ removeSync()', function () {
    it('should remove the directory and all its content', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(dir))
      main.mkdirsSync(dir)
      assert(fs.existsSync(dir))
      fs.openSync(path.join(dir, 'foo'), 'w')
      fs.openSync(path.join(dir, 'bar'), 'w')
      fs.openSync(path.join(dir, 'baz'), 'w')
      main.removeSync(dir)
      assert(!fs.existsSync(dir))

      done()
    })
  })

  describe('+ untar()', function () {
    it('should untar the tar file', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())
      assert(!fs.existsSync(dir))
      main.mkdirsSync(dir)
      assert(fs.existsSync(dir))
      main.copySync(path.join(__dirname, 'samples', 'foo.tar.gz'), path.join(dir, 'foo.tar.gz'))
      main.untar(path.join(dir, 'foo.tar.gz'), 'qux', dir)
        .then(() => {
          assert(fs.existsSync(path.join(dir, 'qux')))
          assert(fs.existsSync(path.join(dir, 'qux', 'bar')))
          assert(fs.existsSync(path.join(dir, 'qux', 'baz')))
          done()
        })
    })
  })

  describe('+ walk()', function () {
    it('should walk through the directory', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(dir))
      main.mkdirsSync(dir)
      assert(fs.existsSync(dir))
      // dir/foo
      fs.openSync(path.join(dir, 'foo'), 'w')
      // dir/bar/baz
      main.mkdirsSync(path.join(dir, 'bar'))
      fs.openSync(path.join(dir, 'bar', 'baz'), 'w')
      const paths = []
      const stats = []
      main.walk(dir, function (path, stat) {
        paths.push(path)
        stats.push(stat)
      })
      assert.equal(paths.length, 2)
      assert.equal(paths[0], path.join(dir, 'bar', 'baz'))
      assert.equal(paths[1], path.join(dir, 'foo'))
      assert.equal(stats.length, 2)
      assert(stats[0].isFile())
      assert(stats[1].isFile())

      done()
    })
  })

  describe('+ concatSync()', function () {
    it('should concat files into the destination file', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(dir))
      main.mkdirsSync(dir)
      fs.writeFileSync(path.join(dir, 'foo'), 'foo', { encoding: 'utf8' })
      fs.writeFileSync(path.join(dir, 'bar'), 'bar', { encoding: 'utf8' })
      fs.writeFileSync(path.join(dir, 'baz'), 'baz', { encoding: 'utf8' })
      main.concatSync([path.join(dir, 'foo'), path.join(dir, 'bar'), path.join(dir, 'baz')], path.join(dir, 'qux'))

      assert(fs.existsSync(path.join(dir, 'qux')))
      assert.equal(fs.readFileSync(path.join(dir, 'qux'), { encoding: 'utf8' }), 'foo\nbar\nbaz')

      done()
    })
  })

  describe('+ copyToDirSync()', function () {
    it('should copy the file to the directory', function (done) {
      const src = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())
      const dest = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(src))
      assert(!fs.existsSync(dest))
      main.mkdirsSync(src)
      assert(fs.existsSync(src))
      // src/foo
      fs.openSync(path.join(src, 'foo'), 'w')
      main.copyToDirSync(path.join(src, 'foo'), dest)
      assert(fs.existsSync(dest))
      assert(fs.existsSync(path.join(dest, 'foo')))

      done()
    })
  })

  describe('+ updateFileSync()', function () {
    it('should update the version in package.json with 1.0.0', function (done) {
      const dir = path.join(TEST_DIR, 'tmp-' + Date.now() + Math.random())

      assert(!fs.existsSync(dir))
      main.mkdirsSync(dir)
      fs.writeFileSync(path.join(dir, 'package.json'), '{"version": "0.1.0"}', { encoding: 'utf8' })
      main.updateFileSync(path.join(dir, 'package.json'), /"version": "(.*?)"/g, '"version": "1.0.0"')

      assert.equal(fs.readFileSync(path.join(dir, 'package.json'), { encoding: 'utf8' }), '{"version": "1.0.0"}')

      done()
    })
  })
})
