if (parseInt(process.env.key) != 0) {
        lyaConfig = {
        SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
        analysisCh: parseInt(process.env.key),
        };
        let lya = require("../../../../src/txfm.js");
        require = lya.configRequire(require, lyaConfig);
}
const time = process.hrtime();
const fs = require('fs');


let x = require("./m1.js");
console.log(x);
let y = x + 1;

const diff = process.hrtime(time);
const thisTime = (diff[0] * 1e9 + diff[1]) * 1e-6;
var logger = fs.createWriteStream('timetest.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})
logger.write('The time of ' + parseInt(process.env.key) + ' is ' + thisTime + ' \n', 'utf-8');

