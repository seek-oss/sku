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
    getHeadTags: () => {
      const scriptPreloads = extractor
        .getLinkTags(extraScriptTagAttributes)
        .split('\n')
        .filter(tag => tag.includes('as="script"'))
        .join('\n');

      const styleTags = extractor.getStyleTags();

      return [styleTags, scriptPreloads].join('\n');
    },
    getBodyTags: () => extractor.getScriptTags(extraScriptTagAttributes),
    SkuProvider,
  };
};
