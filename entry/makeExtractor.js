import React from 'react';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

export default (stats, entrypoint) => {
  const extractor = new ChunkExtractor({ stats, entrypoints: [entrypoint] });

  const SkuProvider = ({ children }) => (
    <ChunkExtractorManager extractor={extractor}>
      {children}
    </ChunkExtractorManager>
  );

  return {
    getHeadTags: () =>
      [extractor.getLinkTags(), extractor.getStyleTags()].join('\n'),
    getBodyTags: () => extractor.getScriptTags(),
    SkuProvider
  };
};
