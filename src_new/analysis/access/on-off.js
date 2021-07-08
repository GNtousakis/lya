// let env;
// const fs = require('fs');

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
const updateAnalysisData = (storedCalls, truename) => {
};

// onRead <~ is called before every object is read
const onRead = (info) => {
};

// onWrite <~ is called before every write of an object
const onWrite = (info) => {
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (info) => {
};

// onConstruct <~ Is call before every construct
const onConstruct = (info) => {
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
};

module.exports = (e) => {
  // env = e;
  return {
    // onRead: onRead,
    // onCallPre: onCallPre,
    // onWrite: onWrite,
    // onConstruct: onConstruct,
    // onExit: onExit,
  };
};
