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
                    processors = {
                        append: function (inputs, outputs, text, callback) {
                            var that = this;

                            linq(inputs.newOrChanged).select(function (entry, filename) {
                                outputs[filename + '.out'] = entry.toString() + text;
                            }).run();

                            callback(null, outputs);
                        },
                        input: require('./lib/inputprocessor')
                    };

                async.series([
                    function (callback) {
                        require('../publish')({ cache: cache, log: false, processors: processors }).build([
                            function (pipe, callback) {
                                pipe.input({'abc.txt': 'ABC', 'def.txt': 'DEF'})
                                    .append('.1')
                                    .run(callback);
                            }
                        ], callback);
                    },
                    function (callback) {
                        require('../publish')({ cache: cache, log: false, processors: processors }).build([
                            function (pipe, callback) {
                                pipe.input({'abc.txt': 'ABC', 'def.txt': 'XYZ'})
                                    .append('.2')
                                    .run(callback);
                            }
                        ], callback);
                    }
                ], function (err, results) {
                    callback(err, err ? null : results[1]);
                });
            },

            'should returns output': function (topic) {
                var all = linq(topic.all).select(function (buffer) { return buffer.toString(); }).run(),
                    newOrChanged = linq(topic.newOrChanged).select(function (buffer) { return buffer.toString(); }).run(),
                    unchanged = linq(topic.unchanged).select(function (buffer) { return buffer.toString(); }).run();

                assert.deepEqual(all, { 'abc.txt.out': 'ABC.1', 'def.txt.out': 'XYZ.2' });
                assert.deepEqual(newOrChanged, { 'def.txt.out': 'XYZ.2' });
                assert.deepEqual(unchanged, { 'abc.txt.out': 'ABC.1' });
            }
        }
    }).export(module);
}(
    require('assert'),
    require('async'),
    require('../processor'),
    require('async-linq')
);