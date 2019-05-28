const playroom = require('playroom/lib');
const { cwd } = require('../lib/cwd');
const makePlayroomConfig = require('../config/playroom/makePlayroomConfig');
const { build } = playroom({ cwd: cwd(), ...makePlayroomConfig() });

build(err => {
  if (err) {
    console.error('Playroom error');
    console.error(err);
    process.exit(1);
  }
});
