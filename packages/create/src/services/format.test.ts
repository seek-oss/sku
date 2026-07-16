import { EventEmitter } from 'node:events';
import { describe, it, vi, beforeEach } from 'vitest';
import { spawn } from 'node:child_process';
import { formatProject } from './format.js';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('@sku-private/utils', () => ({
  getRunCommand: vi.fn(() => 'pnpm format'),
}));

describe('formatProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SKU_CREATE_STRICT;
  });

  it('warns and continues when format fails and strict is unset', async ({
    expect,
  }) => {
    const child = new EventEmitter();
    vi.mocked(spawn).mockReturnValue(child as never);

    const promise = formatProject('/tmp/project');
    child.emit('close', 2);
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects when format fails and strict is set', async ({ expect }) => {
    process.env.SKU_CREATE_STRICT = '1';
    const child = new EventEmitter();
    vi.mocked(spawn).mockReturnValue(child as never);

    const promise = formatProject('/tmp/project');
    child.emit('close', 2);
    await expect(promise).rejects.toThrow('format failed with exit code 2');
  });

  it('rejects on spawn error when strict is set', async ({ expect }) => {
    process.env.SKU_CREATE_STRICT = '1';
    const child = new EventEmitter();
    vi.mocked(spawn).mockReturnValue(child as never);

    const promise = formatProject('/tmp/project');
    child.emit('error', new Error('spawn ENOENT'));
    await expect(promise).rejects.toThrow('spawn ENOENT');
  });
});
