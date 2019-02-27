const path = require('path');
const babel = require('@babel/core');
const babelConfig = require('../babel/babelConfig')({ target: 'node' });

const traversePath = require.resolve('traverse');
const getClassNamesPath = require.resolve('./getClassNames');

module.exports = {
  process: (src, srcPath) => {
    const fileName = path.parse(srcPath).name;
    const config = Object.assign({}, babelConfig, { filename: 'unknown' });

    // Ensure the code uses our provided Babel feature set
    const { code } = babel.transform(src, config);

    // Wrap the .css.js code in some custom logic
    // to extract the classes and generate a CSS Module
    const generatedCode = `
      const traverse = require(${JSON.stringify(traversePath)});
      const getClassNames = require(${JSON.stringify(getClassNamesPath)});

      // Provide a fake module environment to capture the exports
      const fakeModule = { exports: {} };
      const exported = ((module, exports) => {
        ${code}
        return exports;
      })(fakeModule, fakeModule.exports);

      // Extract classNames from all object keys
      const classNames = [];
      traverse(exported.default || exported).forEach(function() {
        classNames.push(...getClassNames(this.key));
      });

      // Create a CSS Module from the classNames
      const cssModule = {};
      classNames.forEach(className => {
        cssModule[className] = [${JSON.stringify(
          fileName.replace('.css', ''),
        )}, '__', className].join('');
      });

      module.exports = cssModule;
    `;

    return generatedCode;
  },
};
