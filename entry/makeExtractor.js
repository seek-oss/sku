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

  const extraScriptAttributes = /^(https?:)?\/\//.test(publicPath)
    ? { crossorigin: 'anonymous' }
    : {};

  return {
    getHeadTags: () =>
      [
        extractor.getLinkTags(extraScriptAttributes),
        extractor.getStyleTags()
      ].join('\n'),
    getBodyTags: () => extractor.getScriptTags(extraScriptAttributes),
    SkuProvider
  };
};
