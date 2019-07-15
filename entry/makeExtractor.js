import React from 'react';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

import defaultEntryPoint from '../context/defaultClientEntry';

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

  return {
    getHeadTags: ({ js, css } = { js: true, css: true }) => {
      const tags = [];

      if (css) {
        tags.push(extractor.getStyleTags());
      }

      if (js) {
        tags.push(
          extractor
            .getLinkTags(extraScriptTagAttributes)
            .split('\n')
            .filter(tag => tag.includes('as="script"'))
            .join('\n'),
        );
      }

      return tags.join('\n');
    },
    getBodyTags: () => extractor.getScriptTags(extraScriptTagAttributes),
    SkuProvider,
    extractor,
  };
};
