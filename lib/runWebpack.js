const run = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          children: false,
          colors: true
        })
      );

      if (err || stats.hasErrors()) {
        reject(stats.toJson().errors);
      }

      resolve();
    });
  });
};

const watch = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.watch({}, (err, stats) => {
      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          children: false,
          colors: true
        })
      );

      if (err || stats.hasErrors()) {
        reject(stats.toJson().errors);
      }

      resolve();
    });
  });
};

module.exports = {
  run,
  watch
};
