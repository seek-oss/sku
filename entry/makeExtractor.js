import React from 'react';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

import defaultEntryPoint from '../context/defaultClientEntry';

const getNewTags = ({ before, after }) => {
  const beforeArr = before.split('\n');

  const afterArr = after.split('\n');

  return afterArr.filter(tag => !beforeArr.includes(tag)).join('\n');
};

export default (stats, publicPath) => {
  const extractor = new ChunkExtractor({
    stats,
    entrypoints: [defaultEntryPoint],
  });

  const SkuProvider = ({ children }) => (
    <ChunkExtractorManager extractor={extractor}>
      {children}
    </ChunkExtractorManager>
  );

  const extraScriptTagAttributes = /^(https?:)?\/\//.test(publicPath)
    ? { crossorigin: 'anonymous' }
    : {};

  let previouslyReturnedJsHeadTags = null;
  let previouslyReturnedCssHeadTags = null;

  const getJsHeadTags = () =>
    extractor
      .getLinkTags(extraScriptTagAttributes)
      .split('\n')
      .filter(tag => tag.includes('as="script"'))
      .join('\n');

  const getCssHeadTags = () => extractor.getStyleTags();

  return {
    getPreRenderHeadTags: ({ excludeJs, excludeCss } = {}) => {
      const tags = [];

      if (!excludeCss && excludeCss) {
        const cssHeadTags = getCssHeadTags();
        previouslyReturnedCssHeadTags = cssHeadTags;
        tags.push(cssHeadTags);
      }

      if (!excludeJs && excludeJs) {
        const jsHeadTags = getJsHeadTags();
        previouslyReturnedJsHeadTags = jsHeadTags;
        tags.push(jsHeadTags);
      }
      return tags.join('\n');
    },
    getHeadTags: ({ excludeJs, excludeCss } = {}) => {
      const tags = [];

      if (!excludeCss) {
        const cssHeadTags = getCssHeadTags();
        tags.push(
          previouslyReturnedCssHeadTags !== null
            ? getNewTags({
                before: previouslyReturnedCssHeadTags,
                after: cssHeadTags,
              })
            : cssHeadTags,
        );
      }

      if (!excludeJs) {
        const jsHeadTags = getJsHeadTags();
        tags.push(
          previouslyReturnedJsHeadTags !== null
            ? getNewTags({
                before: previouslyReturnedJsHeadTags,
                after: jsHeadTags,
              })
            : jsHeadTags,
        );
      }
      return tags.join('\n');
    },
    getBodyTags: () => extractor.getScriptTags(extraScriptTagAttributes),
    SkuProvider,
    extractor,
  };
};
