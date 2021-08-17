import styles from './Details.less';

import { useState, useEffect } from 'react';
import loadable from '../../../../../../@loadable/component';
import { useParams } from 'react-router-dom';

const AsyncComponent = loadable(() => import('./AsyncComponent'));

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
