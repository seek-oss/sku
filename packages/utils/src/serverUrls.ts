import { styleText } from 'node:util';

export const makeUrl = ({
  host,
  port,
  initialPath = '',
  https,
}: {
  host: string;
  port?: number | string;
  initialPath?: string;
  https?: boolean;
}) => {
  const proto = https ? 'https' : 'http';
  return `${proto}://${[host, port].filter(Boolean).join(':')}${initialPath !== '/' ? initialPath : ''}`;
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

  /**
   * Prints the first N urls to the console. If no count is provided, it prints all urls.
   */
  const print = (count?: number) => {
    const slicedHosts =
      typeof count === 'number' ? hosts.slice(0, count) : hosts;
    slicedHosts.forEach((host) => {
      const url = makeUrl({
        host,
        port: port ? styleText('bold', String(port)) : undefined,
        initialPath,
        https,
      });
      console.log(
        `${styleText('green', '➜')}  ${styleText('bold', 'Local')}: ${url}`,
      );
    });
  };

  return {
    print: (count: number = 1) => print(count),
    printAll: () => print(), // forcing no params to be passed
    first: () => makeUrl({ host: hosts[0], port, initialPath, https }),
  };
};
