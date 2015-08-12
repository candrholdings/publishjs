!function (assert, format) {
    'use strict';

    require('vows').describe('Break lines').addBatch({
        'When breaking "abc def xyz" into width of 2': {
            topic: format.breakLines('abc def xyz', 2),
            'Should return ["ab", "c", "de", "f", "xy", "z"]': function (topic) {
                assert.deepEqual(topic, ['ab', 'c', 'de', 'f', 'xy', 'z']);
            }
        },

        'When breaking "abc def xyz" into width of 3': {
            topic: format.breakLines('abc def xyz', 3),
            'Should return ["abc", "def", "xyz"]': function (topic) {
                assert.deepEqual(topic, ['abc', 'def', 'xyz']);
            }
        },

        'When breaking "abc def xyz" into width of 4': {
            topic: format.breakLines('abc def xyz', 4),
            'Should return ["abc", "def", "xyz"]': function (topic) {
                assert.deepEqual(topic, ['abc', 'def', 'xyz']);
            }
        },

        'When breaking "abc def xyz" into width of 5': {
            topic: format.breakLines('abc def xyz', 5),
            'Should return ["abc", "def", "xyz"]': function (topic) {
                assert.deepEqual(topic, ['abc', 'def', 'xyz']);
            }
        },

        'When breaking "\\u001b[mabc def xyz" into width of 2': {
            topic: format.breakLines('\u001b[mabc def xyz', 2),
            'Should return ["\\u001b[mab", "c", "de", "f", "xy", "z"]': function (topic) {
                assert.deepEqual(topic, ['\u001b[mab', 'c', 'de', 'f', 'xy', 'z']);
            }
        },

        'When breaking "\\u001b[mabc def xyz" into width of 5': {
            topic: format.breakLines('\u001b[mabc def xyz', 5),
            'Should return ["\\u001b[mabc", "def", "xyz"]': function (topic) {
                assert.deepEqual(topic, ['\u001b[mabc', 'def', 'xyz']);
            }
        },

        'When breaking a Babel error message': {
            topic: format.breakLines('\u001b[0m  28 |                     descriptions\u001b[1m:\u001b[22m Immutable\u001b[1m.\u001b[22mList\u001b[94m\u001b[1m(\u001b[22m\u001b[39mfabric\u001b[1m.\u001b[22mlongDescriptions\u001b[94m\u001b[1m)\u001b[22m\u001b[39m', 80),
            'Should return a single line': function (topic) {
                assert.deepEqual(topic, ['\u001b[0m  28 |                     descriptions\u001b[1m:\u001b[22m Immutable\u001b[1m.\u001b[22mList\u001b[94m\u001b[1m(\u001b[22m\u001b[39mfabric\u001b[1m.\u001b[22mlongDescriptions\u001b[94m\u001b[1m)\u001b[22m\u001b[39m']);
            }
        }
    }).export(module);
}(require('assert'), require('../util/format'));