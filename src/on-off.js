let env;
const pattern = /require[(](.*)[)]/;
const fs = require('fs');

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
const updateAnalysisData = (storedCalls, truename) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = true;
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
  if (nameToStore !== 'global') {
    if (pattern.test(nameToStore)) {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.match(pattern)[0]);
    } else {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.split('.')[0]);
    }
    updateAnalysisData(env.analysisResult[currentModule],
        nameToStore);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
  if (parentName) {
    updateAnalysisData(env.analysisResult[currentModule], parentName);
  }
  updateAnalysisData(env.analysisResult[currentModule], nameToStore);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'module-locals') {
    updateAnalysisData(env.analysisResult[currentModule],
        'require');
    updateAnalysisData(env.analysisResult[currentModule],
        nameToStore);
  } else {
    if (typeClass === 'node-globals') {
      updateAnalysisData(env.analysisResult[declareModule],
          nameToStore.split('.')[0]);
    }
    updateAnalysisData(env.analysisResult[declareModule],
        nameToStore);
    if (pattern.test(nameToStore)) {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.match(pattern)[0]);
    }
  }
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  updateAnalysisData(env.analysisResult[currentName],
      nameToStore);
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  for (const name of intersection) {
    const currentName = candidateModule.get(name);
    updateAnalysisData(env.analysisResult[currentName],
        name, ['w']);
  }
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
  if (env.conf.print) {
    console.log(JSON.stringify(env.analysisResult, null, 2));
  }
};

module.exports = (e) => {
  env = e;
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onExit: onExit,
  };
};