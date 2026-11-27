import { afterEach, describe, expect, it, vi } from 'vitest';

import { bindProbeDrainSignals } from './createProbeMiddleware.js';

describe('bindProbeDrainSignals', () => {
  const unbinders: Array<() => void> = [];

  afterEach(() => {
    for (const unbind of unbinders.splice(0)) {
      unbind();
    }
  });

  it('re-raises SIGINT when it is the only listener', () => {
    const markDraining = vi.fn();
    const kill = vi
      .spyOn(process, 'kill')
      .mockImplementation(() => true as never);
    unbinders.push(bindProbeDrainSignals(markDraining));

    process.emit('SIGINT');

    expect(markDraining).toHaveBeenCalledTimes(1);
    expect(kill).toHaveBeenCalledWith(process.pid, 'SIGINT');
    expect(process.listenerCount('SIGINT')).toBe(0);
    kill.mockRestore();
  });

  it('leaves an existing SIGTERM listener to exit the process', () => {
    const markDraining = vi.fn();
    const other = vi.fn();
    process.on('SIGTERM', other);
    const kill = vi
      .spyOn(process, 'kill')
      .mockImplementation(() => true as never);
    unbinders.push(() => {
      process.removeListener('SIGTERM', other);
    });
    unbinders.push(bindProbeDrainSignals(markDraining));

    process.emit('SIGTERM');

    expect(markDraining).toHaveBeenCalledTimes(1);
    expect(other).toHaveBeenCalledTimes(1);
    expect(kill).not.toHaveBeenCalled();
    expect(process.listenerCount('SIGTERM')).toBe(2);
    kill.mockRestore();
  });
});
