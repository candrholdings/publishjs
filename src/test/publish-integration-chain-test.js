!function (assert, Processor, linq) {
    'use strict';

    require('vows').describe('PublishJS chain integration test').addBatch({
        'when chaining two processors': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        log: false,
                        processors: {
                            transform: function (inputs, outputs, transformer, callback) {
                                var that = this;

                                linq(inputs.newOrChanged).select(function (entry, filename) {
                                    outputs[filename] = transformer(entry.toString());
                                }).run();

                                callback(null, outputs);
                            },
                            input: require('./lib/inputprocessor'),
                            output: require('./lib/outputprocessor')
                        },
                        pipes: [function (pipe, callback) {
                            pipe.input({
                                    'abc.txt': 'ABC',
                                    'def.txt': 'DEF',
                                    'xyz.txt': 'XYZ'
                                })
                                .transform(function (text) { return 'prefix-' + text; })
                                .transform(function (text) { return text + '-suffix'; })
                                .output(outputs)
                                .run(callback);
                        }]
                    }),
                    outputs = {};

                publish.build(function (err) {
                    callback(err, err ? null : outputs);
                });
            },

            'should returns output transformed by two processors': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 3);
                assert.equal(topic['abc.txt'].toString(), 'prefix-ABC-suffix');
                assert.equal(topic['def.txt'].toString(), 'prefix-DEF-suffix');
                assert.equal(topic['xyz.txt'].toString(), 'prefix-XYZ-suffix');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor'),
    require('async-linq')
);