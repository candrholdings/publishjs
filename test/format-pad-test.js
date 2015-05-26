!function (assert, format) {
    'use strict';

    require('vows').describe('Format pad function').addBatch({
        'When filling "ABC" with up to 5 spaces': {
            topic: format.pad('ABC', 5, ' '),
            'should return a "ABC  "': function (topic) {
                assert.equal(topic, 'ABC  ');
            }
        }
    }).export(module);
}(require('assert'), require('../format'));