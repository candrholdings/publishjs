!function (assert, Processor) {
    'use strict';

    require('vows').describe('Processor formatLog function').addBatch({
        'When formatting "ABC\\nDEF\\nXYZ" with "Hello" of width 8': {
            topic: Processor._formatLog('Hello', 'ABC\nDEF\nXYZ', 8),
            'should return a "Hello   : ABC\\n          DEF\\n          XYZ"': function (topic) {
                assert.equal(topic, 'Hello   : ABC\n          DEF\n          XYZ');
            }
        }
    }).export(module);
}(require('assert'), require('../processor'));