/* An object mirror itself without a problem
*
*/
var require = require('../../../src_new/core')(require);

const test = require('./infiniteLoops.js');

console.log('Add 1 + 3 =', test.calculator.add(1, 3));
console.log('Add 4 + 5 =', test.calculator.add(4, 5));
console.log('Add 2 + 3 =', test.calculator.add(2, 3));

console.log('Add 1 + 3 =', test.calculator.self.add(1, 3));
console.log('Add 4 + 5 =', test.calculator.self.add(4, 5));
console.log('Add 2 + 3 =', test.calculator.self.add(2, 3));
