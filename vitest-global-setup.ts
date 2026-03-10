// import { closeBrowser } from '@sku-private/playwright';
// import { configure } from '@sku-private/testing-library';

// export function setup() {
//   configure();
// }

export function teardown() {
  // Clean up global resources
  console.log('Global teardown complete');
  // closeBrowser();
}
