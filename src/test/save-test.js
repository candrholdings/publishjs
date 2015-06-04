!function (assert, linq, PublishJS, path, rmdir) {
    'use strict';

    var basedir = path.join(path.dirname(module.filename), 'save-test-temp/'),
        processors = {
            inputs: require('./lib/inputprocessor'),
            outputs: require('./lib/outputprocessor')
        };

    require('vows').describe('Processor "save" module').addBatch({
        'When saving 3 files': {
            topic: function () {
                var callback = this.callback;

                rmdir(basedir, function (err) {
                    if (err && err.code !== 'ENOENT') { return callback(err); }

                    new PublishJS({
                        cache: false,
                        log: false,
                        output: basedir,
                        processors: processors,
                        pipes: [function (pipe, callback) {
                            pipe.inputs({
                                    'abc.txt': 'ABC',
                                    '1/abc.txt': '1ABC',
                                    '1/def.txt': '1DEF',
                                    '2/abc.txt': '2ABC',
                                    '2/def.txt': '2DEF',
                                    '2/xyz.txt': '2XYZ'
                                })
                                .save('1/')
                                .run(callback);
                        }]
                    }).build(function (err, outputs) {
                        if (err) { return callback(err); }

                        readContent('1/', function (err, disk) {
                            callback(err, err ? null : {
                                outputs: outputs,
                                disk: disk
                            });
                        });
                    });
                });
            },

            'should callback with relative pathname': function (topic) {
                assert.deepEqual(bufferToString(topic.outputs.all), {
                    '1/abc.txt': 'ABC',
                    '1/1/abc.txt': '1ABC',
                    '1/1/def.txt': '1DEF',
                    '1/2/abc.txt': '2ABC',
                    '1/2/def.txt': '2DEF',
                    '1/2/xyz.txt': '2XYZ'
                });
            },

            'should write all 3 files to disk': function (topic) {
                assert.deepEqual(topic.disk, {
                    'abc.txt': 'ABC',
                    '1/abc.txt': '1ABC',
                    '1/def.txt': '1DEF',
                    '2/abc.txt': '2ABC',
                    '2/def.txt': '2DEF',
                    '2/xyz.txt': '2XYZ'
                });
            }
        },

        'When saving a single file to another filename': {
            topic: function () {
                var callback = this.callback;

                rmdir(basedir, function (err) {
                    if (err) { return callback(err); }

                    new PublishJS({
                        cache: false,
                        log: false,
                        output: basedir,
                        processors: processors,
                        pipes: [function (pipe, callback) {
                            pipe.inputs({
                                    'abc.txt': 'ABC',
                                })
                                .save('2/xyz.txt')
                                .run(callback);
                        }]
                    }).build(function (err, outputs) {
                        if (err) { return callback(err); }

                        readContent('2/', function (err, disk) {
                            callback(err, err ? null : {
                                outputs: outputs,
                                disk: disk
                            });
                        });
                    });
                });
            },

            'should output with a new filename': function (topic) {
                assert.deepEqual(bufferToString(topic.outputs.all), {
                    '2/xyz.txt': 'ABC'
                });
            },

            'should write with a new filename': function (topic) {
                assert.deepEqual(topic.disk, {
                    'xyz.txt': 'ABC'
                });
            }
        }
    }).export(module);

    function readContent(path, callback) {
        var result = {};

        new PublishJS({
            cache: false,
            basedir: basedir,
            log: false,
            processors: processors,
            pipes: [function (pipe, callback) {
                pipe.from(path)
                    .outputs(result)
                    .run(callback);
            }]
        }).build(function (err) {
            callback(err, err ? null : linq(result).select(function (buffer) {
                return buffer.toString();
            }).run());
        });
    }

    function bufferToString(map) {
        return linq(map).select(function (buffer) { return buffer.toString(); }).run();
    }
}(
    require('assert'),
    require('async-linq'),
    require('../publish'),
    require('path'),
    require('rmdir')
);