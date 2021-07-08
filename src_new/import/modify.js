const Module = require('module');
const vm = require('vm');
const native = require('./native.js');
const proxy = require('../wrappers/proxy.js');

/* We modify the `require` native function
*  in order to wrap the export functions 
*  with a proxy
*
*  @args[0]:
*  @args[1]: 
*/
const modRequire = (...args) => {
    let moduleExports = native.require.apply(this, args);
    moduleExports = proxy.setProxy(moduleExports);
    
    return moduleExports;
}

/* We modify the `_load` native function in order to create 
*  onImport analysis hook
*
*  @args[0]: 
*  @args[1]:
*  @args[2]:
*  @result: contains the loaded object from the require
*/
const modLoad = (...args) => {
    const result = native._load.call(this, ...args);

    return result;
};

/* We modify the `runInThisContext` native function in order to 
*  create the source manipulation analyses
*
*  @args[0]: src
*  @args[1]: options
*  @result: the function object created by src
*/
const modRunInThisContext = (...args) => {
    const result = native.runInThisContext(...args);

    return result;
};

/* We modify the `wrap` native function in order to 
*  
*  @args[0]: The code that we are imported in a string format
*  @results: 
*/
const modWrap = (...args) => {
    let results = native.wrap(...args);

    return results;
};

const modify = () => {
    Module.prototype.require = modRequire;
    Module._load = modLoad;
    Module.wrap = modWrap;
    vm.runInThisContext = modRunInThisContext;
};

module.exports = {
    modify: modify,
};