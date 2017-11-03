#! /usr/bin/env node
const fs = require('fs');
const child_process = require('child_process');
const chalk = require('chalk');
const { dasherize } = require('ember-cli-string-utils');
const { pluralize, singularize } = require('i')();

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

CLI.default(printCommands);
CLI.command('help', printCommands);
CLI.command(['init', 'new'], generateInitialFolderStructure);
CLI.command(['generate', 'g'], generateModelFiles);
CLI.command(['console', 'c'], openConsole);
CLI.command(['watch', 's', 'serve', 'server'], () => {
  buildMemServerDist();
  fs.watch(`${process.cwd()}/memserver`, { recursive: true }, () => buildMemServerDist());
});
CLI.command(['build', 'rollup'], buildMemServerDist);
CLI.command(['version', 'v'], () => {
  console.log(chalk.cyan('[MemServer CLI]'), require('./package.json').version);
});

function printCommands() {
  console.log(`${chalk.cyan('[MemServer CLI] Usage:')} memserver ${chalk.yellow('<command (Default: help)>')}

memserver init | new                   # Sets up the initial memserver folder structure
memserver generate model ${chalk.yellow('[ModelName]')}   # Generates the initial files for a MemServer Model ${chalk.cyan('[alias: "memserver g model"]')}
memserver console                      # Starts a MemServer console in node.js ${chalk.cyan('[alias: "memserver c"]')}
memserver serve | server ${chalk.yellow('[outputFile]')}  # Builds an ES5 javascript bundle with all your memserver code continuosly on watch ${chalk.cyan('[alias: "memserver s"]')}
memserver build | rollup ${chalk.yellow('[outputFile]')}  # Builds an ES5 javascript bundle with all your memserver code
memserver version | v                 # Displays memserver version
`);
}

function generateInitialFolderStructure() {
  let memServerDirectory = getMemServerDirectory();

  if (!memServerDirectory) {
    memServerDirectory = './memserver';
    fs.mkdirSync(memServerDirectory);
  }

  if (!fs.existsSync(`${memServerDirectory}/server.js`)) {
    fs.writeFileSync(`${memServerDirectory}/server.js`, `export default function(Models) {
}`);
    console.log(chalk.cyan('[MemServer CLI] /memserver/server.js created'));
  }

  if (!fs.existsSync(`${memServerDirectory}/initializer.js`)) {
    fs.writeFileSync(`${memServerDirectory}/initializer.js`, `export default function(Models) {
}`);
    console.log(chalk.cyan('[MemServer CLI] /memserver/initializer.js created'));

  }


  createFixtureAndModelFoldersIfNeeded(memServerDirectory);
}

function createFixtureAndModelFoldersIfNeeded(memServerDirectory) {
  if (!fs.existsSync(`${memServerDirectory}/fixtures`)) {
    fs.mkdirSync(`${memServerDirectory}/fixtures`);
    console.log(chalk.cyan('[MemServer CLI] /memserver/fixtures folder created'));
  }

  if (!fs.existsSync(`${memServerDirectory}/models`)) {
    fs.mkdirSync(`${memServerDirectory}/models`);
    console.log(chalk.cyan('[MemServer CLI] /memserver/models folder created'));
  }
}

function generateModelFiles() {
  const memServerDirectory = getMemServerDirectory();

  if (!process.argv[3] || !process.argv[4]) {
    throw new Error(chalk.red('[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user'));
  } else if (!memServerDirectory) {
    throw new Error(chalk.red('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));
  }

  createFixtureAndModelFoldersIfNeeded(memServerDirectory);

  const modelFileName = dasherize(singularize(process.argv[4]));
  const fixtureFileName = dasherize(pluralize(process.argv[4]));

  if (!fs.existsSync(`${memServerDirectory}/models/${modelFileName}.js`)) {
    fs.writeFileSync(`${memServerDirectory}/models/${modelFileName}.js`, `import Model from 'memserver/model';
export default Model({

});`);
    console.log(chalk.cyan(`[MemServer CLI] /memserver/models/${modelFileName}.js created`));
  }

  if (!fs.existsSync(`${memServerDirectory}/fixtures/${fixtureFileName}.js`)) {
    fs.writeFileSync(`${memServerDirectory}/fixtures/${fixtureFileName}.js`, `export default [
];`);
    console.log(chalk.cyan(`[MemServer CLI] /memserver/fixtures/${fixtureFileName}.js created`));
  }
}

function openConsole() {
  const MemServer = require('./lib/index.js');
  const repl = require('repl');

  console.log(chalk.cyan('[MemServer CLI]'), 'Starting MemServer node.js console - Remember to MemServer.start() ;)');
  repl.start('> ');
}

function buildMemServerDist() {
  const outputFile = process.argv[3] || 'memserver.dist.js';
  const rollup = child_process.spawnSync('rollup', [
    '--config', `${require('path').resolve('.')}/rollup.config.js`, '-o', outputFile
  ]);

  console.log(rollup.stderr.toString());
  console.log(chalk.cyan('[MemServer CLI]'), ` NEW BUILD: ${outputFile}`);
}

function getMemServerDirectory() {
  const cwd = process.cwd();

  if (cwd.includes('memserver')) {
    const targetIndex = cwd.lastIndexOf('memserver') + 9;

    return cwd.slice(0, targetIndex);
  }
}
