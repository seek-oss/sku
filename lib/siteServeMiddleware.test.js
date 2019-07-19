const path = require('path');
const { fs, vol } = require('memfs');
const siteServeMiddleware = require('./siteServeMiddleware');

const rootDirectory = 'dist';
const transformOutputPath = ({ site = '', route }) => path.join(site, route);

const mockResponse = {
  send: jest.fn(),
};

const mockNext = jest.fn();

describe('siteServeMiddleware', () => {
  let middleware;

  beforeEach(() => {
    mockResponse.send.mockClear();
    mockNext.mockClear();
  });

  describe('when sites are configured', () => {
    beforeAll(() => {
      vol.fromJSON(
        {
          './seekAnz/index.html': 'seekAnz/home',
          './seekAnz/details/:id/index.html': 'seekAnz/details/:id',
          './seekAnz/serp/:id/info/index.html': 'seekAnz/serp/:id/info',
          './jobStreet/index.html': 'jobStreet/home',
          './jobStreet/details/:id/index.html': 'jobStreet/details/:id',
          './jobStreet/serp/:id/info/index.html': 'jobStreet/serp/:id/info',
        },
        rootDirectory,
      );

      middleware = siteServeMiddleware({
        fs,
        rootDirectory,
        transformOutputPath,
        routes: [
          { route: '/' },
          { route: '/details/:id' },
          { route: '/serp/:id/info' },
        ],
        sites: [
          { name: 'seekAnz', host: 'dev.seek.com.au' },
          { name: 'jobStreet', host: 'dev.jobstreet.com' },
        ],
      });
    });

    test('should ignore non matching routes', async () => {
      await middleware(
        { hostname: 'localhost', path: '/test' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.send).toHaveBeenCalledTimes(0);
    });

    test('should match site to host and route (seekau)', async () => {
      await middleware(
        { hostname: 'dev.seek.com.au', path: '/' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('seekAnz/home');
    });

    test('should match site to host and route (jobstreet)', async () => {
      await middleware(
        { hostname: 'dev.jobstreet.com', path: '/' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('jobStreet/home');
    });

    test('should fallback to first site if no matching host', async () => {
      await middleware(
        { hostname: 'localhost', path: '/' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('seekAnz/home');
    });

    test('should match dynamic routes', async () => {
      await middleware(
        { hostname: 'dev.jobstreet.com', path: '/details/123' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('jobStreet/details/:id');
    });

    test('should match dynamic routes with host fallback', async () => {
      await middleware(
        { hostname: 'localhost', path: '/serp/123/info' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('seekAnz/serp/:id/info');
    });
  });

  describe('when no sites are configured', () => {
    beforeAll(() => {
      vol.fromJSON(
        {
          './index.html': 'home',
          './details/:id/index.html': 'details/:id',
          './serp/:id/info/index.html': 'serp/:id/info',
        },
        rootDirectory,
      );

      middleware = siteServeMiddleware({
        fs,
        rootDirectory,
        transformOutputPath,
        routes: [
          { route: '/' },
          { route: '/details/:id' },
          { route: '/serp/:id/info' },
        ],
        sites: [],
      });
    });

    test('should ignore non matching routes', async () => {
      await middleware(
        { hostname: 'localhost', path: '/test' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.send).toHaveBeenCalledTimes(0);
    });

    test('should match route', async () => {
      await middleware(
        { hostname: 'dev.seek.com.au', path: '/' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('home');
    });

    test('should match dynamic routes', async () => {
      await middleware(
        { hostname: 'dev.jobstreet.com', path: '/details/123' },
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(0);
      expect(mockResponse.send).toHaveBeenCalledWith('details/:id');
    });
  });
});
