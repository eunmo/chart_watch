var util = require('util');
var exec = util.promisify(require('child_process').exec);

module.exports = {
  simple: async function(execStr) {
    await exec(execStr);
  },
  toJSON: async function(execStr) {
    const { stdout, stderr } = await exec(execStr);
    return JSON.parse(stdout);
  }
};
