const exitEvents = [
  'SIGINT',
  'SIGTERM',
  'SIGHUP',
  'SIGQUIT',
  'uncaughtException',
];

function gracefulExit(cb) {
  for (const exitEvent of exitEvents) {
    process.on(exitEvent, () => {
      cb(exitEvent);
    });
  }
}

module.exports = gracefulExit;
