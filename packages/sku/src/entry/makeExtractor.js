import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

import defaultEntryPoint from '../context/defaultClientEntry.js';

const getNewTags = ({ before, after }) => {
  const beforeArr = before.split('\n');

  const afterArr = after.split('\n');

  return afterArr.filter((tag) => !beforeArr.includes(tag)).join('\n');
};

/** @typedef {import("../../sku-types.d.ts").RenderCallbackParams} RenderCallbackParams */

export default (stats, publicPath, csp) => {
  const extractor = new ChunkExtractor({
    stats,
    entrypoints: [defaultEntryPoint],
  });

  /** @type {RenderCallbackParams['SkuProvider']} */
  const SkuProvider = ({ children }) => (
    <ChunkExtractorManager extractor={extractor}>
      {children}
    </ChunkExtractorManager>
  );

  const extraScriptTagAttributes = /^(https?:)?\/\//.test(publicPath)
    ? { crossorigin: 'anonymous' }
    : {};

  let previouslyReturnedJsHeadTags = '';
  let previouslyReturnedCssHeadTags = '';
  let hasReturnedCSPTag = false;

  const getJsHeadTags = () =>
    extractor
      .getLinkTags(extraScriptTagAttributes)
      .split('\n')
      .filter((tag) => tag.includes('as="script"'))
      .join('\n');

  const getCssHeadTags = () => extractor.getStyleTags();

  return {
    /** @type RenderCallbackParams['getHeadTags'] */
    getHeadTags: ({ excludeJs, excludeCss } = {}) => {
      const tags = [];

      if (csp) {
        tags.push(csp.createCSPTag());
      }

      if (!excludeCss) {
        tags.push(getCssHeadTags());
      }

      if (!excludeJs) {
        tags.push(getJsHeadTags());
      }
      return tags.join('\n');
    },
    /** @type RenderCallbackParams['flushHeadTags'] */
    flushHeadTags: ({ excludeJs, excludeCss } = {}) => {
      const tags = [];

      if (csp && !hasReturnedCSPTag) {
        tags.push(csp.createCSPTag());

        hasReturnedCSPTag = true;
      }

      if (!excludeCss) {
        const cssHeadTags = getCssHeadTags();
        tags.push(
          previouslyReturnedCssHeadTags
            ? getNewTags({
                before: previouslyReturnedCssHeadTags,
                after: cssHeadTags,
              })
            : cssHeadTags,
        );
        previouslyReturnedCssHeadTags += cssHeadTags;
      }

      if (!excludeJs) {
        const jsHeadTags = getJsHeadTags();
        tags.push(
          previouslyReturnedJsHeadTags
            ? getNewTags({
                before: previouslyReturnedJsHeadTags,
                after: jsHeadTags,
              })
            : jsHeadTags,
        );
        previouslyReturnedJsHeadTags += jsHeadTags;
      }
      return tags.join('\n');
    },
    /** @type RenderCallbackParams['getBodyTags'] */
    getBodyTags: () => extractor.getScriptTags(extraScriptTagAttributes),
    SkuProvider,
    extractor,
  };
};
