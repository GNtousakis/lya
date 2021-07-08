const v8 = require('v8');

/* Deep clones an object
*
*  @obj: the object to be cloned
*  @return: the cloned object
*/
const objectClone = (obj) => {
  return v8.deserialize(v8.serialize(obj));
};

/* Create a unique object from a given object
*
*  @obj: the object to be used
*  @return: the unique object to be used in a WeakMap
*/
const makeUnique = (func) => {
  const _obj = function(...args) {
    let obj;
    if (new.target) {
      return new obj(...args);
    } else {
      return obj.call(this, ...args);
    }
  }

  Object.defineProperty(_obj, 'name', {value: name});
  return _obj;
};

module.exports = {
  objectClone: objectClone,
  makeUnique: makeUnique,
};