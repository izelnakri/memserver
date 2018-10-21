import test from 'ava';
import fs from 'fs-extra';
import child_process from 'child_process';

const CWD = process.cwd();
const shell = child_process.exec;

test.beforeEach(async () => {
  await fs.remove(`${CWD}/memserver`);
});

test.serial.cb('$ memserver g | and $ memserver generate | without memserver directory raises', (t) => {
  t.plan(2);

  shell(`node ${CWD}/cli.js generate`, (error, stdout) => {
    t.is(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

    shell(`node ${CWD}/cli.js g`, (error, stdout) => {
      t.is(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

      t.end();
    });
  });
});

test.serial.cb('$ memserver g model | and $ memserver generate model | without memserver directory raises', (t) => {
  t.plan(2);

  shell(`node ${CWD}/cli.js generate model`, (error, stdout) => {
    t.is(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

    shell(`node ${CWD}/cli.js g model`, (error, stdout) => {
      t.is(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

      t.end();
    });
  });
});

test.serial.cb('$ memserver g model | and $ memserver generate model | without model raises', (t) => {
  t.plan(1);

  initializeMemServer().then(() => {
    shell(`node ${CWD}/cli.js generate model`, (error, stdout) => {
      t.is(stdout, '[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user\n');

      t.end();
    });
  });
});

const EXPECTED_OUTPUT = '[MemServer CLI] /memserver/models/user.js created\n' +
  '[MemServer CLI] /memserver/fixtures/users.js created\n';

test.serial.cb('$ memserver g [modelName] | works', (t) => {
  t.plan(5);

  initializeMemServer().then(async () => {
    const [userModelExists, userFixturesExists] = await Promise.all([
      fs.exists(`${CWD}/memserver/models/user.js`),
      fs.exists(`${CWD}/memserver/fixtures/users.js`)
    ]);

    t.true(!userModelExists);
    t.true(!userFixturesExists);

    shell(`node ${CWD}/cli.js g model user`, async (error, stdout) => {
      t.is(stdout, EXPECTED_OUTPUT);

      const [userModelBuffer, userFixturesBuffer] = await Promise.all([
        fs.readFile(`${CWD}/memserver/models/user.js`),
        fs.readFile(`${CWD}/memserver/fixtures/users.js`)
      ]);

      t.is(userModelBuffer.toString(), 'import Model from \'memserver/model\';\n\nexport default Model({\n\n});');
      t.is(userFixturesBuffer.toString(), 'export default [\n];');

      t.end();
    });
  });
});

test.serial.cb('$ memserver generate [modelName] | works', (t) => {
  t.plan(5);

  initializeMemServer().then(async () => {
    const [userModelExists, userFixturesExists] = await Promise.all([
      fs.exists(`${CWD}/memserver/models/user.js`),
      fs.exists(`${CWD}/memserver/fixtures/users.js`)
    ]);

    t.true(!userModelExists);
    t.true(!userFixturesExists);

    shell(`node ${process.cwd()}/cli.js generate model user`, async (error, stdout) => {
      t.is(stdout, EXPECTED_OUTPUT);

      const [userModelBuffer, userFixturesBuffer] = await Promise.all([
        fs.readFile(`${CWD}/memserver/models/user.js`),
        fs.readFile(`${CWD}/memserver/fixtures/users.js`)
      ]);

      t.is(userModelBuffer.toString(), 'import Model from \'memserver/model\';\n\nexport default Model({\n\n});');
      t.is(userFixturesBuffer.toString(), 'export default [\n];');

      t.end();
    });
  });
});

function initializeMemServer() {
  return new Promise(async (resolve) => {
    if (await fs.exists(`${CWD}/memserver`)) {
      await fs.remove(`${CWD}/memserver`);
    }

    const memServerDirectory = `${CWD}/memserver`;

    await Promise.all([
      fs.mkdir(memServerDirectory),
      fs.writeFile(`${memServerDirectory}/server.js`, `export default function(Models) {
    }`),
      fs.writeFile(`${memServerDirectory}/initializer.js`, `export default function(Models) {
      }`),
      fs.mkdir(`${memServerDirectory}/fixtures`),
      fs.mkdir(`${memServerDirectory}/models`)
    ]);

    resolve();
  });
}
