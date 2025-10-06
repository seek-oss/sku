import logo from './logo.png';

import * as styles from './styles.css';

const App = () => (
  <div className={styles.root}>
    <div className={styles.nested}>Hello World</div>
    <img src={logo} />
  </div>
);

export default App;
