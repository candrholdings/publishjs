!function (Processor) {
    'use strict';

    function MockProcessor(overrides) {
        Processor.call(this);

        this.overrides = overrides || {};
    }

    require('util').inherits(MockProcessor, Processor);

    ['_loadCache', '_saveCache', 'work'].forEach(function (name) {
        MockProcessor.prototype[name] = function () {
            (this.overrides[name] || this[name]).apply(this, arguments);
        };
    });

    module.exports = MockProcessor;
}(require('../../processor'));