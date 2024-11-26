import camelCase from 'lodash/camelCase.js';

const camelCaseHelper = (plop) => {
  plop.setHelper('camelCase', (text) => {
    return camelCase(text);
  })
}

export default camelCaseHelper;
