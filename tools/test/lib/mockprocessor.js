!function (Processor) {
    'use strict';

    function MockProcessor() {
        var args = [].slice.call(arguments);

        Processor.apply(this, args.length ? args : [{}, '0', 'MockProcessor']);

        this.overrides = {
            _loadCache: function (callback) {
                var cache = this._getMockCache();

                callback(null, cache.inputs, cache.outputs);
            },
            _saveCache: function (inputs, outputs, callback) {
                var cache = this._getMockCache();

                cache.inputs = inputs;
                cache.outputs = outputs;

                callback();
            }
        };
    }

    require('util').inherits(MockProcessor, Processor);

    ['_loadCache', '_saveCache', 'run'].forEach(function (name) {
        MockProcessor.prototype[name] = function () {
            (this.overrides[name] || Processor.prototype[name]).apply(this, arguments);
        };
    });

    MockProcessor.prototype._getMockCache = function () {
        return MockProcessor.cache[this._sessionID] || (MockProcessor.cache[this._sessionID] = { inputs: {}, outputs: {} });
    };

    MockProcessor.cache = {};

    MockProcessor.cleanup = function () {
        MockProcessor.cache = {};
    };

    module.exports = MockProcessor;
}(require('../../processor'));