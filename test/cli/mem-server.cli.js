const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const shell = require('child_process').exec;

describe('[MemServer CLI] general commands', function() {
  afterEach(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }

    done();
  });

  it('$ memserver and $ memserver help and $ memserver h without arguments shows help screen', function(done) {
    const expectedOutput = `[MemServer CLI] Usage: memserver <command (Default: help)>

memserver init | new                    # Sets up the initial memserver folder structure
memserver generate model [ModelName]    # Generates the initial files for a MemServer Model [alias: "memserver g model"]
memserver generate fixtures             # Outputs your initial MemServer state as pure javascript fixture files
memserver generate fixtures [ModelName] # Outputs your initial MemServer state for certain model as pure javascript fixture
memserver console                       # Starts a MemServer console in node.js [alias: "memserver c"]
memserver serve | server [outputFile]   # Builds an ES5 javascript bundle with all your memserver code continuosly on watch [alias: "memserver s"]
memserver build | rollup [outputFile]   # Builds an ES5 javascript bundle with all your memserver code
memserver version | v                   # Displays memserver version`;

    shell(`node ${process.cwd()}/cli.js`, (error, stdout) => {
      assert.ok(stdout.includes(expectedOutput));

      shell(`node ${process.cwd()}/cli.js help`, (error, stdout) => {
        assert.ok(stdout.includes(expectedOutput));

        shell(`node ${process.cwd()}/cli.js help`, (error, stdout) => {
          assert.ok(stdout.includes(expectedOutput));

          done();
        });
      });
    });
  });

  it('memserver init sets up the initial folder structure', function(done) {
    assert.ok(!fs.existsSync(`${process.cwd()}/memserver`));

    const expectedOutput = '[MemServer CLI] /memserver/server.js created\n' +
      '[MemServer CLI] /memserver/initializer.js created\n' +
      '[MemServer CLI] /memserver/fixtures folder created\n' +
      '[MemServer CLI] /memserver/models folder created\n';

    shell(`node ${process.cwd()}/cli.js init`, (error, stdout) => {
      assert.equal(stdout, expectedOutput);

      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/server.js`).toString(), 'export default function(Models) {\n}');
      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/initializer.js`).toString(), 'export default function(Models) {\n}');
      assert.ok(fs.existsSync(`${process.cwd()}/memserver/fixtures`));
      assert.ok(fs.existsSync(`${process.cwd()}/memserver/models`));

      done();
    });
  });

  it('memserver new sets up the initial folder structure', function(done) {
    assert.ok(!fs.existsSync(`${process.cwd()}/memserver`));

    const expectedOutput = '[MemServer CLI] /memserver/server.js created\n' +
      '[MemServer CLI] /memserver/initializer.js created\n' +
      '[MemServer CLI] /memserver/fixtures folder created\n' +
      '[MemServer CLI] /memserver/models folder created\n';

    shell(`node ${process.cwd()}/cli.js new`, (error, stdout) => {
      assert.equal(stdout, expectedOutput);

      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/server.js`).toString(), 'export default function(Models) {\n}');
      assert.equal(fs.readFileSync(`${process.cwd()}/memserver/initializer.js`).toString(), 'export default function(Models) {\n}');
      assert.ok(fs.existsSync(`${process.cwd()}/memserver/fixtures`));
      assert.ok(fs.existsSync(`${process.cwd()}/memserver/models`));

      done();
    });
  });

  it('memserver version and memserver v works', function(done) {
    shell(`node ${process.cwd()}/cli.js v`, (error, stdout) => {
      assert.equal(stdout, `[MemServer CLI] ${require(process.cwd() + '/package.json').version}\n`);

      shell(`node ${process.cwd()}/cli.js version`, (error, stdout) => {
        assert.equal(stdout, `[MemServer CLI] ${require(process.cwd() + '/package.json').version}\n`);

        done();
      });
    });
  });
});
