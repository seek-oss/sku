import { seekAnz } from 'braid-design-system/lib/themes';
import { Box } from 'braid-design-system';

describe('braid-design-system', () => {
  test('atoms', () => {
    expect(seekAnz.atoms.paddingTop.large).toEqual('atoms__paddingTop_large');
  });

  test('components', () => {
    expect(typeof Box).toEqual('function');
  });
});
