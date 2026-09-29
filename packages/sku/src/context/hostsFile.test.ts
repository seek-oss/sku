import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addSystemHosts,
  parseHostsFile,
  readSystemHosts,
} from './hostsFile.js';

describe('parseHostsFile', () => {
  it('should ignore comments and blank lines', () => {
    expect(
      parseHostsFile(
        ['##', '# Host Database', '  # indented comment', '', '   '].join('\n'),
      ),
    ).toEqual([]);
  });

  it('should parse space and tab separated entries', () => {
    expect(
      parseHostsFile(
        ['127.0.0.1\tlocalhost', '::1             localhost'].join('\n'),
      ),
    ).toEqual([
      ['127.0.0.1', 'localhost'],
      ['::1', 'localhost'],
    ]);
  });

  it('should return an entry for each host on a line', () => {
    expect(parseHostsFile('127.0.0.1 a.test b.test')).toEqual([
      ['127.0.0.1', 'a.test'],
      ['127.0.0.1', 'b.test'],
    ]);
  });

  it('should strip inline comments', () => {
    expect(parseHostsFile('127.0.0.1 a.test # not.a.host')).toEqual([
      ['127.0.0.1', 'a.test'],
    ]);
  });

  it('should handle CRLF line endings', () => {
    expect(parseHostsFile('# comment\r\n127.0.0.1 a.test\r\n')).toEqual([
      ['127.0.0.1', 'a.test'],
    ]);
  });
});

describe('hosts file access', () => {
  let dir: string;
  let hostsFile: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'sku-hosts-'));
    hostsFile = path.join(dir, 'hosts');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('should read entries from the hosts file', async () => {
    await writeFile(hostsFile, '# comment\n127.0.0.1 a.test\n');

    expect(await readSystemHosts(hostsFile)).toEqual([['127.0.0.1', 'a.test']]);
  });

  it('should append missing entries without changing existing content', async () => {
    const original = [
      '##',
      '# Host Database',
      '##',
      '127.0.0.1\tlocalhost',
      '127.0.0.1 a.test # inline comment',
      '',
    ].join('\n');
    await writeFile(hostsFile, original);

    await addSystemHosts(
      [
        ['127.0.0.1', 'new.test'],
        ['::1', 'new.test'],
      ],
      hostsFile,
    );

    expect(await readFile(hostsFile, 'utf8')).toMatchInlineSnapshot(`
      "##
      # Host Database
      ##
      127.0.0.1	localhost
      127.0.0.1 a.test # inline comment
      127.0.0.1 new.test
      ::1 new.test
      "
    `);
  });

  it('should not append an entry that already exists', async () => {
    const original = '127.0.0.1\ta.test b.test\n';
    await writeFile(hostsFile, original);

    const added = await addSystemHosts([['127.0.0.1', 'b.test']], hostsFile);

    expect(added).toEqual([]);
    expect(await readFile(hostsFile, 'utf8')).toBe(original);
  });

  it('should only append the entries that are missing', async () => {
    await writeFile(hostsFile, '127.0.0.1 a.test\n');

    const added = await addSystemHosts(
      [
        ['127.0.0.1', 'a.test'],
        ['127.0.0.1', 'b.test'],
      ],
      hostsFile,
    );

    expect(added).toEqual(['127.0.0.1 b.test']);
    expect(await readFile(hostsFile, 'utf8')).toBe(
      '127.0.0.1 a.test\n127.0.0.1 b.test\n',
    );
  });

  it('should append a duplicated entry once', async () => {
    await writeFile(hostsFile, '');

    const added = await addSystemHosts(
      [
        ['127.0.0.1', 'a.test'],
        ['127.0.0.1', 'a.test'],
      ],
      hostsFile,
    );

    expect(added).toEqual(['127.0.0.1 a.test']);
    expect(await readFile(hostsFile, 'utf8')).toBe('127.0.0.1 a.test\n');
  });

  it('should append when the host is only mapped to a different ip', async () => {
    await writeFile(hostsFile, '127.0.0.1 a.test\n');

    await addSystemHosts([['::1', 'a.test']], hostsFile);

    expect(await readFile(hostsFile, 'utf8')).toBe(
      '127.0.0.1 a.test\n::1 a.test\n',
    );
  });

  it('should add a line break when the file does not end with one', async () => {
    await writeFile(hostsFile, '127.0.0.1 localhost');

    await addSystemHosts([['127.0.0.1', 'a.test']], hostsFile);

    expect(await readFile(hostsFile, 'utf8')).toBe(
      '127.0.0.1 localhost\n127.0.0.1 a.test\n',
    );
  });

  it('should match CRLF line endings', async () => {
    await writeFile(hostsFile, '127.0.0.1 localhost\r\n');

    await addSystemHosts(
      [
        ['127.0.0.1', 'a.test'],
        ['::1', 'a.test'],
      ],
      hostsFile,
    );

    expect(await readFile(hostsFile, 'utf8')).toBe(
      '127.0.0.1 localhost\r\n127.0.0.1 a.test\r\n::1 a.test\r\n',
    );
  });
});
