import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { loadable } from 'sku/@vite-preload';

import * as styles from './Details.css.js';

const slowImport = (promise) => () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(promise()), 1000);
  });

export const AsyncComponent = loadable(
  slowImport(() => import('./AsyncComponent')),
);

export default function Details({ site }) {
  const { id } = useParams();
  const [detailsId, setDetailsId] = useState();
  const message = `Welcome to the Details page - ${site}`;

  useEffect(() => {
    if (id) {
      setDetailsId(id);
    }
  }, [id]);

  return (
    <h1 className={styles.root}>
      {message}
      {detailsId && `ID: ${detailsId}`}
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    </h1>
  );
}
