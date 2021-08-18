import React from 'react';
import App from './App';

export default {
  title: 'App',
  component: App,
  argTypes: {
    text: {
      label: 'Text',
      type: { name: 'string', required: false },
      defaultValue: 'Storybook render',
    },
  },
};

export const Default = ({ text }) => <App>{text}</App>;
