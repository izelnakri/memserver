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

      assert.throws(() => require('../lib/index.js'), (err) => {
        return (err instanceof Error) &&
          /\/memserver folder doesn't exist for this directory!/.test(err);
      });
    });

    it('should throw error if /memserver/models folder doesnt exist', function() {
      this.timeout(5000);

      fs.mkdirSync(`./memserver`);

      assert.throws(() => require('../lib/index.js'), (err) => {
        return (err instanceof Error) &&
          /\/memserver\/models folder doesn't exist for this directory!/.test(err);
      });
    });

    it('should throw error if /memserver/server.js doesnt exist', function() {
      this.timeout(5000);

      fs.mkdirSync(`./memserver`);
      fs.mkdirSync(`./memserver/models`);

      assert.throws(() => require('../lib/index.js'), (err) => {
        return (err instanceof Error) &&
          /\/memserver\/server.js doesn't exist for this directory!/.test(err);
      });
    });

    it('exports a MemServer with right functions and empty DB when there is no model', function() {
      this.timeout(5000);

      fs.mkdirSync(`./memserver`);
      fs.mkdirSync(`./memserver/models`);
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');

      const MemServer = require('../lib/index.js');

      assert.deepEqual(MemServer.DB, {});
      assert.deepEqual(MemServer.Server, {});
      assert.deepEqual(Object.keys(MemServer), ['DB', 'Server', 'Models', 'start', 'shutdown']);
      assert.deepEqual(MemServer.Models, {});
    });

    it('exports a MemServer with right functions and empty DB and models', function() {
      this.timeout(5000);

      const modelFileContent = `import Model from '${process.cwd()}/lib/model';

      export default Model({});`;

      fs.mkdirSync(`./memserver`);
      fs.mkdirSync(`./memserver/models`);
      fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
      fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
      fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, modelFileContent);
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');

      Object.keys(require.cache).forEach((key) => delete require.cache[key]);

      const MemServer = require('../lib/index.js');
      const models = Object.keys(MemServer.Models);

      assert.deepEqual(MemServer.DB, {});
      assert.deepEqual(MemServer.Server, {});
      assert.deepEqual(Object.keys(MemServer), ['DB', 'Server', 'Models', 'start', 'shutdown']);
      assert.deepEqual(models, ['PhotoComment', 'Photo', 'User']);
      models.forEach((modelName) => {
        const model = MemServer.Models[modelName];

        assert.equal(model.modelName, modelName);
        assert.deepEqual(Object.keys(MemServer.Models[modelName]), [
          'modelName', 'primaryKey', 'defaultAttributes', 'attributes', 'count', 'find', 'findBy',
          'findAll', 'insert', 'update', 'delete', 'embed', 'embedReferences', 'serializer',
          'serialize', 'getRelationship'
        ]);
      });
    });
  });
});
