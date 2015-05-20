!function (assert, async, PublishJS, Processor, linq) {
    'use strict';

    function AppendProcessor() {
        Processor.call(this);
    }

    require('util').inherits(AppendProcessor, Processor);

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
                var callback = this.callback,
                    cache = new (require('../inmemorycache'))(),
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
                        new PublishJS({ cache: cache, processors: processors }).build([
                            function (pipe, callback) {
                                pipe.input(inputs)
                                    .append('.1')
                                    .output(outputs)
                                    .run(callback);
                            }
                        ], callback);
                    },
                    function (callback) {
                        new PublishJS({ cache: cache, processors: processors }).build([
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
    require('../processor'),
    require('async-linq')
);