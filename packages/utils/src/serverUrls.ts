import { styleText } from 'node:util';

// const makeUrl = (
//   host: string,
//   opts: {
//     port?: number;
//     initialPath?: string;
//     https?: boolean;
//   } = {},
// ): string => {
//   console.log('opts.port', opts.port);
//   const hostWithPort = [host, opts.port].filter(Boolean).join(':');
//   const withPaths = [hostWithPort, opts.initialPath?.trim()]
//     .filter(Boolean)
//     .join('');

//   return `${opts.https ? 'https' : 'http'}://${withPaths}`;
// };

/**
 * Creates a styled URL for a given host, port, initial path, and HTTPS status.
 */
export const styledUrl =
  ({
    port,
    initialPath,
    https,
  }: {
    port?: number;
    initialPath?: string;
    https?: boolean;
  }) =>
  (host: string) => {
    const proto = https ? 'https' : 'http';
    const styledPort = port ? styleText('bold', String(port)) : undefined;
    return `${proto}://${[host, styledPort].filter(Boolean).join(':')}${initialPath !== '/' ? initialPath : ''}`;
  };

/**
 * Creates a server URLs object for a given list of hosts, port, initial path, and HTTPS status.
 */
export const serverUrls = (opts: {
  hosts: string[];
  port?: number;
  initialPath?: string;
  https?: boolean;
}) => {
  const { hosts, port, initialPath = '/', https } = opts;

  const makeUrl = styledUrl({ port, initialPath, https });

  return {
    print(count: number | 'all' = 1) {
      hosts.slice(0, count === 'all' ? undefined : count).forEach((site) => {
        const url = makeUrl(site);
        console.log(
          `${styleText('green', '➜')}  ${styleText('bold', 'Local')}: ${url}`,
        );
      });
    },
    first: () => makeUrl(hosts[0]),
  };
};
