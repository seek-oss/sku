import React from 'react';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

export default (stats, entrypoint, publicPath) => {
  const extractor = new ChunkExtractor({ stats, entrypoints: [entrypoint] });

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
