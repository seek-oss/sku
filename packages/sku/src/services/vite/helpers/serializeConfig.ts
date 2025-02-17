import serializeJavascript from 'serialize-javascript';
import clientContextKey from '@/utils/constants/clientContextKey.js';

export const serializeConfig = (config: object) =>
  `<script id="${clientContextKey}" type="application/json">${serializeJavascript(
    config,
    { isJSON: true },
  )}</script>`;
