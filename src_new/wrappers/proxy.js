const wrapper = require('./wrapper.js');
const tools = require('../utils/tools.js');
const wrapped = new Set();

/* Add newlity proxy wrapped object to list
*  of wrapped modules 
*
* @object: object
* @object: object
*/
const addWrapList = (object) => {
    wrapped.add(object);
    return object;
};

/* Checks if a given object is already wrapped in a proxy
*
* @object: object to check for wrappers
* @object: true or false
*/
const isWrapped = (object) => {
    if (wrapped.has(object)) {
        return true;
    } else {
        addWrapList(object);
        return false;
    }
};

/* Wraps the function in a proxy 
*  
*  @object: The function you want to wrap in a proxy
*  @config: The configuration options
*  @return: The function wrapped in a proxy
*/
const wrapFunction = (func, config) => {
    const handler = wrapper.createHandler();

    return addWrapList(new Proxy(func, handler));
};

/* Parse the given object and wrap each of its
*  values in a wrapper
*  
*  @object: The object you want to wrap in a proxy
*  @config: The configuration options
*  @return: The object wrapped in a proxy
*/
const parseObject = (object, config) => {
    if (isWrapped(object)) {
        return object;
    };
    
    const handler = wrapper.createHandler();
    const objLength = Object.keys(object).length;

    for (let count=0; count < objLength; count++) {
        const key = Object.keys(object)[count];
        const type = typeof object[key];
        
        if (type === 'object') {
            object[key] = parseObject(object[key]);
        } else if (type === 'function') {
            object[key] = wrapFunction(object[key]);
        };
    };
    
    return addWrapList(new Proxy(object, handler));
};

/* Wrap the selected object in a proxy
*
*  @object: The object you want to wrap in a proxy
*  @config: The configuration options
*  @return: The object wrapped in a proxy
*/
const setProxy = (object, config) => {
    const type = typeof object;

    if (type === 'object') {
        object = parseObject(object);
    } else if (type === 'function') {
        object = wrapFunction(object);
    }

    return object;  
};

/* Wrap the selected global object in a proxy
*
*  @object: The object you want to wrap in a proxy
*  @config: The configuration options
*  @return: The object wrapped in a proxy
*/
const setGlobalProxy = (object, config) => {
    const type = typeof object;
    
    if (type === 'object') {
        object = parseObject(object);

    } else if (type === 'function') {
        object = wrapFunction(object);

    }

    return object;  
};


module.exports = {
    setProxy: setProxy,
    setGlobalProxy: setGlobalProxy,
}