!function (assert, Processor) {
    'use strict';

    var VALID_CONTENT = new Buffer('abc').toString('base64'),
        VALID_MD5 = new Buffer('xyz').toString('hex');

    require('vows').describe('Processor utility functions').addBatch({
        'when checking for valid file entry': {
            topic: Processor.validFileEntry({
                content: VALID_CONTENT,
                md5: VALID_MD5
            }),

            'should return truthy': function (topic) {
                assert(topic);
            }
        },

        'when checking for file entry without content': {
            topic: Processor.validFileEntry({ md5: VALID_MD5 }),

            'should return falsy': function (topic) {
                assert(!topic);
            }
        },

        'when checking for file entry without md5': {
            topic: Processor.validFileEntry({ content: VALID_CONTENT }),

            'should return falsy': function (topic) {
                assert(!topic);
            }
        },

        'when checking for file entry with additional entries': {
            topic: Processor.validFileEntry({ content: VALID_CONTENT, md5: VALID_MD5, extra: 1 }),

            'should return falsy': function (topic) {
                assert(!topic);
            }
        },

        'when checking for file entry not a plain object': {
            topic: function () {
                var fileEntry = new Date();

                fileEntry.content = VALID_CONTENT;
                fileEntry.md5 = VALID_MD5;

                this.callback(null, Processor.validFileEntry(fileEntry));
            },

            'should return falsy': function (topic) {
                assert(!topic);
            }
        },

        'when checking for plain object': {
            topic: Processor.isPlainObject({}),

            'should return truthy': function (topic) {
                assert(topic);
            }
        },

        'when checking if a Date object is plain': {
            topic: Processor.isPlainObject(new Date()),

            'should return falsy': function (topic) {
                assert(!topic);
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../processor')
);