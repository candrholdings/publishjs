!function (Processor) {
    'use strict';

    function MockProcessor() {
        Processor.call(this, {}, '0', 'MockProcessor');

        this.overrides = {};
    }

    require('util').inherits(MockProcessor, Processor);

    ['_loadCache', '_saveCache', 'run'].forEach(function (name) {
        MockProcessor.prototype[name] = function () {
            (this.overrides[name] || Processor.prototype[name]).apply(this, arguments);
        };
    });

    module.exports = MockProcessor;
}(require('../../processor'));