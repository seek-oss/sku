import { describe, it } from 'vitest';
import { createFixture } from 'fs-fixture';
import { stat } from 'node:fs/promises';

import { copyDirContents } from './copyDirContents.js';

describe('copyDirContents', () => {
  it('copies files and nested directories when dest does not exist', async ({
    expect,
  }) => {
    await using fixture = await createFixture({
      'public/favicon.ico': 'favicon',
      'public/assets/logo.png': 'logo',
      'public/nested/deep/file.txt': 'deep file',
    });

    const srcPath = fixture.getPath('public');
    const destPath = fixture.getPath('target');

    await copyDirContents(srcPath, destPath);

    expect(await fixture.readFile('target/favicon.ico', 'utf8')).toBe(
      'favicon',
    );
    expect(await fixture.readFile('target/assets/logo.png', 'utf8')).toBe(
      'logo',
    );
    expect(await fixture.readFile('target/nested/deep/file.txt', 'utf8')).toBe(
      'deep file',
    );

    const destStat = await stat(destPath);
    expect(destStat.isDirectory()).toBe(true);
  });

  it('merges contents when dest exists as a directory', async ({ expect }) => {
    await using fixture = await createFixture({
      'public/favicon.ico': 'new favicon',
      'public/new-file.txt': 'new file',
      'target/existing.txt': 'existing file',
    });

    const srcPath = fixture.getPath('public');
    const destPath = fixture.getPath('target');

    await copyDirContents(srcPath, destPath);

    expect(await fixture.readFile('target/favicon.ico', 'utf8')).toBe(
      'new favicon',
    );
    expect(await fixture.readFile('target/new-file.txt', 'utf8')).toBe(
      'new file',
    );
    expect(await fixture.readFile('target/existing.txt', 'utf8')).toBe(
      'existing file',
    );
  });

  it('overwrites existing files in dest', async ({ expect }) => {
    await using fixture = await createFixture({
      'public/favicon.ico': 'updated favicon',
      'target/favicon.ico': 'old favicon',
    });

    const srcPath = fixture.getPath('public');
    const destPath = fixture.getPath('target');

    await copyDirContents(srcPath, destPath);

    expect(await fixture.readFile('target/favicon.ico', 'utf8')).toBe(
      'updated favicon',
    );
  });

  it('throws when source is not a directory', async ({ expect }) => {
    await using fixture = await createFixture({
      'not-a-dir.txt': 'file contents',
    });

    const srcPath = fixture.getPath('not-a-dir.txt');
    const destPath = fixture.getPath('target');

    await expect(copyDirContents(srcPath, destPath)).rejects.toThrow(
      `Source ${srcPath} is not a directory`,
    );
  });

  it('throws when dest exists as a file', async ({ expect }) => {
    await using fixture = await createFixture({
      'public/favicon.ico': 'favicon',
      target: 'not a directory',
    });

    const srcPath = fixture.getPath('public');
    const destPath = fixture.getPath('target');

    await expect(copyDirContents(srcPath, destPath)).rejects.toThrow(
      `Destination ${destPath} is not a directory`,
    );
  });
});
