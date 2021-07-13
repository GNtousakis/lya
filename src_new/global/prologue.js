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

/* Create the string module imports and 
*  clone all the functions from the global
*  object
*
*/
const createPrologue = (env) => {
    let keys = getKeys(env);
    let prologueString = createPrologueString(keys);

    return prologueString;
};

module.exports = {
    create: createPrologue,
}