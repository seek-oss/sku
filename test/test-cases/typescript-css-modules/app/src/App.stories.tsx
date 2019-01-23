import React from 'react';
import App from './App';

// Typically would be importing from 'sku/storybook'
import { storiesOf } from '../../../../../storybook';

storiesOf('App', module).add('Default', () => <App />);
