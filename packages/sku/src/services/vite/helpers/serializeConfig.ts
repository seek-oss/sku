import serializeJavascript from 'serialize-javascript';

export const serializeConfig = (config: object) =>
  `<script id="__SKU_CLIENT_CONTEXT__" type="application/json">${serializeJavascript(
    config,
    { isJSON: true },
  )}</script>`;
