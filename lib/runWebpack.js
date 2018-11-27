const done = (resolve, reject) => (err, stats) => {
  console.log(
    stats.toString({
      chunks: false, // Makes the build much quieter
      children: false,
      colors: true
    })
  );

  const info = stats.toJson();

  if (err || stats.hasErrors()) {
    reject(info.errors);
  }

  if (stats.hasWarnings()) {
    info.warnings.forEach(console.warn);
  }

  resolve();
};

const run = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.run(done(resolve, reject));
  });
};

const watch = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.watch({}, done(resolve, reject));
  });
};

module.exports = {
  run,
  watch
};
