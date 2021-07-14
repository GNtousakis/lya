const keysPath = '../utils/default-names.json';
const proxy = require('../wrappers/proxy.js');

/* Clone the global variables
*
* 
*  @keys: the global keys to clone
*  @return: the cloned global object
*/
const clone = (name) => {
    const original = global[name];
    const cloned = function(...args) {
        if (new.target) {
            return new original(...args);
        } else {
            return original.call(this, ...args);
        }
    };

    Object.defineProperty(cloned, 'name', {value: name});
    return cloned;
};

/* Wrap the cloned object in a proxy
*
*  @obj: the cloned global object
*  @return: the cloned global object wrapped 
*  in a proxy
*/
const wrap = (obj) => {
    let wrapped = proxy.setGlobalProxy(obj);

    return wrapped;
};

/* Skip any user requested keys from 
*
*/
const skip = (keys, exclude) => {
    
    return keys;
};

/* Read the keys from the default-names.json
*  file and skip any user requested keys
*
*/
const getKeys = (env) => {
    let keys = require(keysPath);
    keys = skip(keys, env);
    
    return keys;
}

/* Create the string that we import on all
*  imported modules
*
*  @json: the required json object that holds 
*  the key values and names
*  @return: the prologue string 
*/
const createPrologueString = (json) => {
    let prologue = '';
    for (const category in json) {
        for (const number in json[category]) {
            const name = json[category][number];
            prologue += 'var ' + name + ' = localGlobal["' +
                name + '"];\n';
        };
    };

    /* Add the global object to the
    *  computed string
    */
    prologue = 'var global = localGlobal["proxyGlobal"]\n' + prologue;

    return prologue;
}

/* We use this function in order to parse all the values 
*  provided by the user that we need to parse and clone 
*  them in order to wrap them in a proxy 
*
*  @json: the required json object that holds 
*  the key values and names
*  @return: the clonned values of global object
*/
const createPrologueGlobals = (json) => {
    let globals = {};
    for (const category in json) {
        for (const number in json[category]) {
            const name = json[category][number];
            const clonedObj = clone(name);
            globals[name] = wrap(clonedObj);
        };
    };

    return globals;
}

/* Create the string module imports and 
*  clone all the functions from the global
*  object
*
*/
const createPrologue = (env) => {
    let keys = getKeys(env);
    lyaEnv.prologueString = createPrologueString(keys);
    lyaEnv.prologueGlobals = createPrologueGlobals(keys);
};

module.exports = {
    create: createPrologue,
}