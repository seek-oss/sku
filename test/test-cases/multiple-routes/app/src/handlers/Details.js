/* eslint react/no-did-mount-set-state: off */
import styles from './Details.less';

import React from 'react';
import loadable from '../../../../../../@loadable/component';

const AsyncComponent = loadable(() => import('./AsyncComponent'));

export default class Details extends React.Component {
  constructor() {
    super();
    this.state = {
      id: null,
    };
  }

  componentDidMount() {
    this.setState({
      id: window.location.pathname.substr(
        window.location.pathname.lastIndexOf('/') + 1,
      ),
    });
  }

  render() {
    const { id } = this.state;
    const message = `Welcome to the Details page - ${this.props.site}`;

    return (
      <h1 className={styles.root}>
        {message}
        {id && `ID: ${id}`}
        <AsyncComponent />
      </h1>
    );
  }
}
