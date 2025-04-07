import { expect } from 'vitest';
import appSnapshotSerializer from './appSnapshotSerializer.ts';

expect.addSnapshotSerializer(appSnapshotSerializer);
