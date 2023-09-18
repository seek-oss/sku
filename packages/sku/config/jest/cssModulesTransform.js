const path = require('node:path');
const getClassNames = require('./getClassNames');

module.exports = {
  process: (src, srcPath) => {
    const fileName = path.parse(srcPath).name;
    const classNames = getClassNames(src);

    const cssModule = {};
    classNames.forEach((className) => {
      cssModule[className] = `${fileName}__${className}`;
    });

    return { code: `module.exports = ${JSON.stringify(cssModule)}` };
  },
};
