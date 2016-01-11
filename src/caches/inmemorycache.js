!function (Cache, path) {
  'use strict';

  function InMemoryCache(options) {
    Cache.call(this);

    this.options = options;
    this.cache = {};
  }

  require('util').inherits(InMemoryCache, Cache);

  InMemoryCache.prototype.startSession = function (cacheKey) {
    if (this._cacheKey !== cacheKey) {
      this._cacheKey = cacheKey;
      this.cache = {};
    }
  };

  InMemoryCache.prototype.stopSession = function () {
  };

  InMemoryCache.prototype.load = function (name, callback) {
    var cache = this.cache[name];

    callback(null, (cache && cache.inputs) || {}, (cache && cache.outputs) || {});
  };

  InMemoryCache.prototype.save = function (name, inputs, outputs, callback) {
    this.cache[name] = { inputs: inputs, outputs: outputs };

    callback();
  };

  module.exports = function (options) { 
    return new InMemoryCache(options);
  };

  module.exports.InMemoryCache = InMemoryCache;
}(
  require('../cache'),
  require('path')
);