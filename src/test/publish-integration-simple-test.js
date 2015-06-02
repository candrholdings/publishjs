!function (assert, Processor, linq) {
    'use strict';

    require('vows').describe('PublishJS simple integration test').addBatch({
        'When chaining a single action': {
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
                                    outputs[filename + '.dummy'] = entry.toString() + '.dummy';
                                }).run();

                                callback(null, outputs);
                            },
                            input: require('./lib/inputprocessor')
                        },
                        assertion: '123',
                        pipes: [function (pipe, callback) {
                            pipe.input({ 'abc.txt': 'ABC' })
                                .dummy('dummy-arg1', 'dummy-arg2')
                                .run(callback);
                        }]
                    }),
                    topic = {};

                publish.build(callback);
            },

            'should returns output': function (topic) {
                topic = topic.all;

                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt.dummy'].toString(), 'ABC.dummy');
            }
        },

        'When build failed': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        log: false,
                        processors: {
                            dummy: function (inputs, outputs, callback) {
                                callback(new Error('dummy'));
                            },
                            input: require('./lib/inputprocessor')
                        },
                        pipes: [function (pipe, callback) {
                            pipe.input({ 'abc.txt': 'ABC' })
                                .dummy()
                                .run(callback);
                        }]
                    });

                publish.build(function (err) {
                    callback(null, err);
                });
            },

            'Should returns error object': function (topic) {
                assert(topic);
                assert.equal(topic.message, 'dummy');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor'),
    require('async-linq')
);