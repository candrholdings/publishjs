!function () {
  'use strict';

  function CacheProvider() {}

  CacheProvider.prototype.startSession = function (cacheKey) {
    throw new Error('CacheProvider.startSession must be implemented');
  };

  CacheProvider.prototype.endSession = function () {
    throw new Error('CacheProvider.endSession must be implemented');
  };

  CacheProvider.prototype.load = function (name, callback) {
    callback(new Error('CacheProvider.load must be implemented'));
  };

  CacheProvider.prototype.save = function (name, inputs, outputs, callback) {
    callback(new Error('CacheProvider.save must be implemented'));
  };

  module.exports = CacheProvider;
}();