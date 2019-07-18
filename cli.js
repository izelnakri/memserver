#! /usr/bin/env node --experimental-modules

import fs from 'fs-extra';
import util from 'util';
import child_process from 'child_process';
import chalk from 'ansi-colors';
import buildCommand from './lib/cli/commands/build.js';
import consoleCommand from './lib/cli/commands/console.js';
import generateCommand from './lib/cli/commands/generate.js';
import initCommand from './lib/cli/commands/init.js';
import printCommand from './lib/cli/commands/index.js';
import watchCommand from './lib/cli/commands/watch.js';
import emberCliStringUtils from 'ember-cli-string-utils';
import Inflector from 'i';

const { classify, dasherize, underscore } = emberCliStringUtils;
const { pluralize, singularize } = Inflector();

const CLI = {
  default(commandHandler) {
    !process.argv[2] ? commandHandler() : null;
  },
  command(commandName, commandHandler) {
    if (Array.isArray(commandName)) {
      return commandName.includes(process.argv[2]) ? commandHandler() : null;
    }

    commandName === process.argv[2] ? commandHandler() : null;
  }
};

CLI.default(printCommand);
CLI.command(['help', 'h'], printCommand);
CLI.command(['init', 'new'], initCommand);
CLI.command(['generate', 'g'], generateCommand);
CLI.command(['console', 'c'], consoleCommand);
CLI.command(['watch', 's', 'serve', 'server'], watchCommand);
CLI.command(['build', 'rollup'], buildCommand);
CLI.command(['version', 'v'], async () => {
  console.log(chalk.cyan('[MemServer CLI]'), (await import('./package.json')).default.version);
});

// NOTE: maybe add + and minus and kb reports to fixtures
// NOTE: add glue option in future: $ memserver glue

