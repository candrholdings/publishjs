!function (assert, from, path, publish) {
    'use strict';

    var processors = {
        outputs: require('./lib/outputprocessor')
    };

    require('vows').describe('From processor test').addBatch({
        'When crawling a single folder': {
            topic: function () {
                var callback = this.callback,
                    topic = {};

                publish({ cache: false, log: false, processors: processors }).build(function (pipe, callback) {
                    pipe.from(path.resolve(module.filename, '../from-test-files/'))
                        .outputs(topic)
                        .run(callback);
                }, function (err) {
                    callback(err, err ? null : topic);
                });
            },

            'should returns all files': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 3);
            },

            'should read all file contents': function (topic) {
                assert.equal(topic['abc.txt'], '123');
                assert.equal(topic['dir-def/def.txt'], '456');
                assert.equal(topic['dir-xyz-1/dir-xyz-2/xyz.txt'], '789');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../from'),
    require('path'),
    require('../publish')
);