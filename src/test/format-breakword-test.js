!function (assert, format) {
    'use strict';

    require('vows').describe('Break word').addBatch({
        'When breaking "\\u001b[mabc" into width of 2': {
            topic: format.breakWord('\u001b[mabc', 2),
            'Should return "\\u001b[mab"': function (topic) {
                assert.deepEqual(topic.replace(/\u001b/g, '\\u001b'), '\\u001b[mab');
            }
        }
    }).export(module);
}(require('assert'), require('../util/format'));