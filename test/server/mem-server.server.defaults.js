const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

process.setMaxListeners(0);

describe('MemServer.Server shortcut functionality', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
        defaultAttributes: {
          is_public: true,
          name() {
            return 'Some default name';
          }
        }
      });
    `);
    fs.mkdirSync(`./memserver/fixtures`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
      {
        id: 1,
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false,
        user_id: 1
      },
      {
        id: 2,
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true,
        user_id: 1
      },
      {
        id: 3,
        name: 'Selfie',
        href: 'selfie.jpeg',
        is_public: false,
        user_id: 1
      }
    ];`);
  });

  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }

    done();
  });

  describe('route shortcuts work', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        export default function(Models) {
          this.post('/photos');
          this.get('/photos');
          this.get('/photos/:id');
          this.put('/photos/:id');
          this.delete('/photos/:id');
        }
      `);
    });

    it('POST /resources work with shortcut', async function() {
      this.timeout(5000);

      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ photo: { name: 'Izel Nakri' }})
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 201);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(4)) });
        assert.equal(Photo.count(), 4);
        assert.deepEqual(Photo.find(4), {
          id: 4, name: 'Izel Nakri', is_public: true, href: null, user_id: null
        })
      });
    });

    it('GET /resources works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
        assert.equal(Photo.count(), 3);
      });
    });

    it('GET /resources/:id works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(1)) });
      });
    });

    it('PUT /resources/:id works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.find(1).name, 'Ski trip')

      await window.$.ajax({
        type: 'PUT', url: '/photos/1', headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ photo: { id: 1, name: 'New custom title'} })
      }, (data, textStatus, jqXHR) => {
        const photo = Photo.find(1);

        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(photo) });
        assert.equal(photo.name, 'New custom title');
      });
    });

    it('DELETE /resources/:id works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }, (data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 204);
        assert.deepEqual(data, {});
        assert.equal(Photo.count(), 2);
        assert.equal(PHoto.find(1), undefined);
      });
    });
  });

  it('throws an helpful error message when shortcuts model is not found', async function() {
    this.timeout(5000);

    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      export default function(Models) {
        this.post('/photos');
        this.get('/photos');
        this.get('/photos/:id');
        this.put('/photos/:id');
        this.delete('/photos/:id');

        this.get('/houses');
      }
    `);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    const MemServer = require('../../index.js');

    assert.throws(() => MemServer.start(), (err) => {
      return (err instanceof Error) &&
        /\[MemServer\] GET \/houses route handler cannot be generated automatically\: House is not a valid MemServer\.Model, please check that your route name matches the model reference or create a custom handler function/.test(err);
    });
  });

  describe('Server route handlers default responses', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        export default function(Models) {
          this.post('/photos', () => {});
          this.get('/photos', () => {});
          this.get('/photos/:id', () => {});
          this.put('/photos/:id', () => {});
          this.delete('/photos/:id', () => {});
        }
      `);
    });

    it('POST /resources works correctly with undefined handler response', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 500);
        assert.deepEqual(jqXHR.responseJSON, { error: '[MemServer] POST /photos route handler did not return anything to respond to the request!' });
        assert.equal(Photo.count(), 3);
      });
    });

    it('GET /resources works correctly with undefined handler response', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 500);
        assert.deepEqual(jqXHR.responseJSON, { error: '[MemServer] GET /photos route handler did not return anything to respond to the request!' });
      });
    });

    it('GET /resources/:id works correctly with undefined handler response', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 500);
        assert.deepEqual(jqXHR.responseJSON, { error: '[MemServer] GET /photos/1 route handler did not return anything to respond to the request!' });
      });
    });

    it('PUT /resources/:id works correctly with undefined handler response', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'PUT', url: '/photos/1', headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ photo: { id: 1, name: 'New Name' }})
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 500);
        assert.deepEqual(jqXHR.responseJSON, { error: '[MemServer] PUT /photos/1 route handler did not return anything to respond to the request!' });
      });
    });

    it('DELETE /resources/:id works correctly with undefined handler response', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 204);
        assert.deepEqual(jqXHR.responseJSON, {});
      });
    });
  });
});
