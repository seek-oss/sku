/* eslint react/no-did-mount-set-state: off */
import styles from './Details.less';

import React from 'react';

export default class Details extends React.Component {
  constructor() {
    super();
    this.state = {
      id: null,
      asyncComponent: null
    };
  }

  componentDidMount() {
    this.setState({
      id: window.location.pathname.substr(
        window.location.pathname.lastIndexOf('/') + 1
      )
    });
    import('./AsyncComponent').then(asyncComponent => {
      this.setState({
        asyncComponent: asyncComponent.default
      });
    });
  }

  render() {
    const { asyncComponent: AsyncComponent, id } = this.state;

    return (
      <h1 className={styles.root}>
        Welcome to the Details page - {this.props.site}
        {id && `ID: ${id}`}
        {AsyncComponent ? <AsyncComponent /> : 'loading...'}
      </h1>
    );
  }
}
