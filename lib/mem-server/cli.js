#! /usr/bin/env node
require('babel-register')({
  presets: ['env']
});

// TODO: fix all reference paths

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
  const MemServer = require('../../index.js');
  const repl = require('repl');

  console.log(chalk.cyan('[MemServer CLI]'), 'Starting MemServer node.js console - Remember to MemServer.init()!');
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
  const MemServerDirectoryExists = process.cwd().includes('mem-server');

  !MemServerDirectoryExists ? fs.mkdirSync('./mem-server') : null;

  if (!fs.existsSync('./mem-server/server.js')) {
    fs.writeFileSync('./mem-server/server.js', `
    export default function(Models) {
    }`);
    console.log(chalk.cyan('[MemServer CLI] /mem-server folder created'));
  }

  createFixtureAndModelFoldersIfNeeded();
}

function createFixtureAndModelFoldersIfNeeded() {
  if (!fs.existsSync('./mem-server/fixtures')) {
    fs.mkdirSync('./mem-server/fixtures');
    console.log(chalk.cyan('[MemServer CLI] /mem-server/fixtures folder created'));
  }

  if (!fs.existsSync('./mem-server/models')) {
    fs.mkdirSync('./mem-server/models');
    console.log(chalk.cyan('[MemServer CLI] /mem-server/models folder created'));
  }
}

function generateModelFiles() {
  const MemServerDirectoryExists = !process.cwd().includes('mem-server')

  if (!process.argv[3] || !process.argv[4]) {
    throw new Error(chalk.red('[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user'))
  } else if (!MemServerDirectoryExists) {
    throw new Error(chalk.red('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));
  }

  createFixtureAndModelFoldersIfNeeded();

  const modelFileName = dasherize(singularize(process.argv[3]));
  const fixtureFileName = dasherize(pluralize(process.argv[3]));

  if (!fs.existsSync(`./models/${modelFileName}`) {
    fs.writeFileSync(`./models/${modelFileName}`, `
    `);
    console.log(chalk.cyan(`[MemServer CLI] /mem-server/models/${modelFileName} folder created`));
  }

  if (!fs.existsSync(`./fixtures/${fixtureFileName}.js`)) {
    fs.writeFileSync(`./fixtures/${fixtureFileName}`, `export default[

    ];`);
    console.log(chalk.cyan(`[MemServer CLI] /mem-server/fixtures/${fixtureFileName} folder created`));
  }
}

// TODO: this function is important
function getMemServerDirectory() {

}
