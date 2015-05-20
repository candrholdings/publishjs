!function (Processor) {
    'use strict';

    function FromProcessor() {
        Processor.apply(this, arguments);
    }

    require('util').inherits(FromProcessor, Processor);

    FromProcessor.prototype.run = function (inputs, outputs, callback) {
    };

    module.export = FromProcessor;
}(require('Processor'));