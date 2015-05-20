!function (assert, Processor, linq) {
    'use strict';

    function DummyProcessor() {
        var that = this;

        Processor.apply(that, arguments);
    }

    require('util').inherits(DummyProcessor, Processor);

    DummyProcessor.prototype.run = function (inputs, outputs, arg1, arg2, callback) {
        var that = this;

        assert.equal(arg1, 'dummy-arg1');
        assert.equal(arg2, 'dummy-arg2');
        assert.equal(that.options.assertion, '123');
        assert(that instanceof DummyProcessor);

        linq(inputs.newOrChanged).select(function (entry, filename) {
            outputs[filename + '.dummy'] = entry.buffer.toString() + '.dummy';
        }).run();

        callback(null, outputs);
    };

    require('vows').describe('PublishJS simple integration test').addBatch({
        'when chaining a single action': {
            topic: function () {
                var callback = this.callback,
                    publish = require('../publish')({
                        cache: false,
                        processors: {
                            dummy: DummyProcessor,
                            input: require('./lib/inputprocessor'),
                            output: require('./lib/outputprocessor')
                        },
                        assertion: '123'
                    }),
                    topic = {};

                publish.build(function (pipe, callback) {
                    pipe.input({ 'abc.txt': 'ABC' })
                        .dummy('dummy-arg1', 'dummy-arg2')
                        .output(topic)
                        .run(callback);
                }, function (err) {
                    callback(err, err ? null : topic);
                });
            },

            'should returns output': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic).length, 1);
                assert.equal(topic['abc.txt.dummy'].toString(), 'ABC.dummy');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor'),
    require('async-linq')
);