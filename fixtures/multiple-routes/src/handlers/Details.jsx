import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import loadable from 'sku/@loadable/component';

import * as styles from './Details.css.js';

const AsyncComponent = loadable(() => import('./AsyncComponent'), {
  resolveComponent: (module) => {
    console.log('resolveComponent', module);
    return module.AsyncComponent;
  },
});

export default function Details({ site }) {
  const { id } = useParams();
  const [detailsId, setDetailsId] = useState();
  const message = `Welcome to the Details page - ${site}`;

  useEffect(() => {
    if (id) {
      setDetailsId(id);
    }
  }, []);

  return (
    <h1 className={styles.root}>
      {message}
      {detailsId && `ID: ${detailsId}`}
      <AsyncComponent />
    </h1>
  );
}
