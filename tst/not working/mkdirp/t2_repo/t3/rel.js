lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
};
let lya = require("../../../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

var assert = require('assert');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');

exports.rel = function () {
    var x = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
    var y = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
    var z = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
    
    var cwd = process.cwd();
    process.chdir('/tmp');
    
    var file = [x,y,z].join('/');
    var to = setTimeout(function () {
        assert.fail('never called back');
    }, 1000);
    
    mkdirp(file, 0755, function (err) {
        if (err) assert.fail(err);
        else path.exists(file, function (ex) {
            if (!ex) assert.fail('file not created')
            else fs.stat(file, function (err, stat) {
                if (err) assert.fail(err)
                else {
                    clearTimeout(to);
                    process.chdir(cwd);
                    assert.eql(stat.mode & 0777, 0755);
                    assert.ok(stat.isDirectory(), 'target not a directory');
                }
            })
        })
    });
};