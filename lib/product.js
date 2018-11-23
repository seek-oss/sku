const { pick, flatMap } = require('lodash');

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
      [targetKey]: targetItem
    }))
  );

  return product(pick(obj, remainingKeys), newAcc);
};

module.exports = product;
