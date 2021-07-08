const Module = require('module');
const vm = require('vm');

/* This are the nessasary node.JS functions we use
*  in order to import a module in a codebase
*/
const nativeWrap = Module.wrap;
const nativeRequire = Module.prototype.require;
const nativeRunInThisContext = vm.runInThisContext;
const nativeResolveFilename = Module._resolveFilename;
const nativeLoad = Module._load;

const native = {
    wrap: nativeWrap,
    require: nativeRequire,
    runInThisContext: nativeRunInThisContext,
    _resolveFilename: nativeResolveFilename,
    _load: nativeLoad
};

module.exports = native;