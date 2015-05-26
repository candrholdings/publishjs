!function (assert, Merge) {
    'use require';

    require('vows').describe('Merge utility functions').addBatch({
        'When expanding a flatten filelist': {
            topic: Merge._sortAndSplitIntoMap({
                'abc.txt': { text: 'abc.txt' },
                'dir1/xyz.txt': { text: 'dir1/xyz.txt' },
                'dir1/def.txt': { text: 'dir1/def.txt' },
                'dir1/dir2/abc.txt': { text: 'dir1/dir2/abc.txt' },
                'dir1/abc.txt': { text: 'dir1/abc.txt' }
            }),

            'should returns a map': function (topic) {
                assert.deepEqual(topic, {
                    'abc.txt': { text: 'abc.txt', unrank: 1 },
                    'dir1/': {
                        'abc.txt': { text: 'dir1/abc.txt', unrank: 2 },
                        'def.txt': { text: 'dir1/def.txt', unrank: 3 },
                        'xyz.txt': { text: 'dir1/xyz.txt', unrank: 4 },
                        'dir2/': {
                            'abc.txt': { text: 'dir1/dir2/abc.txt', unrank: 5 }
                        }
                    }
                });
            }
        },

        'When replacing multiple patterns': {
            topic: Merge._replacePatterns('a1b2c3', [/c(3)/, /a(1)/], ['a$1', 'c$1']),

            'should returns text': function (topic) {
                assert.equal(topic, 'c1b2a3');
            }
        },

        'When flattening a map recursively': {
            topic: function () {
                var input = {
                    'a/': {
                        '1': { content: 'a1' }
                    },
                    'b/': {
                        '1': { content: 'b1' },
                        '2': { content: 'b2' }
                    },
                    'c/': {
                        '1': { content: 'c1' },
                        '2': { content: 'c2' },
                        '3': { content: 'c3' }
                    },
                    'd/': {
                        'e/': {
                            '1': { content: 'de1' },
                            '2': { content: 'de2' },
                        }
                    }
                };

                this.callback(null, { input: input, actual: Merge._flattenRecursive(input) });
            },

            'should returns an array in flat view': function (topic) {
                assert.deepEqual(topic.actual, {
                    'a/1': { content: 'a1' },
                    'b/1': { content: 'b1' },
                    'b/2': { content: 'b2' },
                    'c/1': { content: 'c1' },
                    'c/2': { content: 'c2' },
                    'c/3': { content: 'c3' },
                    'd/e/1': { content: 'de1' },
                    'd/e/2': { content: 'de2' },
                });
            },

            'items in array should be referenced': function (topic) {
                topic.input['a/']['1'].content = 'XXX';

                assert.deepEqual(topic.actual, {
                    'a/1': { content: 'XXX' },
                    'b/1': { content: 'b1' },
                    'b/2': { content: 'b2' },
                    'c/1': { content: 'c1' },
                    'c/2': { content: 'c2' },
                    'c/3': { content: 'c3' },
                    'd/e/1': { content: 'de1' },
                    'd/e/2': { content: 'de2' },
                });
            }
        },

        'When ranking files in-place with two directive files and overlapping directives': {
            topic: function () {
                var input = {
                    '.merge': { buffer: new Buffer([
                        '+c/3',
                        '+c/2',
                        '+c/1',
                        '+b/2',
                        '+b/1',
                        '+a/1'
                    ].join('\n')) },
                    'a/': {
                        '1': { content: 'a1' }
                    },
                    'b/': {
                        '.merge': { buffer: new Buffer('+1\n+2') },
                        '1': { content: 'b1' },
                        '2': { content: 'b2' }
                    },
                    'c/': {
                        '1': { content: 'c1' },
                        '2': { content: 'c2' },
                        '3': { content: 'c3' }
                    }
                };

                Merge._rankFilesInplace(input, 0);
                this.callback(null, input);
            },

            'should rank using directive file': function (topic) {
                topic['.merge'] = { content: topic['.merge'].buffer.toString(), rank: false };
                topic['b/']['.merge'] = { content: topic['b/']['.merge'].buffer.toString(), rank: false };

                assert.deepEqual(topic, {
                    '.merge': { content: '+c/3\n+c/2\n+c/1\n+b/2\n+b/1\n+a/1', rank: false },
                    'a/': {
                        '1': { content: 'a1', rank: [6] }
                    },
                    'b/': {
                        '1': { content: 'b1', rank: [7] },
                        '2': { content: 'b2', rank: [8] },
                        '.merge': { content: '+1\n+2', rank: false }
                    },
                    'c/': {
                        '1': { content: 'c1', rank: [3] },
                        '2': { content: 'c2', rank: [2] },
                        '3': { content: 'c3', rank: [1] }
                    }
                });
            }
        },

        'When parsing an exact directive line': {
            topic: Merge._parseDirectiveLine('+a/'),

            'should convert to RegExp': function (topic) {
                assert.deepEqual(topic, {
                    operator: '+',
                    pattern: /^a(?:\/)$/
                });
            }
        },

        'When parsing a directive line with folder': {
            topic: Merge._parseDirectiveLine('+abc/def.js'),

            'should convert to RegExp': function (topic) {
                assert.deepEqual(topic, {
                    operator: '+',
                    pattern: /^abc(?:\/)def\.js$/
                });
            }
        },

        'When parsing a directive line with wildcard': {
            topic: Merge._parseDirectiveLine('+core/*.js'),

            'should convert to RegExp': function (topic) {
                assert.deepEqual(topic, {
                    operator: '+',
                    pattern: /^core(?:\/).*?\.js$/
                });
            }
        },

        'When parsing a RegExp directive line': {
            topic: Merge._parseDirectiveLine('+/a/'),

            'should keep it as is': function (topic) {
                assert.deepEqual(topic, {
                    operator: '+',
                    pattern: /a/
                });
            }
        },

        'When parsing directive with a negate exact line': {
            topic: Merge._parseDirectiveLine('-abc/def/xyz'),

            'should convert to RegExp': function (topic) {
                assert.deepEqual(topic, {
                    operator: '-',
                    pattern: /^abc(?:\/)def(?:\/)xyz$/
                });
            }
        },

        'When comparing two ranks': {
            '[1, 2, 3] < [1, 2, 4]': function (topic) {
                assert(Merge._compareRank({ rank: [1, 2, 3] }, { rank: [1, 2, 4] }) < 0);
            },

            '[1, 2, 4] > [1, 2, 3]': function (topic) {
                assert(Merge._compareRank({ rank: [1, 2, 4] }, { rank: [1, 2, 3] }) > 0);
            },

            '[1, 2, 3] === [1, 2, 3]': function (topic) {
                assert(Merge._compareRank({ rank: [1, 2, 3], unrank: 1 }, { rank: [1, 2, 3], unrank: 2 }) === 0);
            },

            '[1] < [2]': function (topic) {
                assert(Merge._compareRank({ rank: [1] }, { rank: [2] }) < 0);
            },

            '[2] > [1]': function (topic) {
                assert(Merge._compareRank({ rank: [2] }, { rank: [1] }) > 0);
            },

            '[1] < unrank 1': function (topic) {
                assert(Merge._compareRank({ rank: [1] }, { unrank: 1 }) < 0);
            },

            'unrank 1 > [1]': function (topic) {
                assert(Merge._compareRank({ unrank: 1 }, { rank: [1] }) > 0);
            },

            'unrank 1 < unrank 2': function (topic) {
                assert(Merge._compareRank({ unrank: 1 }, { unrank: 2 }) < 0);
            },

            'unrank 2 > unrank 1': function (topic) {
                assert(Merge._compareRank({ unrank: 2 }, { unrank: 1 }) > 0);
            },

            'unrank 1 === unrank 1': function (topic) {
                assert(Merge._compareRank({ unrank: 1 }, { unrank: 1 }) === 0);
            }
        }
    }).export(module);
}(require('assert'), require('../merge'));