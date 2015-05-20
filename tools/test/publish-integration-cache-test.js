!function (assert, async, PublishJS, MockProcessor, linq) {
    'use strict';

    function AppendProcessor() {
        var that = this;

        MockProcessor.apply(that, arguments);
    }

    require('util').inherits(AppendProcessor, MockProcessor);

    AppendProcessor.prototype.run = function (inputs, outputs, text, callback) {
        var that = this;

        linq(inputs.newOrChanged).select(function (entry, filename) {
            outputs[filename + '.out'] = entry.buffer.toString() + text;
        }).run();

        callback(null, outputs);
    };

    require('vows').describe('PublishJS cache integration test').addBatch({
        'when repeating an action for 2 times': {
            topic: function () {
                MockProcessor.cleanup();

                var callback = this.callback,
                    topic,
                    inputs = {
                        'abc.txt': 'ABC'
                    },
                    outputs = {},
                    processors = {
                        append: AppendProcessor,
                        input: require('./lib/inputprocessor'),
                        output: require('./lib/outputprocessor')
                    };

                async.series([
                    function (callback) {
                        new PublishJS({ processors: processors }).build([
                            function (pipe, callback) {
                                pipe.input(inputs)
                                    .append('.1')
                                    .output(outputs)
                                    .run(callback);
                            }
                        ], callback);
                    },
                    function (callback) {
                        new PublishJS({ processors: processors }).build([
                            function (pipe, callback) {
                                pipe.input(inputs)
                                    .append('.1')
                                    .output(outputs)
                                    .run(callback);
                            }
                        ], callback);
                    }
                ], function (err) {
                    callback(err, err ? null : outputs);
                });
            },

            'should returns output': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt.out'].toString(), 'ABC.1');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('async'),
    require('../publish'),
    require('./lib/mockprocessor'),
    require('async-linq')
);