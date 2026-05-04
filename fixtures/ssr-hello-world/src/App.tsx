import { loadable } from '@sku-lib/vite/loadable';

import logo from './logo.png';

import * as styles from './styles.css';

const LazyComponent = loadable(() => import('./Lazy'), {
  resolveComponent: (module) => module.LazyComponent,
});

const App = () => (
  <div className={styles.root}>
    <div className={styles.nested}>Hello World</div>
    <img src={logo} />
    <LazyComponent />
  </div>
);

export default App;
