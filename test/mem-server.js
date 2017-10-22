// const assert = require('chai').assert;
const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer', function() {
  describe('requiring MemServer', function() {
    afterEach(function(done) {
      if (fs.existsSync(`${process.cwd()}/memserver`)) {
        rimraf.sync(`${process.cwd()}/memserver`);
      }
      done();
    });

    it('should throw error if /memserver folder doesnt exist', function() {
      this.timeout(5000);

      assert.throws(() => require('../index.js'), (err) => {
        return (err instanceof Error) &&
          /\/memserver folder doesn't exist for this directory!/.test(err);
      });
    });

    it('should throw error if /memserver/models folder doesnt exist', function() {
      this.timeout(5000);

      fs.mkdirSync(`./memserver`);

      assert.throws(() => require('../index.js'), (err) => {
        return (err instanceof Error) &&
          /\/memserver\/models folder doesn't exist for this directory!/.test(err);
      });
    });

    it('should throw error if /memserver/server.js doesnt exist', function() {
      this.timeout(5000);

      fs.mkdirSync(`./memserver`);
      fs.mkdirSync(`./memserver/models`);
      // fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');

      assert.throws(() => require('../index.js'), (err) => {
        return (err instanceof Error) &&
          /\/memserver\/server.js doesn't exist for this directory!/.test(err);
      });
    });

    // it('exports not yet started MemServer with right functions, registered Models and empty DB', () => {
    //   this.timeout(5000);
    //
    //   fs.mkdirSync(`./memserver`);
    //   fs.mkdirSync(`./memserver/models`);
    //   // fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');
    //   fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');
    //
    //   const MemServer = require('../index.js');
    //
    //   assert.equal(MemServer.DB, {});
    //   assert.equal(Object.keys(MemS))
    // });
  });

  // it('can be started with default options', () => {
  //
  // });
  //
  // it('can be started with different options', () => {
  //
  // });
  //
  // it('can be shut down', () => {
  //
  // });
  //
  // it('can be shut down and started again with correct state', () => {
  //
  // });
});
