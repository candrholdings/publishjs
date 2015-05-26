!function (assert, async, Processor, linq) {
    'use strict';

    require('vows').describe('PublishJS cache integration test').addBatch({
        'when repeating an action for 2 times': {
            topic: function () {
                var callback = this.callback,
                    cache = require('../caches/inmemorycache')(),
                    inputs = {
                        'abc.txt': 'ABC'
                    },
                    outputs = {},
                    processors = {
                        append: function (inputs, outputs, text, callback) {
                            var that = this;

                            linq(inputs.newOrChanged).select(function (entry, filename) {
                                outputs[filename + '.out'] = entry.toString() + text;
                            }).run();

                            callback(null, outputs);
                        },
                        input: require('./lib/inputprocessor'),
                        output: require('./lib/outputprocessor')
                    };

                async.series([
                    function (callback) {
                        require('../publish')({ cache: cache, log: false, processors: processors }).build([
                            function (pipe, callback) {
                                pipe.input(inputs)
                                    .append('.1')
                                    .output(outputs)
                                    .run(callback);
                            }
                        ], callback);
                    },
                    function (callback) {
                        require('../publish')({ cache: cache, log: false, processors: processors }).build([
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
    require('../processor'),
    require('async-linq')
);