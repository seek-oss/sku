import App from './App';

// Typically would be importing from 'sku/@storybook/...'
import { storiesOf } from '../../../../../@storybook/react';

storiesOf('App', module).add('Default', () => <App />);
