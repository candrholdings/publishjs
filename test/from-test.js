!function (assert, from, path, publish) {
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
                    topic = {};

                publish({ cache: require('../inmemorycache')(), log: false, processors: processors }).build(function (pipe, callback) {
                    pipe.from([
                            pipe.inputs({ abc: 'ABC1', def: 'DEF1' }),
                            pipe.inputs({ def: 'DEF2', xyz: 'XYZ1' }),
                            pipe.inputs({ xyz: 'XYZ2' })
                        ])
                        .outputs(topic)
                        .run(callback);
                }, function (err) {
                    callback(err, err ? null : topic);
                });
            },

            'should returns merged result': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 3);
                assert.equal(topic.abc, 'ABC1');
                assert.equal(topic.def, 'DEF2');
                assert.equal(topic.xyz, 'XYZ2');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../from'),
    require('path'),
    require('../publish')
);