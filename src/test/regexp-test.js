!function (assert, regexp) {
    'use strict';

    require('vows').describe('RegExp utility test').addBatch({
        'When replacing multiple patterns': {
            topic: regexp.replacePatterns('a1b2c3', [[/c(3)/, 'a$1'], [/a(1)/, 'c$1']]),

            'should returns text': function (topic) {
                assert.equal(topic, 'c1b2a3');
            }
        },

        'When replacing /abc/ with "def" and /def/ with "abc"': {
            topic: regexp.replacePatterns('abc def xyz', [[/abc/, 'def'], [/def/, 'abc']]),

            'should swap them': function (topic) {
                assert.equal(topic, 'def abc xyz');
            }
        },

        'When replacing /abc/ with a custom function that change to uppercase': {
            topic: regexp.replacePatterns('abc def xyz', [[/abc/, function (match, index, original) {
                assert.equal(match, 'abc');
                assert.equal(index, '0');
                assert.equal(original, 'abc def xyz');

                return match.toUpperCase();
            }]]),

            'should returns ABC in uppercase': function (topic) {
                assert.equal(topic, 'ABC def xyz');
            }
        },

        'When replacing /a(b)c/ with $1': {
            topic: regexp.replacePatterns('abc def xyz', [[/a(b)c/, '$1']]),

            'should returns "b" only': function (topic) {
                assert.equal(topic, 'b def xyz');
            }
        },

        'When replacing abcdefxyz with a custom async function that change "abc" to "B" and "xyz" to "Y"': {
            topic: function () {
                var callback = this.callback;

                regexp.replacePatternsAsync('abcdefxyz', [[/(?:[ax])(\w)\w/, function (match0, match1, index, original, callback) {
                    if (match0 === 'abc') {
                        assert.equal(match1, 'b');
                        assert.equal(index, 0);
                    } else if (match0 === 'xyz') {
                        assert.equal(match1, 'y');
                        assert.equal(index, 6);
                    } else {
                        assert(0);
                    }

                    assert.equal(original, 'abcdefxyz');

                    callback(null, match1.toUpperCase());
                }]], callback)
            },

            'should returns BdefY': function (topic) {
                assert.equal(topic, 'BdefY');
            }
        }
    }).export(module);
}(
    require('assert'),
    require('../util/regexp')
);