!function (assert, MockProcessor) {
    'use strict';

    var VALID_CONTENT = new Buffer('abc').toString('base64'),
        VALID_MD5 = new Buffer('xyz').toString('hex');

    require('vows').describe('Processor init function').addBatch({
        'init without cache': {
            topic: function () {
                var callback = this.callback,
                    processor = new MockProcessor({
                        _loadCache: function (callback) {
                            callback(null, {}, {});
                        }
                    });

                processor._init({
                    'abc.txt': { content: VALID_CONTENT, md5: VALID_MD5 }
                }, function (err) {
                    callback(err, err ? null : processor);
                });
            },

            'should returns all inputs as changed': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.newOrChangedFiles).length, 1);
                assert.equal(topic.newOrChangedFiles['abc.txt'].content, VALID_CONTENT);
                assert.equal(topic.newOrChangedFiles['abc.txt'].md5, VALID_MD5);
            },

            'should returns no inputs as unchanged': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.unchangedFiles).length, 0);
            }
        },

        'init with some cached but no deleted files': {
            topic: function () {
                var callback = this.callback,
                    processor = new MockProcessor({
                        _loadCache: function (callback) {
                            callback(
                                null,
                                {
                                    'unchanged.txt': { md5: 'unchanged' },
                                    'changed.txt': { md5: 'changed-old' }
                                },
                                {}
                            );
                        }
                    });

                processor._init({
                    'unchanged.txt': { content: VALID_CONTENT, md5: 'unchanged' },
                    'changed.txt': { content: VALID_CONTENT, md5: 'changed-new' },
                    'new.txt': { content: VALID_CONTENT, md5: 'new' },
                }, function (err) {
                    callback(err, err ? null : processor);
                });
            },

            'should returns cache hit as unchanged': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.unchangedFiles).sort().join(','), 'unchanged.txt');
            },

            'should returns cache miss as changed': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.newOrChangedFiles).sort().join(','), 'changed.txt,new.txt');
            }
        },

        'init with a deleted file': {
            topic: function () {
                var callback = this.callback,
                    processor = new MockProcessor({
                        _loadCache: function (callback) {
                            callback(
                                null,
                                {
                                    'unchanged.txt': { md5: 'unchanged' },
                                    'deleted.txt': { md5: 'deleted' }
                                },
                                {}
                            );
                        }
                    });

                processor._init({
                    'unchanged.txt': { content: VALID_CONTENT, md5: 'unchanged' }
                }, function (err) {
                    callback(err, err ? null : processor);
                });
            },

            'should returns all as changed': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.newOrChangedFiles).sort().join(','), 'unchanged.txt');
            },

            'should returns nothing as unchanged': function (topic) {
                assert.equal(Object.getOwnPropertyNames(topic.unchangedFiles).length, 0);
            }
        }
    }).export(module);
}(
    require('assert'),
    require('./lib/mockprocessor')
);