function getSourceMapSetting({
  isDevServer,
  sourceMapsProd,
}: {
  isDevServer: boolean;
  sourceMapsProd: boolean;
}) {
  if (isDevServer) {
    return 'eval-cheap-module-source-map';
  }

  return sourceMapsProd ? 'source-map' : false;
}

export default getSourceMapSetting;
