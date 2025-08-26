import { describe, it } from 'vitest';
import {
  validateProjectName,
  ProjectValidationError,
} from './projectValidation.js';

describe('validateProjectName', () => {
  it('should pass for valid project names', ({ expect }) => {
    expect(() => validateProjectName('my-awesome-project')).not.toThrow();
    expect(() => validateProjectName('valid-name')).not.toThrow();
    expect(() => validateProjectName('@scope/package-name')).not.toThrow();
  });

  it('should reject empty project name', ({ expect }) => {
    expect(() => validateProjectName('')).toThrow(ProjectValidationError);
    expect(() => validateProjectName('')).toThrow('Project name is required');
  });

  it('should reject reserved names', ({ expect }) => {
    expect(() => validateProjectName('react')).toThrow(ProjectValidationError);
    expect(() => validateProjectName('react')).toThrow(
      'cannot create a project called',
    );

    expect(() => validateProjectName('react-dom')).toThrow(
      ProjectValidationError,
    );
    expect(() => validateProjectName('sku')).toThrow(ProjectValidationError);
    expect(() => validateProjectName('braid-design-system')).toThrow(
      ProjectValidationError,
    );
  });

  it('should reject invalid npm package names', ({ expect }) => {
    expect(() => validateProjectName('INVALID-NAME')).toThrow(
      ProjectValidationError,
    );
    expect(() => validateProjectName('INVALID-NAME')).toThrow(
      'npm naming restrictions',
    );

    expect(() => validateProjectName('invalid name with spaces')).toThrow(
      ProjectValidationError,
    );
    expect(() => validateProjectName('invalid@name')).toThrow(
      ProjectValidationError,
    );
  });

  it('should work with nested paths', ({ expect }) => {
    // Should validate based on the basename, not the full path
    expect(() => validateProjectName('./my-project')).not.toThrow();
    expect(() => validateProjectName('/path/to/my-project')).not.toThrow();
    expect(() => validateProjectName('/path/to/react')).toThrow(
      'cannot create a project called',
    );
  });
});
