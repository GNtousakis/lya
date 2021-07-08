// This is for excludes, valueof, toString etc..
const makeExcludes = (list) => {
  const _excludes = new Map();
  for (const name of list) {
    _excludes.set(name, true);
  }
  return _excludes;
};

// Returns the objects name
const getObjectInfo = (obj) => {
  const objName = objectName.has(obj) ? objectName.get(obj) :
    methodNames.has(obj) ? methodNames.get(obj) :
    globalNames.has(obj.name) ? globalNames.get(obj.name) :
    (obj.name) ? obj.name :
    null;
  const objPath = objectPath.has(obj) ? objectPath.get(obj) :
    null;
  // TODO: Add more info...?
  return {
    name: objName,
    path: objPath,
  };
};

const conditionCheck = (name, check, condition) => {
  if (check !== null) {
    if (check !== undefined) {
      if (check.includes(name) === condition) {
        return true;
      }
    }
  }

  return false;
};

// Check that a hook is declared in the analysis
const hookCheck = (hook, ...args) => {
  if (hook !== undefined) {
    return hook.call(this, ...args);
  }
};

module.exports = {
  identity: () => {},
  makeExcludes: makeExcludes,
  getObjectInfo: getObjectInfo,
  conditionCheck: conditionCheck,
  hookCheck: hookCheck,
};
