import { defineConfig } from 'tsdown';

export default defineConfig({
  workspace: {
    include: ['packages/*'],
  },
  deps: {
    // @sku-private/utils gets bundled into sku, as well as its dependencies (it's a private package).
    // tsdown raises a notice about this. Rather than listing all the deps we'll just disable the warning.
    onlyBundle: false,
  },
});
