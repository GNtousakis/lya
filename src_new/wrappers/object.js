/* This handler is called when we get an object
*
*  @target:
*  @name:
*/
const getHandler = (target, name) => {
    console.log('This is an object')
    const result = Reflect.get(target, name);

    return result;
};

/* This handler is called when we get an object
*
*  @target:
*  @thisArg:
*  @argumentsList:
*/
const setHandler = (target, name, value) => {
    const result = Reflect.set(target, name, value);

    return result;
};

/* This handler is called when we get an object
*
*  @target:
*  @prop:
*/
const hasHandler = (target, prop) => {
    const result = Reflect.has(target, prop);

    return result;
};

/* This handler is called when we get an object
*
*  @target:
*  @prop:
*/
const constructHandler = (target, args) => {
    const result = Reflect.construct(target, args);
    
    return result;
};


module.exports = {
    getHandler: getHandler,
    setHandler: setHandler,
    hasHandler: hasHandler,
    constructHandler: constructHandler,
};