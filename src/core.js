// Programatically monitor module-level interactions.

const fs = require('fs');
const state = require('./state.js');
const {analyze} = require('./analyze.js');

module.exports = {
  analyze,
  callWithLya,
  createLyaState: state.createLyaState,
  preset: require('./config.js').preset,
};


// /////////////////////////////////////////////////////////////////////////////
// Implementation

const {assert, assertDeepEqual, test} = require('./test.js');
const {identity} = require('./functions.js');
const {callWithOwnValues, elementOf} = require('./container-type.js');
const {callWithModuleOverride} = require('./module-override.js');
const {callWithVmOverride} = require('./vm-override.js');
const {maybeAddProxy, createProxyApplyHandler} = require('./proxy.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./constants.js');


// You can place any functions of the same signature as this one here.
// Each function mutates the global scope, or a module's exports,
// runs a callback, and then restores the original state.
//
// All such functions are centralized here so that users can avoid
// concurrent execution of code that would conflict with callWithLya.
const overrides = [
  callWithModuleOverride,
  callWithVmOverride,
];


function callWithLya(env, f) {
  const startAnalysis = () => {
    env.timerStart = process.hrtime();
    return f(createLyaRequireProxy(env));
  };

  const callbackResult = (
    overrides.reduce((cb, override) => () => override(env, cb),
                     startAnalysis)()
  );

  postprocess(env, callbackResult);

  return callbackResult;
}


// We start an analysis using the module resolver because we'll want
// relative paths, etc. to function as CommonJS expects.
function createLyaRequireProxy(env) {
  if (typeof env.config.require !== 'function') {
    throw new Error('env.config.require is not a function.');
  }

  const baseApply = createProxyApplyHandler(env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

  return maybeAddProxy(env, env.config.require, {
    apply: function () {
      state.setCurrentModule(env, require.main);
      env.metadata.set(env.config.require, { parent: require.main });
      return baseApply(...arguments);
    },
  });
}

const hrTimeToMs = (hrtime) => (hrtime[0] * 1e9) + hrtime[1] / 1e6;

function postprocess(env, callbackResult) {
  // Post-processing
  const {
    results,
    config: {
      print,
      reportTime,
      saveResults,
      verbosity,
      hooks: {
        onExit,
      },
    },
    log,
  } = env;

  const stringifiedResults = JSON.stringify(results, null, 2);

  onExit(env, {
    value: callbackResult,
    saveIfAble: () => {
      if (saveResults) {
        fs.writeFileSync(saveResults, stringifiedResults, 'utf-8');
      }
    },
    printIfAble: () => {
      if (print) {
        console.log(stringifiedResults);
      }
    },
    reportTimeIfAble: () => {
      if (reportTime) {
        env.timerEnd = process.hrtime(env.timerStart);
        console.log('Time %sms', hrTimeToMs(env.timerEnd));
      }
    },
  })
};
