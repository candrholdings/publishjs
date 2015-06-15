!function (assert, format) {
    'use strict';

    require('vows').describe('Format pad function').addBatch({
        'When filling "ABC" with up to 5 spaces on the left': {
            topic: format.padLeft('ABC', 5, ' '),
            'should return a "  ABC"': function (topic) {
                assert.equal(topic, '  ABC');
            }
        },

        'When filling "ABC" with up to 5 spaces on the right': {
            topic: format.padRight('ABC', 5, ' '),
            'should return a "ABC  "': function (topic) {
                assert.equal(topic, 'ABC  ');
            }
        }
    }).export(module);
}(require('assert'), require('../util/format'));