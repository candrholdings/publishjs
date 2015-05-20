!function (assert, PublishJS, MockProcessor, linq) {
    'use strict';

    function TransformProcessor() {
        var that = this;

        MockProcessor.apply(that, arguments);
    }

    require('util').inherits(TransformProcessor, MockProcessor);

    TransformProcessor.prototype.run = function (inputs, outputs, transformer, callback) {
        var that = this;

        linq(inputs.newOrChanged).select(function (entry, filename) {
            outputs[filename] = transformer(entry.buffer.toString());
        }).run();

        callback(null, outputs);
    };

    require('vows').describe('PublishJS chain integration test').addBatch({
        'when chaining two processors': {
            topic: function () {
                MockProcessor.cleanup();

                var callback = this.callback,
                    publish = new PublishJS({
                        processors: {
                            transform: TransformProcessor,
                            input: require('./lib/inputprocessor'),
                            output: require('./lib/outputprocessor')
                        }
                    }),
                    outputs = {};

                publish.build(function (pipe, callback) {
                    pipe.input({
                            'abc.txt': 'ABC',
                            'def.txt': 'DEF',
                            'xyz.txt': 'XYZ'
                        })
                        .transform(function (text) { return 'prefix-' + text; })
                        .transform(function (text) { return text + '-suffix'; })
                        .output(outputs)
                        .run(callback);
                }, function (err) {
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
    require('../publish'),
    require('./lib/mockprocessor'),
    require('async-linq')
);