/* This handler is called when a function gets executed
*
*  @target:
*  @thisArg:
*  @argumentsList:
*/
const applyHandler = (target, thisArg, argumentsList) => {
    console.log('This is an function')
    const result = Reflect.apply(target, thisArg, argumentsList);
    
    return result;
};

module.exports = {
    applyHandler: applyHandler,
};