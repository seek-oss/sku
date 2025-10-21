import { styleText } from 'node:util';

export const printUrls = (
  hosts: Array<string | undefined>,
  opts: { https: boolean; initialPath: string; port: number },
) => {
  const proto = opts.https ? 'https' : 'http';
  console.log('Starting development server...');
  hosts.forEach((site) => {
    const initialPath = opts.initialPath !== '/' ? opts.initialPath : '';
    const url = styleText(
      'cyan',
      `${proto}://${site}:${styleText('bold', String(opts.port))}${initialPath}`,
    );
    console.log(
      `${styleText('green', '➜')}  ${styleText('bold', 'Local')}: ${url}`,
    );
  });
};
