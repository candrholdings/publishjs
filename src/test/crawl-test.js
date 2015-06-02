!function (assert, crawl, path) {
    'use strict';

    require('vows').describe('Crawl file stats').addBatch({
        'When crawling a file': {
            topic: function () {
                crawl('1/abc.txt', { basedir: path.resolve(path.dirname(module.filename), 'crawl-test-files') }, this.callback);
            },

            'should return that file only': function (files) {
                assert.deepEqual(stripMtime(files), { '1/abc.txt': { size: 3 }});
            }
        },

        'When crawling a directory': {
            topic: function () {
                crawl('2/', { basedir: path.resolve(path.dirname(module.filename), 'crawl-test-files') }, this.callback);
            },

            'should return that everything under': function (files) {
                assert.deepEqual(
                    stripMtime(files),
                    {
                        '2/abc.txt': { size: 3 },
                        '2/def/xyz.txt': { size: 9 },
                    }
                );
            }
        }
    }).export(module);

    function stripMtime(stats) {
        var newStats = {};

        Object.getOwnPropertyNames(stats).forEach(function (filename) {
            newStats[filename] = { size: stats[filename].size };
        });

        return newStats;
    }
}(require('assert'), require('../util/crawl'), require('path'));