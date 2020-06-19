import React from 'react';
import ReactDom from 'react-dom';

const App = () => <>HTTPS WORKS</>;

ReactDom.render(
  <App />,
  document.body.appendChild(document.createElement('div')),
);
