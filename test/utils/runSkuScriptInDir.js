const spawn = require('./gracefulSpawn');
const { exec } = require('child-process-promise');

const scriptsPath = `${__dirname}/../../scripts/`;

module.exports = async (script, cwd) => {
  // When starting a dev server, return a hook to the running process
  if (/^start/.test(script)) {
    return spawn('node', [`${scriptsPath}${script}`], { stdio: 'inherit', cwd });
  }
  
  // Otherwise, resolve the promise when the script finishes
  return await exec(`node ${scriptsPath}${script}`, { stdio: 'inherit', cwd });
};
