!function (assert, async, fs, mkdirp, path, rmdir, watch) {
    'use strict';

    var basedir = path.resolve(path.dirname(module.filename), 'watch-event-test-temp');

    require('vows').describe('Test "watch" module').addBatch({
        'When watching a file': {
            topic: function () {
                var callback = this.callback;

                prepareDir('1', { 'abc.txt': '123', 'def.txt': '456', 'xyz.txt': '789' }, function (err) {
                    if (err) { return callback(err); }

                    try {
                        var watcher = watch('.', { basedir: path.resolve(basedir, '1'), fswatch: false, interval: 100 }),
                            watchdog = setTimeout(function () {
                                callback && callback(new Error('timeout'));
                                callback = 0;
                            }, 10000);

                        watcher.on('change', function (changes) {
                            clearTimeout(watchdog);

                            watcher.close();
                            callback && callback(null, changes);
                            callback = 0;
                        }).on('init', function () {
                            fs.writeFile(path.resolve(basedir, '1', 'abc.txt'), new Buffer('123'));
                        }, 0);
                    } catch (ex) {
                        return callback(ex);
                    }
                });
            },

            'Should receive a "change" event with specified file': function (topic) {
                assert.deepEqual(topic, ['abc.txt']);
            }
        }
    }).export(module);

    function prepareDir(name, files, callback) {
        async.series([
            function (callback) {
                rmdir(path.resolve(basedir, name), function (err) {
                    callback();
                });
            },
            function (callback) {
                mkdirp(path.resolve(basedir, name), callback);
            },
            function (callback) {
                if (files) {
                    async.forEach(Object.getOwnPropertyNames(files), function (filename) {
                        var buffer = files[filename];

                        fs.writeFile(path.resolve(basedir, name, filename), buffer instanceof Buffer ? buffer : new Buffer(buffer), callback);
                    }, callback);
                } else {
                    callback();
                }
            }
        ], callback);
    }
}(
    require('assert'),
    require('async'),
    require('fs'),
    require('mkdirp'),
    require('path'),
    require('rmdir'),
    require('../util/watch')
);