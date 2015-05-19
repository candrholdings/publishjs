!function (assert, async, linq, MockProcessor) {
    'use strict';

    require('vows').describe('Processor flush function').addBatch({
        'Flush a file': {
            topic: function () {
                var callback = this.callback,
                    processor = new MockProcessor(),
                    topic = {};

                processor.overrides._loadCache = function (callback) {
                    callback(null, {
                        'unchange.txt': { md5: 'unchange' }
                    }, {
                        'output.txt': { md5: 'output.old', buffer: new Buffer('output.old') }
                    });
                };

                processor.overrides._saveCache = function (inputs, outputs, callback) {
                    topic.inputs = inputs;
                    topic.outputs = outputs;

                    callback();
                };

                processor.overrides.run = function (inputs, outputs, callback) {
                    outputs['new.txt'] = 'afterwork-new';

                    callback(null, outputs);
                };

                processor._run({
                    'unchange.txt': { md5: 'unchange', buffer: new Buffer('unchange') },
                    'new.txt': { md5: 'beforework-new', buffer: new Buffer('new') }
                }, [], function (err) {
                    callback(err, err ? null : topic);
                });
            },

            'should retains md5 of inputs': function (topic) {
                var inputs = topic.inputs;

                assert.equal(linq(inputs).count().run(), 2);
                assert.equal(inputs['unchange.txt'].md5, 'unchange');
                assert.equal(inputs['new.txt'].md5, 'beforework-new');
            },

            'should write outputs': function (topic) {
                var outputs = topic.outputs;

                assert.equal(linq(outputs).count().run(), 2);
                assert.equal(outputs['output.txt'].md5, md5('output.old'));
                assert.equal(outputs['output.txt'].buffer.toString(), 'output.old');
                assert.equal(outputs['new.txt'].md5, md5('afterwork-new'));
                assert.equal(outputs['new.txt'].buffer.toString(), 'afterwork-new');
            }
        }
    }).export(module);

    function md5(bufferOrString) {
        var md5 = require('crypto').createHash('md5');

        md5.update(typeof bufferOrString === 'string' ? new Buffer(bufferOrString) : bufferOrString);

        return md5.digest('hex');
    }
}(
    require('assert'),
    require('async'),
    require('async-linq'),
    require('./lib/mockprocessor')
);