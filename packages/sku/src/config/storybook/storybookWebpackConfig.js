import { paths } from '../../context/index.js';
import { merge as webpackMerge } from 'webpack-merge';
import makeWebpackConfig from '../webpack/webpack.config.js';
import { resolvePackage } from '../webpack/utils/resolvePackage.js';

const hot = process.env.SKU_HOT !== 'false';

const EXAMPLE_CSS_FILE = 'example.css';
const EXAMPLE_MDX_FILE = 'example.mdx';

/**
 * @param {import("webpack").Configuration} config
 * @param {{isDevServer: boolean}}
 */
export default (config, { isDevServer }) => {
  const clientWebpackConfig = makeWebpackConfig({
    isIntegration: true,
    isDevServer,
    hot: isDevServer && hot,
  }).find(({ name }) => name === 'client');

  // Ensure Storybook's webpack loaders ignore our code :(
  if (config && config.module && Array.isArray(config.module.rules)) {
    config.module.rules.forEach((rule) => {
      const previousExclude = rule.exclude || [];
      rule.exclude = [
        ...(Array.isArray(previousExclude)
          ? previousExclude
          : [previousExclude]), // Ensure we don't clobber any existing exclusions
      ];

      if (rule.test instanceof RegExp) {
        // Only exclude sku app source code and compile packages if the rule is not for MDX files
        if (!rule.test.test(EXAMPLE_MDX_FILE)) {
          rule.exclude.push(
            ...paths.src,
            ...paths.compilePackages.map(resolvePackage),
          );
        }

        // Only exclude vanilla extract virtual CSS files if the rule is for CSS files
        if (rule.test.test(EXAMPLE_CSS_FILE)) {
          rule.exclude.push(
            /\.vanilla\.css$/, // Vanilla Extract virtual modules
            /\.css$/, // external CSS
          );
        }
      } else {
        // To be safe, exclude everything if the rule's test isn't a RegExp
        rule.exclude.push(
          ...paths.src,
          ...paths.compilePackages.map(resolvePackage),
          /\.vanilla\.css$/, // Vanilla Extract virtual modules
          /\.css$/, // external CSS
        );
      }
    });
  }

  return webpackMerge(config, {
    // We don't want to apply the entire webpack config,
    // mainly because it configures entries and outputs,
    // which would break the Storybook build.
    module: clientWebpackConfig.module,
    resolve: clientWebpackConfig.resolve,
    plugins: clientWebpackConfig.plugins,
    stats: 'errors-only',
  });
};
