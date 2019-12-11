const { sortBy } = require('lodash');
const product = require('./product');

const testCases = [
  {
    input: { a: [1, 2], b: [1, 2] },
    output: [
      { a: 1, b: 1 },
      { a: 1, b: 2 },
      { a: 2, b: 1 },
      { a: 2, b: 2 },
    ],
  },
  {
    input: { a: [], b: [1, 2], c: [] },
    output: [{ b: 1 }, { b: 2 }],
  },
  {
    input: { a: [1], b: [1, 2] },
    output: [
      { a: 1, b: 1 },
      { a: 1, b: 2 },
    ],
  },
  {
    input: { a: [1], b: [1, 2], c: [1, 2, 3] },
    output: [
      { a: 1, b: 1, c: 1 },
      { a: 1, b: 2, c: 1 },
      { a: 1, b: 1, c: 2 },
      { a: 1, b: 2, c: 2 },
      { a: 1, b: 1, c: 3 },
      { a: 1, b: 2, c: 3 },
    ],
  },
];

describe('product', () => {
  testCases.forEach(({ input, output }, testNum) => {
    test(`product ${testNum + 1}`, () => {
      const result = sortBy(product(input), v => JSON.stringify(v));

      expect(result).toEqual(sortBy(output, v => JSON.stringify(v)));
    });
  });
});
