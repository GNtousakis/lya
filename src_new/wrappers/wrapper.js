const func = require('./function.js');
const object = require('./object.js');

/* Create handler for proxy object
*
*/
const createHandler = () => {
    return {
        apply: func.applyHandler,
        get: object.getHandler,
        set: object.setHandler,
        has: object.hasHandler,
        construct: object.constructHandler,
    }
};

/* This handler wraps the input values of each required module in 
*  a proxy. Those values are `exports, require, module, __filename,
*  __dirname`, the node locals. The handler adds 
*/
const importHandler = (target, thisArg, argumentsList) => {
    const handler = createHandler();
    for (let counter=0; counter < 5; counter++) {
        const importValue = argumentsList[counter];
        const type = typeof importValue;
        if (type !== 'string'){
            argumentsList[count] = new Proxy(importValue, handler);
        }
    }

    //argumentsList[5] = setLocalGlobal();
    //argumentsList[6] = createGlobalPr();
    Reflect.apply(target, thisArg, argumentsList);
};

/* Create handler for imported module top values
*  Those values are `exports, require, module, __filename,
*  __dirname`, the node locals
*/
const createInputHandler = () => {
    return {
        apply: importHandler,
    }
};

module.exports = {
    createHandler : createHandler,
    createInputHandler: createInputHandler,
};