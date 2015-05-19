!function (assert, async, linq, MockProcessor) {
    'use strict';

    require('vows').describe('Processor flush function').addBatch({
        'Flush a file': {
            topic: function () {
                var topicCallback = this.callback,
                    processor = new MockProcessor();

                processor.overrides._loadCache = function (callback) {
                    callback(null, {
                        'unchange.txt': { md5: 'unchange' }
                    }, {
                        'output.txt': { md5: 'output.old', content: 'output.old' }
                    });
                };

                processor.overrides._saveCache = function (inputs, outputs, callback) {
                    callback();
                    topicCallback(null, { inputs: inputs, outputs: outputs });
                };

                processor.overrides.work = function (callback) {
                    this.write('new.txt', 'afterwork-new');
                    callback();
                };

                async.series([
                    function (callback) {
                        processor._init({
                            'unchange.txt': { md5: 'unchange', content: 'unchange' },
                            'new.txt': { md5: 'beforework-new', content: 'new' }
                        }, callback);
                    },
                    function (callback) {
                        processor.work(callback);
                    },
                    function (callback) {
                        processor._flush(callback);
                    }
                ]);
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
                assert.equal(outputs['output.txt'].md5, 'output.old');
                assert.equal(outputs['output.txt'].content, 'output.old');
                assert.equal(outputs['new.txt'].md5, md5('afterwork-new'));
                assert.equal(outputs['new.txt'].content, new Buffer('afterwork-new').toString('base64'));
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