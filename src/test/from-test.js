!function (assert, from, linq, path, publish) {
    'use strict';

    var processors = {
        inputs: require('./lib/inputprocessor'),
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
        },

        'When merging outputs from three pipes with overlapping files': {
            topic: function () {
                var callback = this.callback,
                    topic = {
                        cache: require('../caches/inmemorycache')(),
                        outputs: {}
                    };

                publish({ cache: topic.cache, log: false, processors: processors }).build(function (pipe, callback) {
                    pipe.from([
                            pipe.inputs({ abc: 'ABC1', def: 'DEF1' }),
                            pipe.inputs({ def: 'DEF2', xyz: 'XYZ1' }),
                            pipe.inputs({ xyz: 'XYZ2' })
                        ])
                        .run(callback);
                }, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        topic.outputs = result;
                        callback(null, topic);
                    }
                });
            },

            'should returns merged result': function (topic) {
                topic = topic.outputs.all;

                assert.equal(Object.getOwnPropertyNames(topic).length, 3);
                assert.equal(topic.abc, 'ABC1');
                assert.equal(topic.def, 'DEF2');
                assert.equal(topic.xyz, 'XYZ2');
            },

            'should use different cache pools': function (topic) {
                topic = topic.cache.cache;

                assert.equal(Object.getOwnPropertyNames(topic).length, 5);

                assertCacheOutputs(topic['0.0-from'].outputs, { abc: 'ABC1', def: 'DEF2', xyz: 'XYZ2' });
                assertCacheOutputs(topic['0.1-inputs'].outputs, { abc: 'ABC1', def: 'DEF1' });
                assertCacheOutputs(topic['0.2-inputs'].outputs, { def: 'DEF2', xyz: 'XYZ1' });
                assertCacheOutputs(topic['0.3-inputs'].outputs, { xyz: 'XYZ2' });
                assertCacheOutputs(topic['final'].outputs, { abc: 'ABC1', def: 'DEF2', xyz: 'XYZ2' });
            }
        }
    }).export(module);

    function assertCacheOutputs(actual, expected) {
        assert.deepEqual(
            linq(actual).select(function (entry) { return entry.buffer.toString(); }).run(),
            expected
        );
    }
}(
    require('assert'),
    require('../processors/from'),
    require('async-linq'),
    require('path'),
    require('../publish')
);