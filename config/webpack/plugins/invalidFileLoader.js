const dedent = require('dedent');

module.exports = function () {};

module.exports.pitch = function () {
  const errorMessage = dedent`
    Invalid file type: ${this.resource}
    
    *.css.js files are no longer supported. 
    
    See the sku 10 migration guide for details or contact #sku-support.
  `;

  throw new Error(errorMessage);
};
