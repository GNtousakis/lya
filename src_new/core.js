const proxy = require('./wrappers/proxy.js');
const modJs = require('./import/modify.js');

const start = (require, config) => {    
    /* Replace the original nodejs import functions calls
    *  with the modified ones we created
    */
    modJs.modify();

    /* Wrap the `require` object in a proxy
    *  and return it to the main program
    */
    return proxy.setProxy(require);
};

module.exports = start;