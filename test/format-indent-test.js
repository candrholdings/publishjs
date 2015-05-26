!function (assert, format) {
    'use strict';

    require('vows').describe('Format indent function').addBatch({
        'When indenting "ABC" for 5 spaces': {
            topic: format.indent('ABC', 5),
            'should return a "     ABC"': function (topic) {
                assert.equal(topic, '     ABC');
            }
        }
    }).export(module);
}(require('assert'), require('../format'));