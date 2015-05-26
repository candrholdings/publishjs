!function (assert, format) {
    'use strict';

    require('vows').describe('Format log function').addBatch({
        'When formatting "ABC\\nDEF\\nXYZ" with "Hello" of width 12': {
            topic: format.log('Hello', 'ABC\nDEF\nXYZ'),
            'should return a "Hello       : ABC\\n              DEF\\n              XYZ"': function (topic) {
                assert.equal(topic, 'Hello       : ABC\n              DEF\n              XYZ');
            }
        }
    }).export(module);
}(require('assert'), require('../util/format'));