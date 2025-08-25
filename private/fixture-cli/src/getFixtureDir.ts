import { resolve } from 'node:path';

export const getFixtureDir = (fixture: string = '') =>
  resolve('../../fixtures', fixture);
