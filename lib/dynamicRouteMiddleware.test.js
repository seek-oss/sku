const { fs, vol } = require('memfs');
const dynamicRouteMiddleware = require('./dynamicRouteMiddleware');

const rootDirectory = 'dist';

const mockResponse = {
  send: jest.fn()
};

const mockNext = jest.fn();

vol.fromJSON(
  {
    './test/:id/index.html': 'test/:id',
    './other-test/test/:id/details/index.html': 'other-test/test/:id/details'
  },
  rootDirectory
);

describe('dynamicRouteMiddleware', () => {
  beforeEach(() => {
    mockResponse.send.mockClear();
    mockNext.mockClear();
  });

  test('should ignore non matching routes', () => {
    const dynamicRoutes = ['/test/:id'];
    const middleware = dynamicRouteMiddleware({
      fs,
      dynamicRoutes,
      rootDirectory
    });

    middleware({ path: '/test' }, mockResponse, mockNext);

    expect(mockNext).toBeCalledTimes(1);
    expect(mockResponse.send).toBeCalledTimes(0);
  });

  test('should ignore similar but extended routes', () => {
    const dynamicRoutes = ['/test/:id'];
    const middleware = dynamicRouteMiddleware({
      fs,
      dynamicRoutes,
      rootDirectory
    });

    middleware({ path: '/test/123/details' }, mockResponse, mockNext);

    expect(mockNext).toBeCalledTimes(1);
    expect(mockResponse.send).toBeCalledTimes(0);
  });

  test('should return match for dynamic routes', () => {
    const dynamicRoutes = ['/test/:id'];
    const middleware = dynamicRouteMiddleware({
      fs,
      dynamicRoutes,
      rootDirectory
    });

    middleware({ path: '/test/123' }, mockResponse, mockNext);

    expect(mockResponse.send).toBeCalledWith('test/:id');
  });

  test('should handle many routes', () => {
    const dynamicRoutes = ['/test/:id', '/other-test/test/:id/details'];
    const middleware = dynamicRouteMiddleware({
      fs,
      dynamicRoutes,
      rootDirectory
    });

    middleware(
      { path: '/other-test/test/some-id/details' },
      mockResponse,
      mockNext
    );

    expect(mockResponse.send).toBeCalledWith('other-test/test/:id/details');
  });
});
