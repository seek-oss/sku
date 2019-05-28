const playroom = require('playroom/lib');
const { cwd } = require('../lib/cwd');
const makePlayroomConfig = require('../config/playroom/makePlayroomConfig');
const { start } = playroom({ cwd: cwd(), ...makePlayroomConfig() });

start();
