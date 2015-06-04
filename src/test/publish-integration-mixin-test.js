!function (assert, Processor, linq) {
    'use strict';

    require('vows').describe('PublishJS simple integration test').addBatch({
        'When adding a mixin with "onbuild"': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        log: false,
                        processors: {
                            input: require('./lib/inputprocessor')
                        },
                        pipes: [function (pipe, callback) {
                            pipe.input({ 'abc.txt': 'ABC' })
                                .run(callback);
                        }],
                        mixins: [{
                            onbuild: function (changes) {
                                callback(null, changes);
                            }
                        }]
                    });

                publish.build();
            },

            'should returns output': function (topic) {
                topic = topic.all;

                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt'].toString(), 'ABC');
            }
        },

        'When adding a mixin with "onmix"': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        log: false,
                        processors: {
                            input: require('./lib/inputprocessor')
                        },
                        pipes: [function (pipe, callback) {
                            pipe.input({ 'abc.txt': 'ABC' })
                                .run(callback);
                        }],
                        mixins: [{
                            onmix: function () {
                                this.on('build', function (changes) {
                                    callback(null, changes);
                                });
                            }
                        }]
                    });

                publish.build();
            },

            'should returns output': function (topic) {
                topic = topic.all;

                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt'].toString(), 'ABC');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor'),
    require('async-linq')
);