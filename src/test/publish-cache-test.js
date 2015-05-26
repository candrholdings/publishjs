!function (assert, publish, FileSystemCache) {
    'use strict';

    require('vows').describe('Cache options in "publish" module').addBatch({
        'When passing null': {
            topic: publish({ cache: null }).options.cache,
            'should cache by FileSystemCache': function (topic) {
                assert(topic instanceof FileSystemCache);
            },
            'should cache with default settings': function (topic) {
                assert(!topic.options.tempdir);
            }
        },

        'When passing false': {
            topic: publish({ cache: false }).options.cache,
            'should not returns any cache': function (topic) {
                assert(!topic);
            }
        },

        'When passing a string': {
            topic: publish({ cache: 'path/' }).options.cache,
            'should cache by FileSystemCache': function (topic) {
                assert(topic instanceof FileSystemCache);
            },
            'should cache at specified path': function (topic) {
                assert.equal(topic.options.tempdir, 'path/');
            }
        },

        'When passing a new object': {
            topic: function () {
                var callback = this.callback;

                try {
                    publish({ cache: {} }).options.cache
                } catch (ex) {
                    return callback(null, ex);
                }

                callback(new Error('exception not thrown'));
            },
            'should throws exception': function (topic) {
                assert(topic);
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../publish'),
    require('../caches/filesystemcache').FileSystemCache
);