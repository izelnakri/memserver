import chalk from 'ansi-colors';
import fs from 'fs-extra';
import getMemServerDirectory from '../utils/get-memserver-directory.js';
import createFixtureAndModelFoldersIfNeeded from '../utils/create-fixture-and-model-folders-if-needed.js';

export default async function() {
  let memServerDirectory = await getMemServerDirectory();

  if (!memServerDirectory) {
    memServerDirectory = './memserver';
    await fs.mkdirp(memServerDirectory);
  }

  if (!(await fs.exists(`${memServerDirectory}/server.js`))) {
    await fs.writeFile(`${memServerDirectory}/server.js`, `export default function(Models) {
      // this.get('/users/:id', (request) => {});
      // this.get('/users', ({ params, headers, queryParams }) => {});
      // this.post('/users', ({ params }) => {});
}`);
    console.log(chalk.cyan('[MemServer CLI] /memserver/server.js created'));
  }

  if (!(await fs.existsSync(`${memServerDirectory}/initializer.js`))) {
    await fs.writeFile(`${memServerDirectory}/initializer.js`, `export default function(Models) {
}`);
    console.log(chalk.cyan('[MemServer CLI] /memserver/initializer.js created'));
  }

  await createFixtureAndModelFoldersIfNeeded(memServerDirectory);
}

