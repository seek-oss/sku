import { useEffect } from 'react';

import logo from './logo.png';

import * as styles from './styles.css';

export const Root = ({
  headTags,
  bodyTags,
}: {
  headTags?: any;
  bodyTags?: any;
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {headTags}
    </head>

    <body>
      <App />
      {bodyTags}
    </body>
  </html>
);

const App = () => {
  useEffect(() => {
    console.log('Hello World');
  });
  return (
    <div className={styles.root}>
      <div className={styles.nested}>Hello World</div>
      <img src={logo} />
    </div>
  );
};

export default App;
