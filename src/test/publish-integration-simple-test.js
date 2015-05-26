!function (assert, Processor, linq) {
    'use strict';

    require('vows').describe('PublishJS simple integration test').addBatch({
        'when chaining a single action': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        log: false,
                        processors: {
                            dummy: function (inputs, outputs, arg1, arg2, callback) {
                                assert.equal(arg1, 'dummy-arg1');
                                assert.equal(arg2, 'dummy-arg2');
                                assert.equal(this.options.assertion, '123');

                                linq(inputs.newOrChanged).select(function (entry, filename) {
                                    outputs[filename + '.dummy'] = entry.buffer.toString() + '.dummy';
                                }).run();

                                callback(null, outputs);
                            },
                            input: require('./lib/inputprocessor'),
                            output: require('./lib/outputprocessor')
                        },
                        assertion: '123'
                    }),
                    topic = {};

                publish.build(function (pipe, callback) {
                    pipe.input({ 'abc.txt': 'ABC' })
                        .dummy('dummy-arg1', 'dummy-arg2')
                        .output(topic)
                        .run(callback);
                }, function (err) {
                    callback(err, err ? null : topic);
                });
            },

            'should returns output': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt.dummy'].toString(), 'ABC.dummy');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor'),
    require('async-linq')
);