!function (assert, linq, PublishJS, path) {
    'use strict';

    var basedir = path.join(path.dirname(module.filename), 'save-test-temp/'),
        processors = {
            inputs: require('./lib/inputprocessor'),
            outputs: require('./lib/outputprocessor')
        };

    require('vows').describe('Processor "save" module').addBatch({
        'When saving 3 files': {
            topic: function () {
                new PublishJS({
                    cache: false,
                    output: basedir,
                    processors: processors
                }).build(function (pipe, callback) {
                    pipe.inputs({
                            'abc.txt': 'ABC',
                            'def.txt': 'DEF',
                            'xyz.txt': 'XYZ'
                        })
                        .save('1/')
                        .run(callback);
                }, this.callback);
            },

            'should write all 3 files to disk': function (topic) {
                crawl('1/', function (err, outputs) {
                    if (err) { throw err; }

                    assert.deepEqual(outputs, {
                        'abc.txt': 'ABC',
                        'def.txt': 'DEF',
                        'xyz.txt': 'XYZ'
                    });
                });
            }
        }
    }).export(module);

    function crawl(path, callback) {
        var result = {};

        new PublishJS({
            cache: false,
            basedir: basedir,
            processors: processors
        }).build(function (pipe, callback) {
            pipe.from(path)
                .outputs(result)
                .run(callback);
        }, function (err) {
            callback(err, err ? null : linq(result).select(function (buffer) {
                return buffer.toString();
            }).run());
        });
    }
}(
    require('assert'),
    require('async-linq'),
    require('../publish'),
    require('path')
);