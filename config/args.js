const scriptNameRegex = /scripts\/([\w-]*)\.js$/i;
const scriptName = process.argv[1].match(scriptNameRegex)[1];

module.exports = {
  script: scriptName,
  buildName: scriptName === 'start' ? process.argv[2] : null,
  profile: scriptName === 'build' ? 'production' : 'development'
};
