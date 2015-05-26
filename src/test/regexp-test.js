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
            topic: regexp.replacePatterns('abc def xyz', [[/abc/, function (match) {
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
        }
    }).export(module);
}(
    require('assert'),
    require('../util/regexp')
);