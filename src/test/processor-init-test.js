!function (assert, Processor) {
    'use strict';

    var VALID_BUFFER = new Buffer('abc'),
        VALID_MD5 = new Buffer('xyz').toString('hex');

    require('vows').describe('Processor init function').addBatch({
        'init without cache': {
            topic: function () {
                var callback = this.callback,
                    processor = new Processor();

                processor.options = {};

                processor._getFiles({
                    'abc.txt': { buffer: VALID_BUFFER, md5: VALID_MD5 }
                }, callback);
            },

            'should returns all inputs as changed': function (topic) {
                var newOrChanged = topic.inputs.newOrChanged;

                assert.equal(Object.getOwnPropertyNames(newOrChanged).length, 1);
                assert.equal(newOrChanged['abc.txt'].buffer.toString(), VALID_BUFFER.toString());
                assert.equal(newOrChanged['abc.txt'].md5, VALID_MD5);
            },

            'should returns no inputs as unchanged': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.inputs.unchanged).length, 0);
            },

            'should returns no inputs as deleted': function (topic) {
                assert.equal(topic.inputs.deleted.length, 0);
            }
        },

        'init with some cached but no deleted files': {
            topic: function () {
                var callback = this.callback,
                    processor = new Processor();

                processor._loadCache = function (callback) {
                    callback(
                        null,
                        {
                            'unchanged.txt': { md5: 'unchanged' },
                            'changed.txt': { md5: 'changed-old' }
                        },
                        {}
                    );
                };

                processor._getFiles({
                    'unchanged.txt': { buffer: VALID_BUFFER, md5: 'unchanged' },
                    'changed.txt': { buffer: VALID_BUFFER, md5: 'changed-new' },
                    'new.txt': { buffer: VALID_BUFFER, md5: 'new' },
                }, callback);
            },

            'should returns cache hit as unchanged': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.inputs.unchanged).sort().join(','), 'unchanged.txt');
            },

            'should returns cache miss as changed': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.inputs.newOrChanged).sort().join(','), 'changed.txt,new.txt');
            },

            'should returns no inputs as deleted': function (topic) {
                assert.equal(topic.inputs.deleted.length, 0);
            }
        },

        'init with a deleted file': {
            topic: function () {
                var callback = this.callback,
                    processor = new Processor();

                processor._loadCache = function (callback) {
                    callback(
                        null,
                        {
                            'unchanged.txt': { md5: 'unchanged' },
                            'deleted.txt': { md5: 'deleted' }
                        },
                        {}
                    );
                };

                processor._getFiles({
                    'unchanged.txt': { buffer: VALID_BUFFER, md5: 'unchanged' }
                }, callback);
            },

            'should returns all as unchanged': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.inputs.unchanged).sort().join(','), 'unchanged.txt');
            },

            'should returns nothing as changed': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.inputs.newOrChanged).length, 0);
            },

            'should returns one deleted file': function (topic) {
                assert.equal(topic.inputs.deleted.join(','), 'deleted.txt');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor')
);