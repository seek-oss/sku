import { ChunkExtractor, ChunkExtractorManager } from '@loadable/server';
import type { RenderCallbackParams } from '../../sku-types.d.ts';
import defaultEntryPoint from '../context/defaultClientEntry.js';

const getNewTags = ({ before, after }: { before: string; after: string }) => {
  const beforeArr = before.split('\n');

  const afterArr = after.split('\n');

  return afterArr.filter((tag: string) => !beforeArr.includes(tag)).join('\n');
};

export default (stats: object, publicPath: string, csp?: CSPHandler) => {
  const extractor = new ChunkExtractor({
    stats,
    entrypoints: [defaultEntryPoint],
  });

  const SkuProvider: RenderCallbackParams['SkuProvider'] = ({ children }) => (
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

  const extractorContext: Pick<
    RenderCallbackParams,
    | 'getHeadTags'
    | 'flushHeadTags'
    | 'getBodyTags'
    | 'SkuProvider'
    | 'extractor'
  > = {
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
    getBodyTags: () => extractor.getScriptTags(extraScriptTagAttributes),
    SkuProvider,
    extractor,
  };
  return extractorContext;
};
