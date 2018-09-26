import React from 'react';
import { hydrate } from 'react-dom';
import App from '../another-folder/App';

hydrate(<App />, document.getElementById('app'));
