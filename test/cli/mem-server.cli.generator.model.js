const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const shell = require('child_process').exec;

describe('[MemServer CLI] $ memserver g model [modelName] tests', function() {
  beforeEach(function(done) {
    rimraf.sync(`${process.cwd()}/memserver`);

    done();
  });

  it('memserver g and memserver generate without model and memserver directory raises', function(done) {
    shell(`node ${process.cwd()}/cli.js generate`, (error, stdout) => {
      assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

      shell(`node ${process.cwd()}/cli.js g`, (error, stdout) => {
        assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

        done();
      });
    });
  });

  it('memserver g and memserver generate with model without memserver directory raises', function(done) {
    shell(`node ${process.cwd()}/cli.js generate model`, (error, stdout) => {
      assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

      shell(`node ${process.cwd()}/cli.js g model`, (error, stdout) => {
        assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

        done();
      });
    });
  });

  it('memserver g and memserver generate without model raises', function(done) {
    initializeMemServer();

    shell(`node ${process.cwd()}/cli.js generate model`, (error, stdout) => {
      assert.equal(stdout, '[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user\n');

      done();
    });
  });

  const expectedOutput = '[MemServer CLI] /memserver/models/user.js created\n' +
    '[MemServer CLI] /memserver/fixtures/users.js created\n';

  it('memserver g [modelName] works', function(done) {
    initializeMemServer();

    assert.ok(!fs.existsSync(`${process.cwd()}/memserver/models/user.js`));
    assert.ok(!fs.existsSync(`${process.cwd()}/memserver/fixtures/users.js`));

    shell(`node ${process.cwd()}/cli.js g model user`, (error, stdout) => {
      assert.equal(stdout, expectedOutput);
      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/models/user.js`).toString(), 'import Model from \'memserver/model\';\n\nexport default Model({\n\n});');
      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/fixtures/users.js`).toString(), 'export default [\n];');

      done();
    });
  });

  it('memserver generate [modelName] works', function(done) {
    initializeMemServer();

    assert.ok(!fs.existsSync(`${process.cwd()}/memserver/models/user.js`));
    assert.ok(!fs.existsSync(`${process.cwd()}/memserver/fixtures/users.js`));

    shell(`node ${process.cwd()}/cli.js generate model user`, (error, stdout) => {
      assert.equal(stdout, expectedOutput);
      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/models/user.js`).toString(), 'import Model from \'memserver/model\';\n\nexport default Model({\n\n});');
      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/fixtures/users.js`).toString(), 'export default [\n];');

      done();
    });
  });
});

function initializeMemServer() {
  if (fs.existsSync(`${process.cwd()}/memserver`)) {
    rimraf.sync(`${process.cwd()}/memserver`);
  }

  const memServerDirectory = `${process.cwd()}/memserver`;

  fs.mkdirSync(memServerDirectory);
  fs.writeFileSync(`${memServerDirectory}/server.js`, `export default function(Models) {
}`);
  fs.writeFileSync(`${memServerDirectory}/initializer.js`, `export default function(Models) {
  }`);
  fs.mkdirSync(`${memServerDirectory}/fixtures`);
  fs.mkdirSync(`${memServerDirectory}/models`);
}
