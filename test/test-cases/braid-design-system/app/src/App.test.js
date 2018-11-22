import { seekAnz } from 'braid-design-system/lib/themes';
import { Box } from 'braid-design-system';

describe('braid-design-system', () => {
  test('atoms', () => {
    expect(seekAnz.atoms.paddingTop.large).toEqual('paddingTop__large');
  });

  test('components', () => {
    expect(typeof Box).toEqual('function');
  });
});
