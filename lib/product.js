const { pick, flatMap } = require('lodash');

// Create an array of objects featuring every possible combination
// values passed in. This is used to ensure each configured route,
// environment & site is catered for in the build output
const product = (obj, acc = []) => {
  const [targetKey, ...remainingKeys] = Object.keys(obj);

  if (typeof targetKey === 'undefined') {
    return acc;
  }

  const targetList = obj[targetKey];

  if (targetList.length === 0) {
    return product(pick(obj, remainingKeys), acc);
  }

  if (acc.length === 0) {
    const newAcc = targetList.map(item => ({ [targetKey]: item }));

    return product(pick(obj, remainingKeys), newAcc);
  }

  const newAcc = flatMap(targetList, targetItem =>
    acc.map(item => ({
      ...item,
      [targetKey]: targetItem,
    })),
  );

  return product(pick(obj, remainingKeys), newAcc);
};

module.exports = product;
