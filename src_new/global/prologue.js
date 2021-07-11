const keysPath = '../utils/default-names.json';
const utils = require('../utils/tools.js');

/* Create prologue string
*
*  @keys: the keys provided from the file
*/ 
const writePrologue = (keys) => {

};

/* Clone the global variables
*
* 
*  @keys: the global keys to clone
*  @return: the cloned global object
*/
const cloneGlobals = (keys) => {

}

/* Skip any user requested keys
*
*/
const skip = (keys, exclude) => {
    return keys;
};

/* Create the prologue of each module import 
*
*/
const createPrologueString = (env) => {
    let keys = require(keysPath);
    keys = skip(keys, env);
};

module.exports = {
    create: createPrologueString,
}