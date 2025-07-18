import waitOn from 'wait-on';
import { TEST_TIMEOUT } from '../../vitest.config.ts';

export const waitForUrls = async (...urls: string[]) => {
  const timeout = TEST_TIMEOUT;

  try {
    return await waitOn({
      resources: urls.map((url) => url.replace(/http(s?)\:/, 'http$1-get:')),
      headers: { accept: 'text/html, application/javascript' },
      timeout,
      // Log output of wait behaviour timing to allow
      // increased debugging when service fails to start
      log: false,
      strictSSL: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      throw new Error(`waitForUrls waited ${timeout}ms for ${urls.join(', ')}`);
    }

    throw error;
  }
};
