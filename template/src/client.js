import React from 'react';
import { hydrate } from 'react-dom';
import App from './App/App';

hydrate(<App />, document.getElementById('app'));
