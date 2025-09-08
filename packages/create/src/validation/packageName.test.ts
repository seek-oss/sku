import { describe, it } from 'vitest';
import { validatePackageName } from './packageName.js';

const npmNameRestrictionError = /npm naming restrictions/;
const dependencyExistsError = /NPM package with the same name already exists/;

describe('validatePackageName', () => {
  it('should accept valid package names', ({ expect }) => {
    expect(() => validatePackageName('my-app')).not.toThrow();
    expect(() => validatePackageName('my_app')).not.toThrow();
    expect(() => validatePackageName('myapp123')).not.toThrow();
    expect(() => validatePackageName('@scope/my-app')).not.toThrow();
  });

  it('should reject invalid package names', ({ expect }) => {
    expect(() => validatePackageName('My-App')).toThrow(
      npmNameRestrictionError,
    );
    expect(() => validatePackageName('my app')).toThrow(
      npmNameRestrictionError,
    );
    expect(() => validatePackageName('')).toThrow(npmNameRestrictionError);
    expect(() => validatePackageName('app!')).toThrow(npmNameRestrictionError);
  });

  it('should reject reserved names', ({ expect }) => {
    expect(() => validatePackageName('react')).toThrow(dependencyExistsError);
    expect(() => validatePackageName('react-dom')).toThrow(
      dependencyExistsError,
    );
    expect(() => validatePackageName('sku')).toThrow(dependencyExistsError);
    expect(() => validatePackageName('braid-design-system')).toThrow(
      dependencyExistsError,
    );
  });
});
