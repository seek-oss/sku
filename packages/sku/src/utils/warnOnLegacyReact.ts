import { requireFromCwd } from '@sku-private/utils';
import { banner, link, strong } from '@sku-private/utils/console';
import semver from 'semver';
import _debug from 'debug';

const MIN_REACT_VERSION = '19.0.0';

const debug = _debug('sku:warnOnLegacyReact');

export const warnOnLegacyReact = () => {
  try {
    const { version: reactVersion } = requireFromCwd('react/package.json');
    const coerced = semver.coerce(reactVersion);
    if (coerced && semver.lt(coerced, MIN_REACT_VERSION)) {
      banner('caution', 'React 18 or below detected', [
        `Your application is using ${strong(`react@${reactVersion}`)}. Sku now recommends using React 19.`,
        `Consider upgrading to React 19. See the ${link('https://react.dev/blog/2024/04/25/react-19-upgrade-guide')} for more information.`,
      ]);
    }
  } catch {
    debug('React not found, skipping warning');
  }
};
