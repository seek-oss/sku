import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

export type HostEntry = [ip: string, host: string];

export const getHostsFilePath = () =>
  process.platform === 'win32'
    ? path.win32.join(
        process.env.SystemRoot ?? 'C:\\Windows',
        'System32',
        'drivers',
        'etc',
        'hosts',
      )
    : '/etc/hosts';

export const parseHostsFile = (contents: string): HostEntry[] =>
  contents.split(/\r?\n/).flatMap((line) => {
    const [ip, ...hosts] = line.replace(/#.*/, '').trim().split(/\s+/);
    return hosts.map((host): HostEntry => [ip, host]);
  });

export const readSystemHosts = async (
  filePath = getHostsFilePath(),
): Promise<HostEntry[]> => parseHostsFile(await readFile(filePath, 'utf8'));

/**
 * Appends `ip host` to the hosts file unless that exact entry already exists.
 * Existing lines are never rewritten, so user formatting and comments are preserved.
 */
export const addSystemHost = async (
  ip: string,
  host: string,
  filePath = getHostsFilePath(),
): Promise<void> => {
  const contents = await readFile(filePath, 'utf8');

  const exists = parseHostsFile(contents).some(
    ([entryIp, entryHost]) => entryIp === ip && entryHost === host,
  );
  if (exists) {
    return;
  }

  const eol = contents.includes('\r\n') ? '\r\n' : '\n';
  const separator = contents === '' || contents.endsWith('\n') ? '' : eol;

  await appendFile(filePath, `${separator}${ip} ${host}${eol}`);
};
