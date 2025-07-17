import { expect } from 'vitest';
import appSnapshotSerializer from './appSnapshotSerializer.ts';
import 'cli-testing-library/vitest';

expect.addSnapshotSerializer(appSnapshotSerializer);
