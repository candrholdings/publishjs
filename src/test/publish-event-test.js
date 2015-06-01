!function (assert, Processor, linq) {
    'use strict';

    require('vows').describe('PublishJS event test').addBatch({
        'When waiting for "build" event after build': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        log: false,
                        processors: {
                            dummy: function (inputs, outputs, callback) {
                                outputs['abc.txt'] = inputs.all['abc.txt'];
                                callback(null, outputs);
                            },
                            input: require('./lib/inputprocessor')
                        },
                        pipes: [function (pipe, callback) {
                            pipe.input({ 'abc.txt': 'ABC' })
                                .dummy()
                                .run(callback);
                        }]
                    });

                publish.on('build', function (result) {
                    callback(null, result);
                });

                publish.build();
            },

            '"build" event should returns output': function (topic) {
                topic = topic.all;

                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt'].toString(), 'ABC');
            }
        },
        'When waiting for "error" event after build failed': {
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

                publish.on('error', function (err) {
                    callback(null, err);
                });

                publish.build();
            },

            '"build" event should returns error object': function (topic) {
                assert.equal(topic.message, 'dummy');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor'),
    require('async-linq')
);