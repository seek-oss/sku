import * as styles from './styles.css.js';
import logo from './logo.png';

const App = () => (
  <div className={styles.root}>
    <div className={styles.nested}>Hello World</div>
    <img src={logo} />
  </div>
);

export default App;
