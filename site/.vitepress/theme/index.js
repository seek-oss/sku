import DefaultTheme from 'vitepress/theme-without-fonts';
import CopyPrompt from './components/CopyPrompt.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CopyPrompt', CopyPrompt);
  },
};
