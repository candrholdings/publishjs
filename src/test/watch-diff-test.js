!function (assert, diff) {
    'use strict';

    require('vows').describe('Unit testing watcher.diff function').addBatch({
        'When diffing true to true': {
            topic: diff(true, true),
            'should return undefined': shouldBeUndefined
        },

        'When diffing 1 to 1': {
            topic: diff(1, 1),
            'should return undefined': shouldBeUndefined
        },

        'When diffing "abc" to "abc"': {
            topic: diff('abc', 'abc'),
            'should return undefined': shouldBeUndefined
        },

        'When diffing two date of same value': {
            topic: diff(new Date(946656000000), new Date(946656000000)),
            'should return undefined': shouldBeUndefined
        },

        'When diffing two functions of same reference': {
            topic: diff(shouldEqual, shouldEqual),
            'should return undefined': shouldBeUndefined
        },

        'When diffing true to false': {
            topic: diff(true, false),
            'should return false': shouldEqual(false)
        },

        'When diffing 0 to 1': {
            topic: diff(0, 1),
            'should return 1': shouldEqual(1)
        },

        'When diffing "abc" to "xyz"': {
            topic: diff('abc', 'xyz'),
            'should return "xyz"': shouldEqual('xyz')
        },

        'When diffing { abc: 123, def: { xyz: 789 } } to { abc: 123, def: { xyz: 789 } }': {
            topic: diff({ abc: 123, def: { xyz: 789 } }, { abc: 123, def: { xyz: 789 } }),
            'should return undefined': shouldBeUndefined
        },

        'When diffing { abc: 123, def: { xyz: 789 } } to { abc: 123, def: { xyz: "XYZ" } }': {
            topic: diff({ abc: 123, def: { xyz: 789 } }, { abc: 123, def: { xyz: 'XYZ' } }),
            'should return { def: { xyz: "XYZ" } }': shouldEqual({ def: { xyz: 'XYZ' }})
        },

        'When diffing { abc: 123, def: { xyz: 789 } } to { abc: 123, def: 456 }': {
            topic: diff({ abc: 123, def: { xyz: 789 } }, { abc: 123, def: 456 }),
            'should return { def: 456 }': shouldEqual({ def: 456 })
        },

        'When diffing { abc: 123, def: { xyz: 789 } } to { abc: 123 }': {
            topic: diff({ abc: 123, def: { xyz: 789 } }, { abc: 123 }),
            'should return { def: undefined }': shouldEqual({ def: undefined })
        },

        'When diffing [123, 456, 789] to [123, 456, 789]': {
            topic: diff([123, 456, 789], [123, 456, 789]),
            'should return undefined': shouldBeUndefined
        },

        'When diffing [123, 456, 789] to [123, 456, "xyz"]': {
            topic: diff([123, 456, 789], [123, 456, 'xyz']),
            'should return [123, 456, "xyz"]': shouldEqual([123, 456, 'xyz'])
        },

        'When diffing [123, 456, 789] to [123, 456]': {
            topic: diff([123, 456, 789], [123, 456]),
            'should return [123, 456]': shouldEqual([123, 456])
        },

        'When diffing [123, 456, 789] to "abc"': {
            topic: diff([123, 456, 789], 'abc'),
            'should return "abc"': shouldEqual('abc')
        }
    }).export(module);

    function shouldEqual(expected) {
        return function (topic) {
            assert.deepEqual(topic, expected);
        };
    }

    function shouldBeUndefined(topic) {
        assert.equal(typeof topic, 'undefined');
    }
}(require('assert'), require('../util/watch')._diff);