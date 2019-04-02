import React from 'react';
import App from './App';
import { StaticRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

describe('multiple-routes', () => {
  it('should support loadable components', () => {
    const { container } = render(
      <StaticRouter location="/" context={{}}>
        <App site="AU" />
      </StaticRouter>,
    );

    expect(container.innerHTML).toMatchInlineSnapshot(`"Loading Home..."`);
  });
});
