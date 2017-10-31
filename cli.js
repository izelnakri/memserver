#! /usr/bin/env node
require('babel-register')({
  presets: ['env']
});

const fs = require('fs');
const chalk = require('chalk');
const { pluralize, dasherize, singularize } = require('i')(); // NOTE: move to ES6 imports

const CLI = {
  default(commandHandler) {
    !process.argv[2] ? commandHandler() : null;
  },
  command(commandName, commandHandler) {
    commandName === process.argv[2] ? commandHandler() : null;
  }
};

CLI.default(printCommands);
CLI.command('help', printCommands);

CLI.command('init', generateInitialFolderStructure);
CLI.command('new', generateInitialFolderStructure);

CLI.command('g', generateModelFiles);
CLI.command('generate', generateModelFiles);

CLI.command('console', () => {
  const MemServer = require('memserver');
  const repl = require('repl');

  console.log(chalk.cyan('[MemServer CLI]'), 'Starting MemServer node.js console - Remember to MemServer.init() ;)');
  repl.start('> ');
});

CLI.command('browserify', () => {
  // browserify command here with babel
});

function printCommands() {
  console.log(`${chalk.cyan('[MemServer CLI] Usage:')} memserver ${chalk.yellow('<command (Default: help)>')}

memserver init | new                  # Sets up the initial memserver folder structure
memserver generate model ${chalk.yellow('[ModelName]')}  # Generates the initial files for a MemServer Model ${chalk.cyan('[alias: "memserver g model"]')}
memserver console                     # Starts a MemServer console in node.js ${chalk.cyan('[alias: "memserver c"]')}
memserver browserify ${chalk.yellow('[outputFile]')}     # Builds an ES5 javascript bundle with all your memserver code
`);
}

function generateInitialFolderStructure() {
  const memServerDirectory = getMemServerDirectory();

  !memServerDirectory ? fs.mkdirSync('./memserver') : null;

  if (!fs.existsSync(`${memServerDirectory}/server.js`)) {
    fs.writeFileSync(`${memServerDirectory}/server.js`, `
    export default function(Models) {
    }`);
    console.log(chalk.cyan('[MemServer CLI] /memserver folder created'));
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
    throw new Error(chalk.red('[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user'))
  } else if (!memServerDirectory) {
    throw new Error(chalk.red('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));
  }

  createFixtureAndModelFoldersIfNeeded(memServerDirectory);

  const modelFileName = dasherize(singularize(process.argv[3]));
  const fixtureFileName = dasherize(pluralize(process.argv[3]));

  if (!fs.existsSync(`${memServerDirectory}/${modelFileName}.js`)) {
    fs.writeFileSync(`${memServerDirectory}/${modelFileName}.js`, `import Model from 'memserver/model';
    export default Model({

    });`);
    console.log(chalk.cyan(`[MemServer CLI] /memserver/models/${modelFileName}.js folder created`));
  }

  if (!fs.existsSync(`${memServerDirectory}/${fixtureFileName}.js`)) {
    fs.writeFileSync(`${memServerDirectory}/${fixtureFileName}.js`, `export default[

    ];`);
    console.log(chalk.cyan(`[MemServer CLI] /memserver/fixtures/${fixtureFileName}.js folder created`));
  }
}

function getMemServerDirectory() {
  const cwd = process.cwd();

  if (cwd.includes('memserver')) {
    const targetIndex = cwd.lastIndexOf('memserver') + 9;

    return cwd.slice(0, targetIndex);
  }
}
