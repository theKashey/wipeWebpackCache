"use strict";

function waveCallback_default() {
  return true;
}

function removeFromCache(moduleName) {
  delete require.cache[moduleName];
}
/**
 * Wipes webpack module cache.
 * First it look for modules to wipe, and wipe them.
 * Second it looks for users of that modules and wipe them to. Repeat.
 * Use waveCallback to control secondary wave.
 * @param {Object} stubs Any objects, which will just be passed as first parameter to resolver.
 * @param {Function} resolver function(stubs, moduleName) which shall return true, if module must be wiped out.
 * @param {Function} [waveCallback] function(moduleName) which shall return false, if parent module must not be wiped.
 */
function wipeCache(stubs, resolver, waveCallback) {

  if (!module.hot) {
    var error = new Error("wipeWebpackCache: HRM must be enabled, please add HotModuleReplacementPlugin or specify --hot");
    console.error(error.message);
    throw error;
  }

  if (typeof __webpack_modules__ === 'undefined') {
    console.error('wipeWebpackCache:');
    throw new Error("wipeWebpackCache: requires webpack environment. Use wipeNodeCacheInstead");
  }

  if (Object.keys(__webpack_modules__)[0] === '0' &&
      module.id.indexOf('wipe-webpack-cache') < 0
  ) {
    var error = new Error("wipeWebpackCache: you have to provide modulesNames, please add NamedModulesPlugin to your webpack configuration");
    console.error(error.message);
    throw error;
  }

  waveCallback = waveCallback || waveCallback_default;
  var wipeList = [];

  var cache = require.cache;

  // First wave
  Object.keys(cache).forEach(function (moduleName) {
    var test = resolver(stubs, moduleName);
    if (test) {
      wipeList.push.apply(wipeList, cache[moduleName].parents);
      removeFromCache(moduleName);
    }
  });

  // Secondary wave
  while (wipeList.length) {
    var removeList = wipeList;
    wipeList = [];

    removeList.forEach(function (moduleName) {
      if (cache[moduleName] && waveCallback(moduleName)) {
        wipeList.push.apply(wipeList, cache[moduleName].parents);
        removeFromCache(moduleName);
      }
    });
  }
}

module.exports = wipeCache;