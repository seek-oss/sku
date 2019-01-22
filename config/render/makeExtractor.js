import React from 'react';
import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';

export default webpackStats => {
  const stats = webpackStats
    .toJson()
    .children.find(({ name }) => name === 'client');

  const extractor = new ChunkExtractor({ stats });

  const SkuProvider = ({ children }) => (
    <ChunkExtractorManager extractor={extractor}>
      {children}
    </ChunkExtractorManager>
  );

  return {
    getStyleTags: () => extractor.getStyleTags(),
    getScriptTags: () => extractor.getScriptTags(),
    SkuProvider
  };
};
