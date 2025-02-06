import { camelCase } from 'change-case';

const camelCaseHelper = (plop) => {
  plop.setHelper('camelCase', (text) => {
    return camelCase(text);
  });
};

export default camelCaseHelper;
