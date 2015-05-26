!function (assert, Processor) {
    'use strict';

    require('vows').describe('Processor indent function').addBatch({
        'When indenting "ABC" for 5 spaces': {
            topic: Processor._indent('ABC', 5),
            'should return a "     ABC"': function (topic) {
                assert.equal(topic, '     ABC');
            }
        }
    }).export(module);
}(require('assert'), require('../processor'));