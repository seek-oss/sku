const renderScriptTag = require('./renderScriptTag');

describe('renderScriptTag', () => {
  test('regular', () => {
    const scriptTag = renderScriptTag('/static/some-app/main.js');

    expect(scriptTag).toBe(
      '<script type="text/javascript" src="/static/some-app/main.js"></script>',
    );
  });

  test('crossorigin', () => {
    const scriptTag = renderScriptTag(
      'https://www.seekcdn.com.au/static/some-app/main.js',
    );

    expect(scriptTag).toBe(
      '<script type="text/javascript" src="https://www.seekcdn.com.au/static/some-app/main.js" crossorigin="anonymous"></script>',
    );
  });

  test('protocol relative', () => {
    const scriptTag = renderScriptTag(
      '//www.seekcdn.com.au/static/some-app/main.js',
    );

    expect(scriptTag).toBe(
      '<script type="text/javascript" src="//www.seekcdn.com.au/static/some-app/main.js" crossorigin="anonymous"></script>',
    );
  });
});
