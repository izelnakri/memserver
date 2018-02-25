#! /usr/bin/env node
require('babel-register')({
  presets: ['env']
});

const fs = require('fs');
const util = require('util');
const child_process = require('child_process');
const chalk = require('chalk');
const { classify, dasherize, underscore } = require('ember-cli-string-utils');
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
CLI.command(['help', 'h'], printCommands);
CLI.command(['init', 'new'], () => {
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
});
CLI.command(['generate', 'g'], () => {
  const memServerDirectory = getMemServerDirectory();
  const generationType = process.argv[3];

  if (!memServerDirectory) {
    return console.log(chalk.red('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));
  } else if (!generationType) {
    return console.log(chalk.red('[MemServer CLI] generate should be either $ memserver g model [modelName] or $ memserver g fixtures'));
  } else if (generationType === 'model') {
    return generateModel(process.argv[4], memServerDirectory);
  } else if (generationType === 'fixtures') {
    return generateFixtures(process.argv[4], memServerDirectory);
  }

  console.log(chalk.red(`[MemServer CLI] $ memserver ${process.argv[2]} ${process.argv[3]} ${process.argv[4] || ''} does not exists, available commands:`));

  return printCommands();
});
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

memserver init | new                    # Sets up the initial memserver folder structure
memserver generate model ${chalk.yellow('[ModelName]')}    # Generates the initial files for a MemServer Model ${chalk.cyan('[alias: "memserver g model"]')}
memserver generate fixtures             # Outputs your initial MemServer state as pure javascript fixture files
memserver generate fixtures ${chalk.yellow('[ModelName]')} # Outputs your initial MemServer state for certain model as pure javascript fixture
memserver console                       # Starts a MemServer console in node.js ${chalk.cyan('[alias: "memserver c"]')}
memserver serve | server ${chalk.yellow('[outputFile]')}   # Builds an ES5 javascript bundle with all your memserver code continuosly on watch ${chalk.cyan('[alias: "memserver s"]')}
memserver build | rollup ${chalk.yellow('[outputFile]')}   # Builds an ES5 javascript bundle with all your memserver code
memserver version | v                   # Displays memserver version
`);
}

function generateModel(modelName, memServerDirectory) {
  if (!modelName) {
    return console.log(chalk.red('[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user'));
  }

  createFixtureAndModelFoldersIfNeeded(memServerDirectory);

  const modelFileName = dasherize(singularize(modelName));
  const fixtureFileName = dasherize(pluralize(modelName));

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

function generateFixtures(modelName, memServerDirectory) {
  const MemServer = require('./lib/index.js');

  MemServer.start();

  const targetModels = modelName ? [classify(singularize(modelName))] :
    Object.keys(MemServer.DB);

  targetModels.forEach((Model) => {
    const sortedState = MemServer.DB[Model].sort(sortFunction);
    const arrayOfRecords = util.inspect(sortedState, { depth: null, maxArrayLength: null });

    const targetFileName = pluralize(dasherize(underscore(Model)));
    const fileRelativePath = `/fixtures/${targetFileName}.js`;
    const fileAbsolutePath = `${memServerDirectory}${fileRelativePath}`;

    if (fs.existsSync(fileAbsolutePath)) {
      const fixtureData = fs.readFileSync(fileAbsolutePath).toString();
      const previousModels = eval(fixtureData.slice(15, fixtureData.length - 1)); // NOTE: Good use-case for evil eval!:

      if (JSON.stringify(previousModels.sort(sortFunction)) === JSON.stringify(sortedState)) {
        return;
      }
    }

    fs.writeFile(fileAbsolutePath, `export default ${arrayOfRecords};`, () => { // TODO: make this beter formatted
      console.log(chalk.yellow(`[MemServer] data written to ${fileRelativePath}`));
    });
  });
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

function openConsole() {
  if (process.cwd().includes('memserver')) {
    throw new Error(chalk.red('[MemServer CLI] You are in the memserver directory, go to the root of your project to start memserver console.'));
  }

  const MemServer = require('./lib/index.js');
  const repl = require('repl');

  console.log(chalk.cyan('[MemServer CLI]'), 'Starting MemServer node.js console - Remember to MemServer.start() ;)');
  repl.start('> ');
}

function buildMemServerDist() {
  const outputFile = process.argv[3] || 'memserver.dist.js';
  const rollup = child_process.spawnSync('rollup', [
    '--config', `${require.resolve('memserver')}/../../rollup.config.js`, '-o', outputFile
  ]);

  console.log(rollup.stderr.toString());
  console.log(chalk.cyan('[MemServer CLI]'), ` NEW BUILD: ${outputFile}`);
}

function getMemServerDirectory() {
  const cwd = process.cwd();
  const folders = cwd.split('/');
  const memServerIndex = folders.findIndex((path) => path === 'memserver');

  if (memServerIndex !== -1) {
    return folders.slice(0, memServerIndex + 1).join('/');
  } else if (fs.readdirSync('.').includes('memserver')) {
    return `${cwd}/memserver`;
  }
}

function sortFunction(a, b) {
  if (a.id > b.id) {
    return 1;
  } else if (a.id < b.id) {
    return -1;
  }

  return 0;
}

// NOTE: maybe add + and minus and kb reports to fixtures
// NOTE: add glue option in future: $ memserver glue
