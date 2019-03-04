import React from 'react';
import App from './App';

// Typically would be importing from 'sku/@storybook/...'
import { storiesOf } from '../../../../../@storybook/react';
import { text } from '../../../../../@storybook/addon-knobs';

storiesOf('App', module).add('Default', () => (
  <App>{text('Text', 'Storybook render')}</App>
));
