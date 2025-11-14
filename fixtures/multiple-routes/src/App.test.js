import { render } from '@testing-library/react';
import { StaticRouter } from 'react-router-dom';

import App from './App.jsx';

describe('multiple-routes', () => {
  it('should support loadable components', () => {
    const { container } = render(
      <StaticRouter location="/">
        <App site="au" />
      </StaticRouter>,
    );

    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<div>Loading Home...</div>"`,
    );
  });
});
