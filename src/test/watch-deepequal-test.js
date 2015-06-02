!function (assert, deepEqual) {
    'use strict';

    require('vows').describe('Unit testing watcher.deepEqual function').addBatch({
        'When comparing true to true': {
            topic: deepEqual(true, true),
            'should return true': shouldEqual(true)
        },

        'When comparing 1 to 1': {
            topic: deepEqual(1, 1),
            'should return true': shouldEqual(true)
        },

        'When comparing "abc" to "abc"': {
            topic: deepEqual('abc', 'abc'),
            'should return true': shouldEqual(true)
        },

        'When comparing two date of same value': {
            topic: deepEqual(new Date(946656000000), new Date(946656000000)),
            'should return true': shouldEqual(true)
        },

        'When comparing two functions of same reference': {
            topic: deepEqual(shouldEqual, shouldEqual),
            'should return true': shouldEqual(true)
        },

        'When comparing true to false': {
            topic: deepEqual(true, false),
            'should return false': shouldEqual(false)
        },

        'When comparing 0 to 1': {
            topic: deepEqual(0, 1),
            'should return false': shouldEqual(false)
        },

        'When comparing "abc" to "xyz"': {
            topic: deepEqual('abc', 'xyz'),
            'should return false': shouldEqual(false)
        },

        'When comparing { abc: 123, def: { xyz: 789 } } to { abc: 123, def: { xyz: 789 } }': {
            topic: deepEqual({ abc: 123, def: { xyz: 789 } }, { abc: 123, def: { xyz: 789 } }),
            'should return true': shouldEqual(true)
        },

        'When comparing { abc: 123, def: { xyz: 789 } } to { abc: 123, def: { xyz: "XYZ" } }': {
            topic: deepEqual({ abc: 123, def: { xyz: 789 } }, { abc: 123, def: { xyz: 'XYZ' } }),
            'should return false': shouldEqual(false)
        },

        'When comparing { abc: 123, def: { xyz: 789 } } to { abc: 123, def: 456 }': {
            topic: deepEqual({ abc: 123, def: { xyz: 789 } }, { abc: 123, def: 456 }),
            'should return false': shouldEqual(false)
        },

        'When comparing { abc: 123, def: { xyz: 789 } } to { abc: 123 }': {
            topic: deepEqual({ abc: 123, def: { xyz: 789 } }, { abc: 123 }),
            'should return false': shouldEqual(false)
        },

        'When comparing [123, 456, 789] to [123, 456, 789]': {
            topic: deepEqual([123, 456, 789], [123, 456, 789]),
            'should return true': shouldEqual(true)
        },

        'When comparing [123, 456, 789] to [123, 456, "xyz"]': {
            topic: deepEqual([123, 456, 789], [123, 456, 'xyz']),
            'should return false': shouldEqual(false)
        },

        'When comparing [123, 456, 789] to [123, 456]': {
            topic: deepEqual([123, 456, 789], [123, 456]),
            'should return false': shouldEqual(false)
        },

        'When comparing [123, 456, 789] to "abc"': {
            topic: deepEqual([123, 456, 789], 'abc'),
            'should return false': shouldEqual(false)
        }
    }).export(module);

    function shouldEqual(expected) {
        return function (topic) {
            assert.equal(topic, expected);
        };
    }
}(require('assert'), require('../util/watch')._deepEqual);