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
        }
    }).export(module);
}(require('assert'), require('../util/format'));