/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

// We import and declare all the necessary modules
const Module = require('module');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// All the necessary modules for swap
const originalWrap = Module.wrap;
const originalRequire = Module.prototype.require;
const originalRun = vm.runInThisContext;

// We declare the variables
const globalProxy = {};
const variableCall = {};

// We store names as a lifo
const trueName = {};
let count = 0;

// Holds the end of each name store of new assigned global variables
const endName = '@name';

// This holds the string of the transformations inside modules
let finalDecl = ' ';

// We store the time parametres
const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

// Array to store the time of the modules
const timeCapsule = {};

// WeakMaps to store the name and the path
const objName = new WeakMap();
const objPath = new WeakMap();

// We read and store the data of the json file
const jsonData = require('./globals.json');
const jsonStaticData = require('./staticGlobals.json');
// const jsonPrototypeData = require('./prototypeGlobals.json');

// We return the choice of the user
// 1) True - False Analysis
// 2) Times calling a function
// 3) Time Analysis
// 4) Time Analysis2.0
// 5) Enforcement Analysis
const analysisChoice = () => {
  let choice;
  try {
    choice = lyaConfig.analysisCh;
  } catch (ReferenceError) {
    choice = 1;
  }

  if (choice != 1 && choice != 2 && choice != 3 && choice != 4 && choice !=5) {// Add more
    return 1;
  }
  return choice;
};
const userChoice = analysisChoice();

if (userChoice === 5) {
  dynamicObj = createDynamicObj();
};

// We need to get the path of the main module in order to find dynamic json
const createDynamicObj = () => {
  const appDir = path.dirname(require.main.filename);
  const jsonDir = appDir + '/dynamic.json';
  let dynamicData = {};
  try {
    dynamicData = require(jsonDir);//We save all the json data inside an object
  } catch (e) {
    console.log('null');// A command to end the program
    return null;// If found nothing
  }

  return dynamicData;
};

// We export the require to the main function
trueName[0] = 'main';
variableCall[trueName[0]] = {};
module.exports = {
  configRequire: (origRequire, origConfig) => {
    lyaConfig = origConfig;
    return mainRequire(origRequire);
  },
};

// The handler of the global variable
// Every time we access the global variabe in order to declare or call
// a variable, then we can print it on the export file. It doesnt work
// if it isn't called like global.xx
const handlerGlobal= {
  get: function(target, name) {
    if (typeof target[name+endName] != 'undefined') {
      const currentName = trueName[count];
      const nameToShow = target[name+endName];
      if (userChoice != 5){
        onModuleControl(variableCall[currentName], nameToShow);
      } else {
        onModuleControl(dynamicObj[currentName], nameToShow);
      }
    }

    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    if (typeof value === 'number') {
      const currentName = trueName[count];
      const nameToStore = 'global.' + name;
      const result = Reflect.set(target, name, value);
      // In order to exist a disticton between the values we declared ourselfs
      // We declare one more field with key value that stores the name
      Object.defineProperty(target, name+endName, {value: nameToStore});
      if (userChoice != 5){
        onModuleControl(variableCall[currentName], nameToStore);
      } else {
        onModuleControl(dynamicObj[currentName], nameToStore);
      }
      return result;
    }

    return Reflect.set(target, name, value);
  },
};

// We wrap the global variable in a proxy
global = new Proxy(global, handlerGlobal);

// Case handler
// Returns the right require handler for the case
const mainRequire = (original) => {
  if (userChoice === 1) {// Case 1 - True False
    return new Proxy(original, RequireTrue);
  } else if (userChoice === 2) {// Case 2 - Counter
    return new Proxy(original, RequireCounter);
  } else if (userChoice === 3) {// Case 3 - Time
    return new Proxy(original, RequireTime);
  } else if (userChoice === 4) {// Case 4 - Time2.0
    return new Proxy(original, RequireTime2);
  } else if (userChoice === 5) {// Case 5 - Enforcement
    return new Proxy(original, EnforcementCheck);
  }// Add more
};

// We incriment and declare the ness things
// This is for the handlerObjExport
const exportControl = (storedCalls, truename) => {
  if (userChoice === 1) {// Case 1 - True False
    if (storedCalls === 'undefined') {
      storedCalls = {};
      storedCalls[truename] = true;
    } else {
      storedCalls[truename] = true;
    }
  } else if (userChoice === 2) {// Case 2 - Counter
    if (storedCalls === 'undefined') {
      storedCalls = {};
      storedCalls[truename] = 1;
    } else {
      if (storedCalls[truename] === undefined) {// Why this undef?
        storedCalls[truename] = 1;
      } else {
        storedCalls[truename]++;
      }
    }
  } else if (userChoice === 5) {// Case 5 - Enforcement
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      throw new Error("Something went badly wrong in " + truename);
    }
  }// Add more
};

// We incriment and declare the ness things
// This is for handlerExports
const exportFuncControl = (storedCalls, truename, arguments) => {
  if (userChoice === 1) {// Case 1 - True False
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 2) {// Case 2 - Counter
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = 1;
    } else {
      storedCalls[truename]++;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 3) {// Case 3 - Time
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      storedCalls[truename] = (diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS;

      return result;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 4) {// Case 4 - Time2
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      if (timeCapsule[count] != undefined) {
        timeCapsule[count] = ((diff[0] * NS_PER_SEC + diff[1]) *
        MS_PER_NS) + timeCapsule[count];
      } else {
        timeCapsule[count] = (diff[0] * NS_PER_SEC + diff[1]) *
        MS_PER_NS;
      }

      if (timeCapsule[count+1] != undefined) {
        storedCalls[truename] = timeCapsule[count] - timeCapsule[count+1];
        timeCapsule[count+1] = 0;
      } else {
        storedCalls[truename] = timeCapsule[count];
      }

      return result;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 5) {// Case 5 - Enforcement
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      throw new Error("Something went badly wrong in " + truename);
    }

    return Reflect.apply(...arguments);
  }// Add more
};

// We change the original module control
// We either declare true or false or incriment a counter or timer
// Works only with functions -- it runs Reflect.apply
const onModuleControlFunc= (storedCalls, truename, arguments) => {
  if (userChoice === 1) {// Case 1 - True False
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 2) {// Case 2 - Counter
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = 1;
    } else {
      storedCalls[truename]++;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 3) {// Case 3 - Timer
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      storedCalls[truename] = (diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS;

      return result;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 4) {// Case 4 - Timer2
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      if (timeCapsule[count] != undefined) {
        timeCapsule[count] = ((diff[0] * NS_PER_SEC + diff[1]) *
        MS_PER_NS) + timeCapsule[count];
      } else {
        timeCapsule[count] = (diff[0] * NS_PER_SEC + diff[1]) *
        MS_PER_NS;
      }

      if (timeCapsule[count+1] != undefined) {
        storedCalls[truename] = timeCapsule[count] - timeCapsule[count+1];
        timeCapsule[count+1] = 0;
      } else {
        storedCalls[truename] = timeCapsule[count];
      }

      return result;
    }

    return Reflect.apply(...arguments);
  } else if (userChoice === 5) {// Case 5 - Enforcement
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      throw new Error("Something went badly wrong!");
    }

    return Reflect.apply(...arguments);
  }// Add more
};

// We change the original module control
// We either declare true or false or incriment a counter
const onModuleControl= (storedCalls, truename) => {
  if (userChoice === 1) {// Case 1 - True False
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }
  } else if (userChoice === 2) {// Case 2 - Counter
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = 1;
    } else {
      storedCalls[truename]++;
    }
  } else if (userChoice === 5) {// Case 5 - Enforcement
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
	throw new Error("Something went badly wrong in " + truename);
    } 
  }// Add more
};

// ****************************
// Handlers of Proxies
// The handler of the functions
const handler= {
  apply: function(target) {
    const currentName = trueName[count];
    if (userChoice === 5) {// This will be removed when we make it modular
      return onModuleControlFunc(dynamicObj[currentName],
        target.name, arguments); 
    }

    return onModuleControlFunc(variableCall[currentName],
        target.name, arguments);
  },
  get: function(target, name) {
    const currentName = trueName[count];
    if (userChoice != 5){
      onModuleControl(variableCall[currentName], target.name);
    } else {
      onModuleControl(dynamicObj[currentName], target.name);
    }

    return Reflect.get(target, name);
  },
};



// The handler of require of True-False case_1
const RequireTrue = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = trueName[count];
    const origReqModuleName = argumentsList[0];
    variableCall[currentName]['require(\'' + origReqModuleName + '\')'] = true;
    return Reflect.apply(...arguments);
  },
};

// The handler of require of Counter case_2
const RequireCounter= {
  apply: function(target) {
    const currentName = trueName[count];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    variableCall[currentName][nameReq] = 1;

    return Reflect.apply( ...arguments);
  },
};

// The handler of require of Counter case_3
const RequireTime= {
  apply: function(target) {
    const currentName = trueName[count];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    const time = process.hrtime();
    const result = Reflect.apply( ...arguments);
    const diff = process.hrtime(time);
    variableCall[currentName][nameReq] = (diff[0] * NS_PER_SEC + diff[1]) *
     MS_PER_NS;
    return result;
  },
};

// The handler of require of Counter case_4
const RequireTime2= {
  apply: function(target) {
    const currentName = trueName[count];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    const time = process.hrtime();
    const result = Reflect.apply( ...arguments);
    const diff = process.hrtime(time);
    if (timeCapsule[count] != undefined) {
      timeCapsule[count] = ((diff[0] * NS_PER_SEC + diff[1]) *
        MS_PER_NS) + timeCapsule[count];
    } else {
      timeCapsule[count] = (diff[0] * NS_PER_SEC + diff[1]) *
        MS_PER_NS;
    }

    if (timeCapsule[count+1] != undefined) {
      variableCall[currentName][nameReq] = timeCapsule[count] -
        timeCapsule[count+1];
      timeCapsule[count+1] = 0;
    } else {
      variableCall[currentName][nameReq] = timeCapsule[count];
    }

    return result;
  },
};

// The handler of require of Enforcement
const EnforcementCheck= {
  apply: function(target) {
    const currentName = trueName[count];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    if (Object.prototype.hasOwnProperty.
          call(dynamicObj,currentName,nameReq) === true) {
      return Reflect.apply( ...arguments);
    }

    return Reflect.apply( ...arguments);
  },
};

// The handler of compiledWrapper
// We wrap the compiledWrapper code in a proxy so
// when it is called it will do this actions =>
const handlerAddArg= {
  apply: function(target, thisArg, argumentsList) {
    // We catch local require in order to wrap it
    let localRequire = argumentsList[1];
    localRequire = mainRequire(localRequire);
    argumentsList[1] = localRequire;// We wrap require
    argumentsList[5] = globalProxy;// We pass the global values with the proxies

    return Reflect.apply( ...arguments);
  },
};

function isCyclic(object) {
   const seenObjects = new WeakMap(); // use to keep track of which objects have been seen.

   function detectCycle(obj) {
      // If 'obj' is an actual object (i.e., has the form of '{}'), check
      // if it's been seen already.
      if (Object.prototype.toString.call(obj) == '[object Object]') {

         if (seenObjects.has(obj)) {
            return true;
         }

         // If 'obj' hasn't been seen, add it to 'seenObjects'.
         // Since 'obj' is used as a key, the value of 'seenObjects[obj]'
         // is irrelevent and can be set as literally anything you want. I 
         // just went with 'undefined'.
         seenObjects.set(obj, undefined);

         // Recurse through the object, looking for more circular references.
         for (var key in obj) {
            if (detectCycle(obj[key])) {
               return true;
            }
         }

      // If 'obj' is an array, check if any of it's elements are
      // an object that has been seen already.
      } else if (Array.isArray(obj)) {
         for (var i in obj) {
            if (detectCycle(obj[i])) {
               return true;
            }
         }
      }

      return false;
   }

   return detectCycle(object);
}

// The handler of the imported libraries
const handlerExports= {
  apply: function(target, thisArg, argumentsList) {
    let currentName;
    let truename;

    truename = objName.get(target);
    currentName = objPath.get(target);
    truename = truename + '.' + target.name;
    if (userChoice === 5) {// This will be removed when we make it modular
      return exportFuncControl(dynamicObj[currentName],
        truename, arguments); 
    }

    return exportFuncControl(variableCall[currentName], truename, arguments);
  },
};

// We first wrap the export obj so that we avoid to
// print functions that are not called by us
//
// require('fs);
// fs.openSync(pizza);
// fs.read(katiAllo);
//
// fs.read () => {... fs.resolve(...) ... return...}
const handlerObjExport= {
  get: function(target, name, receiver) {
    if (typeof target[name] != 'undefined') {

      // If we try to grab an object we wrap it in this proxy
      if (typeof target[name] === 'object') {
        
        let truepath = objPath.get(receiver);
        let truename = objName.get(receiver);
        if (truepath === undefined) {
          truepath = objPath.get(target);
          truename = objName.get(target);
        }

        const localObject = target[name];
        target[name] = new Proxy(localObject, handlerObjExport);
        
        objName.set(target[name], truename + '.' + name);
        objPath.set(target[name], truepath);

        // If we try to call a string that is not truename or truepath
        // We take the path that we are by using true_count
        // We need to print access to that variable
      } else if (typeof target[name] === 'string') {
        if (name != 'truename' && name != 'truepath') {
          let truepath = objPath.get(receiver);
          let truename = objName.get(receiver);
          if (truepath === undefined) {
            truepath = objPath.get(target);
            truename = objName.get(target);
          }

          truename = truename + '.' + name;
          if (userChoice === 5) {
            exportControl(dynamicObj[trueName[count]], truename);
          } else {
            exportControl(variableCall[trueName[count]], truename);
          }
        }
      } else {
        let localFunction = target[name];
        if (typeof localFunction != 'number' && typeof localFunction != 'boolean' &&
           typeof localFunction != 'symbol') {
          Object.defineProperty(localFunction, 'name', {value: name});
          target[name] = new Proxy(localFunction, handlerExports);
          objPath.set(localFunction, trueName[count]);
          objName.set(localFunction, objName.get(target));
        }
      }
    }

    return Reflect.get(target, name);
  },
};

// We wrap every function on global obj that exists in globals.json
// Returns the proxy obj we want
const proxyWrap = function(handler, obj) {
  if (typeof obj === 'function') {
    obj = new Proxy(obj, handler);
    return obj;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const type = typeof obj[key];
      if (type === 'number' || type === 'boolean' ) {
        console.log('Do nothing');
      } else if (type === 'object') {
        obj[key] = proxyWrap(obj[key]);
      } else {
        obj[key] = new Proxy(obj[key], handler);
      }
    }
  }

  return obj;
};

// We declare the data on the same time to pass them inside wrapped function
const createGlobal = (name, finalDecl) => {
  if (global[name] != undefined) {
    globalProxy[name] = proxyWrap(handler, global[name]);
    finalDecl = 'let ' + name + ' = pr.' + name +';\n' + finalDecl;
  }

  return finalDecl;
};

// We use it to pass the static global data inside module
// FIXME: name injectGlobal? 
// FIXME: give example here
const createStaticGlobal = (name, finalDecl, upValue) => {
  if (global[upValue][name] != undefined) {
    const nameToShow = upValue + '.' + name;
    globalProxy[nameToShow] = proxyWrap(handler, global[upValue][name]);
    // We save the declared wraped functions in new local
    finalDecl += nameToShow + ' = pr["' + nameToShow +'"];\n';
    // And we change the name to a better one
    finalDecl += 'Object.defineProperty(' + upValue + '.' +
      name + ',"name", {value:"' + nameToShow + '"});\n';
  }

  return finalDecl;
};

// // We use it to pass the static global data inside module
// const createPrototypeGlobal = (name, finalDecl, upValue) => {
//   if (global[upValue][name] != undefined) {
//     const finalName = upValue + name + 'prototype';
//     const passName = '.prototype.' + name;
//     const nameToShow = upValue + passName;
//     globalProxy[finalName] = proxyWrap(handler,
//         global[upValue]['prototype'][name]);
//     // We save the declared wraped functions in new local
//     finalDecl = finalDecl + upValue + passName + ' = pr.' + finalName +';\n';
//     // And we change the name to a better one
//     finalDecl = finalDecl + 'Object.defineProperty(' + upValue +
//       passName + ',"name", {value:"' + nameToShow + '"});\n';
//   }
//   return finalDecl;
// };

// We need to add all the global prototype variable declarations in the script
const createFinalDecl = () => {
  // This is for the static global Data --Math,JSON etc
  for (const upValue in jsonStaticData) {
    if (Object.prototype.hasOwnProperty.call(jsonStaticData, upValue)) {
      const globalVariables = jsonStaticData[upValue];
      finalDecl = 'let ' + upValue + ' = {};\n' + finalDecl;
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
          const name = globalVariables[declName];
          finalDecl = createStaticGlobal(name, finalDecl, upValue);
        }
      }
    }
  }

// This is for the static global Data --Math,JSON etc
// for (const upValue in jsonPrototypeData) {
//  if (Object.prototype.hasOwnProperty.call(jsonPrototypeData, upValue)) {
//    const globalVariables = jsonPrototypeData[upValue];
//    for (const declName in globalVariables) {
//      if (Object.prototype.hasOwnProperty.call(jsonPrototypeData, upValue)) {
//        const name = globalVariables[declName];
//        finalDecl = createPrototypeGlobal(name, finalDecl, upValue);
//       }
//     }
//   }
// }

  for (const upValue in jsonData) {
    if (Object.prototype.hasOwnProperty.call(jsonData, upValue)) {
      const globalVariables = jsonData[upValue];
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
          const name = globalVariables[declName];
          finalDecl = createGlobal(name, finalDecl);
        }
      }
    }
  }

  return finalDecl;
};

const globalsDecl = () => {
  if (finalDecl === ' ') {
    userRemoves();
    return createFinalDecl();
  } else {
    return finalDecl;
  }
};

// User can remove things from json file that create conf
const userRemoves = () => {
  const list = lyaConfig.removejson;
  if (list != undefined) {
    for (let i = 0; i < list.length; i++) {
      const value = list[i];
      for (const upValue in jsonData) {
        if (Object.prototype.hasOwnProperty.call(jsonData, upValue)) {
          if (upValue === value) {
            jsonData.remove(upValue);
          }
          const globalVariables = jsonData[upValue];
          for (const declName in globalVariables) {
            if (Object.prototype.hasOwnProperty.
                call(globalVariables, declName)) {
              const name = globalVariables[declName];
              if (name === value) {
                delete globalVariables[declName];
              }
            }
          }
        }
      }
    }
  }
};

// We do some stuff and then call original warp
Module.wrap = (script) => {
  script = globalsDecl() + script;
  let wrappedScript = originalWrap(script);
  wrappedScript = wrappedScript.replace('__dirname)', '__dirname, pr)');
  return wrappedScript;
};

// Returns the last location of a path
const getName = (wayFile) => {
  const splited = wayFile.split('/');
  return splited[splited.length - 1];
};

// We export the name of the curr module and pass proxy to the final function
vm.runInThisContext = function(code, options) {
  const codeToRun = originalRun(code, options);
  count++;
  trueName[count] = getName(options['filename']);
  variableCall[trueName[count]] = {};
  return new Proxy(codeToRun, handlerAddArg);
};

// We wrap the result in the wrapper function
Module.prototype.require = function(...args) {
  const path = args[0];
  let result = originalRequire.apply(this, args);
  if ( objName.has(result) === false ) {
    objName.set(result, 'require(\'' + path + '\')');
    objPath.set(result, trueName[count]);
    result = new Proxy(result, handlerObjExport);
    if (count !=0) count--;
  } else {
    result = new Proxy(result, handlerObjExport);
    objName.set(result, 'require(\'' + path + '\')');
    objPath.set(result, trueName[count]);
  }
  return result;
};

// We print all the results on the end of the program
process.on('exit', function() {
  if (lyaConfig.SAVE_RESULTS && userChoice != 5 ) {
    fs.writeFileSync(lyaConfig.SAVE_RESULTS,
        JSON.stringify(variableCall, null, 2), 'utf-8');
  }
});
