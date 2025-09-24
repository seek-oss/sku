describe('good tests (Jest)', () => {
  it('should be true', () => {
    expect(true).toBe(true);
  });

  it('should return a file mock', async () => {
    const { default: fileMock } = await import('./image.gif');

    expect(fileMock).toMatchInlineSnapshot('"MOCK_FILE"');
  });
});
