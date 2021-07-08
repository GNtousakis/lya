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

/* This handler wraps the input values of each required module in 
*  a proxy. Those values are `exports, require, module, __filename,
*  __dirname`, the node locals
*/
const importHandler = (target, thisArg, argumentsList) => {

    for (let counter=0; counter < 5; counter++) {
        const importValue = argumentsList[counter];
        const type = typeof importValue;
        if (type !== 'string'){
            argumentsList[count] = wrapModuleInputs(setLocalGlobal);
        }
    }

    //argumentsList[5] = setLocalGlobal();
    //argumentsList[6] = createGlobalPr();
    Reflect.apply(target, thisArg, argumentsList);
};

module.exports = {
    applyHandler: applyHandler,
    importHandler: importHandler,
};