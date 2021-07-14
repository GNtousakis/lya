const v8 = require('v8');

/* Deep clones an object
*
*  @obj: the object to be cloned
*  @return: the cloned object
*/
const objectClone = (obj) => {
  return v8.deserialize(v8.serialize(obj));
};

/* Get all key values from a given object
*
*  @obj: the object to extract the key values
*  @return: the values to be returned
*/
const getValues = (obj) => {
  let keys = [];

  keys = [...keys, ...Object.keys(obj)];
  keys = [...keys, ...Object.getOwnPropertyNames(obj)];

  /* Remove all duplicate values from
  *  the two concated string arrays
  */
  keys = [...new Set(keys)];

  return keys;
};

module.exports = {
  objectClone: objectClone,
  getValues: getValues,
};