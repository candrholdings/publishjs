!function (assert, async, fs, mkdirp, path, publish, rmdir) {
    'use strict';

    var basedir = path.resolve(path.dirname(module.filename), 'watch-event-test-temp');

    require('vows').describe('Watch test').addBatch({
        'When adding modifying a file after build': {
            topic: function () {
                var callback = this.callback;

                prepareDir('1', { abc: '123', def: '456', xyz: '789' }, function (err) {
                    if (err) { return callback(err); }

                    try {
                        publish({
                            cache: false,
                            log: false,
                            pipes: [function (pipe, callback) {
                                pipe.from(path.resolve(basedir, '1'))
                                    .run(callback);
                            }]
                        })
                        .on('error', function (err) {
                            callback(err);
                        })
                        .watch()
                        .build(function (err) {
                            if (err) { return; }

                            this.on('build', function (outputs) {
                                this.watch(false);
                                callback(null, outputs);
                            });

                            process.nextTick(function () {
                                fs.writeFile(path.resolve(basedir, '1/abc'), 'ABC');
                            });
                        });
                    } catch (ex) {
                        callback(ex);
                    }
                });
            },

            'should build again': function (topic) {
                topic = topic.all;

                Object.getOwnPropertyNames(topic).forEach(function (filename) {
                    topic[filename] = topic[filename].toString();
                });

                assert.deepEqual(topic, {
                    abc: 'ABC',
                    def: '456',
                    xyz: '789'
                });
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
                    async.forEach(Object.getOwnPropertyNames(files), function (filename, callback) {
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
    require('../publish'),
    require('rmdir')
);