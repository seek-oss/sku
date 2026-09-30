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

const toLine = ([ip, host]: HostEntry) => `${ip} ${host}`;

/**
 * Appends each entry that the hosts file does not already contain, and returns the appended lines.
 * Existing lines are never rewritten, so user formatting and comments stay intact.
 */
export const addSystemHosts = async (
  entries: HostEntry[],
  filePath = getHostsFilePath(),
): Promise<string[]> => {
  const contents = await readFile(filePath, 'utf8');

  const existingLines = new Set(parseHostsFile(contents).map(toLine));
  const missingLines = [...new Set(entries.map(toLine))].filter(
    (line) => !existingLines.has(line),
  );
  if (missingLines.length === 0) {
    return [];
  }

  const eol = contents.includes('\r\n') ? '\r\n' : '\n';
  const separator = contents === '' || contents.endsWith('\n') ? '' : eol;

  await appendFile(filePath, `${separator}${missingLines.join(eol)}${eol}`);

  return missingLines;
};
