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

  let previouslyReturnedJsHeadTags = '';
  let previouslyReturnedCssHeadTags = '';

  const getJsHeadTags = () =>
    extractor
      .getLinkTags(extraScriptTagAttributes)
      .split('\n')
      .filter(tag => tag.includes('as="script"'))
      .join('\n');

  const getCssHeadTags = () => extractor.getStyleTags();

  return {
    getHeadTags: ({ excludeJs, excludeCss } = {}) => {
      const tags = [];

      if (!excludeCss) {
        tags.push(getCssHeadTags());
      }

      if (!excludeJs) {
        tags.push(getJsHeadTags());
      }
      return tags.join('\n');
    },
    flushHeadTags: ({ excludeJs, excludeCss } = {}) => {
      const tags = [];

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
    getBodyTags: () => extractor.getScriptTags(extraScriptTagAttributes),
    SkuProvider,
    extractor,
  };
};
