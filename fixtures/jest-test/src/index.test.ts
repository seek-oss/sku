import { image } from './imageConsumer.ts';

describe('good tests (Jest)', () => {
  it('should be true', () => {
    expect(true).toBe(true);
  });

  it('should mock asset imports', () => {
    expect(image).toMatchInlineSnapshot('"MOCK_FILE"');
  });
});
