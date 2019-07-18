import fs from 'fs-extra';
import chalk from 'ansi-colors';
import util from 'util';
import printCommand from './index.js';
import getMemServerDirectory from '../utils/get-memserver-directory.js';
import createFixtureAndModelFoldersIfNeeded from '../utils/create-fixture-and-model-folders-if-needed.js';
import emberCliStringUtils from 'ember-cli-string-utils';
import Inflector from 'i';

const { classify, dasherize, underscore } = emberCliStringUtils;
const { pluralize, singularize } = Inflector();

export default async function() {
  try {
  const memServerDirectory = await getMemServerDirectory();
  const generationType = process.argv[3];

  if (!memServerDirectory) {
    return console.log(chalk.red('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));
  } else if (!generationType) {
    return console.log(chalk.red('[MemServer CLI] generate should be either $ memserver g model [modelName] or $ memserver g fixtures'));
  } else if (generationType === 'model') {
    return await generateModel(process.argv[4], memServerDirectory);
  } else if (generationType === 'fixtures') {
    return await generateFixtures(process.argv[4], memServerDirectory);
  }

  console.log(chalk.red(`[MemServer CLI] $ memserver ${process.argv[2]} ${process.argv[3]} ${process.argv[4] || ''} does not exists, available commands:`));

  return await printCommand();
  } catch(error) {
    console.log(error);
  }
}

async function generateModel(modelName, memServerDirectory) {
  if (!modelName) {
    return console.log(chalk.red('[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user'));
  }

  createFixtureAndModelFoldersIfNeeded(memServerDirectory);

  const modelFileName = dasherize(singularize(modelName));
  const fixtureFileName = dasherize(pluralize(modelName));

  if (!(await fs.exists(`${memServerDirectory}/models/${modelFileName}.js`))) {
    await fs.writeFile(`${memServerDirectory}/models/${modelFileName}.js`, `import Model from 'memserver/model';

export default Model({

});`);
    console.log(chalk.cyan(`[MemServer CLI] /memserver/models/${modelFileName}.js created`));
  }

  if (!(await fs.exists(`${memServerDirectory}/fixtures/${fixtureFileName}.js`))) {
    await fs.writeFile(`${memServerDirectory}/fixtures/${fixtureFileName}.js`, `export default [
];`);
    console.log(chalk.cyan(`[MemServer CLI] /memserver/fixtures/${fixtureFileName}.js created`));
  }
}

async function generateFixtures(modelName, memServerDirectory) {
  const MemServer = await (await import('./../../index.js')).default;

  console.log('memserver is', MemServer);
  MemServer.start();

  const targetModels = modelName ? [classify(singularize(modelName))] :
    Object.keys(MemServer.DB);

  targetModels.forEach(async (Model) => {
    const sortedState = MemServer.DB[Model].sort(sortFunction);
    const arrayOfRecords = util.inspect(sortedState, { depth: null, maxArrayLength: null });

    const targetFileName = pluralize(dasherize(underscore(Model)));
    const fileRelativePath = `/fixtures/${targetFileName}.js`;
    const fileAbsolutePath = `${memServerDirectory}${fileRelativePath}`;

    if (await fs.exists(fileAbsolutePath)) {
      const previousModels = (await import(fileAbsolutePath)).default;

      if (JSON.stringify(previousModels.sort(sortFunction)) === JSON.stringify(sortedState)) {
        return;
      }
    }

    await fs.writeFile(fileAbsolutePath, `export default ${arrayOfRecords};`);

    console.log(chalk.yellow(`[MemServer] data written to ${fileRelativePath}`));
  });
}

function sortFunction(a, b) {
  if (a.id > b.id) {
    return 1;
  } else if (a.id < b.id) {
    return -1;
  }

  return 0;
}
