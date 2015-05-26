!function () {
    'use strict';

    function CacheProvider() {}

    CacheProvider.prototype.load = function (name, callback) {
        callback(new Error('CacheProvider.load must be implemented'));
    };

    CacheProvider.prototype.save = function (name, inputs, outputs, callback) {
        callback(new Error('CacheProvider.save must be implemented'));
    };

    module.exports = CacheProvider;
}();