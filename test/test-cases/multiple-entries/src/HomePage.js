import React from 'react';
import { hydrate } from 'react-dom';
import Home from './handlers/Home';

hydrate(<Home site={window.APP_CONFIG.site} />, document.getElementById('app'));
