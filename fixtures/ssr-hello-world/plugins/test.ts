import { definePlugin } from 'nitro';

export default definePlugin((nitroApp) => {
  console.log('Nitro plugin', nitroApp);
});
