import React from 'react';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

import defaultEntryPoint from '../context/defaultClientEntry';

export default (stats, publicPath) => {
  const extractor = new ChunkExtractor({
    stats,
    entrypoints: [defaultEntryPoint]
  });

  const SkuProvider = ({ children }) => (
    <ChunkExtractorManager extractor={extractor}>
      {children}
    </ChunkExtractorManager>
  );

  const extraTagAttributes = /^(https?:)?\/\//.test(publicPath)
    ? { crossorigin: 'anonymous' }
    : {};

  return {
    getHeadTags: () => extractor.getStyleTags(extraTagAttributes),
    getBodyTags: () => extractor.getScriptTags(extraTagAttributes),
    SkuProvider
  };
};
