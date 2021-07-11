const proxy = require('./wrappers/proxy.js');
const modJs = require('./import/modify.js');

const start = (config) => {    
    /* Replace the original nodejs import functions calls
    *  with the modified ones we created
    */
    modJs.modify();
};

module.exports = start;