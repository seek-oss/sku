export const hasErrorCode = (e: unknown): e is { code: string } =>
  typeof e === 'object' &&
  e !== null &&
  'code' in e &&
  typeof e.code === 'string';

export const hasErrorMessage = (e: unknown): e is { message: string } =>
  typeof e === 'object' &&
  e !== null &&
  'message' in e &&
  typeof e.message === 'string';
