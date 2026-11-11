import { appendFile, readFile } from 'node:fs/promises';

const hostsFile =
  process.platform === 'win32'
    ? 'C:/Windows/System32/drivers/etc/hosts'
    : '/etc/hosts';

const hosts = ['au.seek.com.localhost', 'jobstreet.com.localhost'];

const contents = await readFile(hostsFile, 'utf8');

const existingEntries = new Set(
  contents.split(/\r?\n/).flatMap((line) => {
    const [ip, ...names] = line.replace(/#.*/, '').trim().split(/\s+/);
    return names.map((name) => `${ip} ${name}`);
  }),
);

const missingEntries = hosts
  .flatMap((host) => [`127.0.0.1 ${host}`, `::1 ${host}`])
  .filter((entry) => !existingEntries.has(entry));

if (missingEntries.length > 0) {
  const eol = contents.includes('\r\n') ? '\r\n' : '\n';
  const separator = contents === '' || contents.endsWith('\n') ? '' : eol;

  await appendFile(hostsFile, `${separator}${missingEntries.join(eol)}${eol}`);
}
