const pathJoin = require('path').join;

/*
*
*/
const analysisPath = {
  ON_OFF: pathJoin(__dirname, './access/on-off.js'),
};

/*
*
*/
const conf = {
  analysis: analysisPath.ON_OFF,
};

/* Load the user chosen analysis
*
*  @analysis: The analysis name, like ON_OFF, CALL_TIMES, etc..
*/
const load = (analysisName) => {
  return require(analysisPath[analysisName])
}

module.exports = load;
