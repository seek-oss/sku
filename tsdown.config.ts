import { defineConfig } from 'tsdown';

export default defineConfig({
  workspace: {
    include: ['packages/*'],
    exclude: ['packages/pnpm-plugin'],
  },
});
