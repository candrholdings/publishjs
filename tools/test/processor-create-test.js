!function (assert, async, Processor, linq) {
    'use strict';

    require('vows').describe('Processor quick create test').addBatch({
        'when going thru a quickly-created processor': {
            topic: function () {
                var callback = this.callback,
                    inputs = {
                        'abc.txt': 'ABC'
                    },
                    outputs = {},
                    processors = {
                        append: Processor.create(function (inputs, outputs, text, callback) {
                            var that = this;

                            linq(inputs.newOrChanged).select(function (entry, filename) {
                                outputs[filename] = entry.buffer.toString() + text;
                            }).run();

                            callback(null, outputs);
                        }),
                        input: require('./lib/inputprocessor'),
                        output: require('./lib/outputprocessor')
                    };

                require('../publish')({ cache: false, processors: processors }).build([
                    function (pipe, callback) {
                        pipe.input(inputs)
                            .append('.1')
                            .output(outputs)
                            .run(callback);
                    }
                ], function (err) {
                    callback(err, err ? null : outputs);
                });
            },

            'should returns result passed thru processor': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt'].toString(), 'ABC.1');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('async'),
    require('../processor'),
    require('async-linq')
);