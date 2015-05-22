!function (assert, Processor) {
    'use strict';

    require('vows').describe('Processor pad function').addBatch({
        'When filling "ABC" with up to 5 spaces': {
            topic: Processor._pad('ABC', 5, ' '),
            'should return a "  ABC"': function (topic) {
                assert.equal(topic, '  ABC');
            }
        }
    }).export(module);
}(require('assert'), require('../processor'));