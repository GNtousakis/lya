lyaEnv = {};
const proxy = require('./wrappers/proxy.js');
const modJs = require('./import/modify.js');
const prologue = require('./global/prologue.js');

const start = (config) => {    
    /* Parses the config object and creates the
    *  the lyaEnv global variable
    */
    // tools.parseConfig(config)
    
    /* Creates the prologue string and clones
    *  the global object values in order to be imported
    */ 
    prologue.create(config);

    /* Replace the original nodejs import functions calls
    *  with the modified ones we created
    */
    modJs.modify();
};

module.exports = start;