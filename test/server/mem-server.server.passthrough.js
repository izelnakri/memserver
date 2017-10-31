const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const sinon = require('sinon');
const express = require('express');
const cors = require('cors');

let actualServer;

describe('MemServer.Server general functionality', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({
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

    let app = express();

    app.use(cors());

    app.get('/films', (req, res) => {
      res.json({ film: 'responsed correctly' });
    });

    app.get('/movies/too-big-to-fail', (req, res) => {
      res.json({ movie: 'is too-big-to-fail' });
    });

    actualServer = app.listen(4000, () => console.log('Web server started on port 4000'));
  });

  beforeEach(function() {
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      import Response from '../lib/response';

      export default function({ Photo }) {
        this.get('/photos', () => {
          const photos = Photo.findAll();

          if (!photos || photos.length === 0) {
            return Response(404, { error: 'Not found' });
          }

          return { photos: Photo.serializer(photos) };
        });

        this.passthrough('/films');
        this.passthrough('http://localhost:4000/films');
        this.passthrough('http://localhost:4000/movies/*');
      }
    `);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }

    actualServer.close();
    done();
  });

  it('throws an error when MemServer tried to intercept an undeclared route', function() {
    const MemServer = require('../../lib/index.js');

    MemServer.start();
    MemServer.Server.unhandledRequest = sinon.spy();

    window.$.ajax({
      type: 'GET', url: '/izelnakri', headers: { 'Content-Type': 'application/json' }
    });

    assert.ok(MemServer.Server.unhandledRequest.calledOnce, 'MemServer.Server.unhandledRequest called once');
  });

  it('this.passthrough(url) shortcut works', async function() {
    const MemServer = require('../../lib/index.js');

    MemServer.start();

    await window.$.ajax({
      type: 'GET', url: 'http://localhost:4000/films', headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(jqXHR.responseJSON, { film: 'responsed correctly' });
    });
  });

  it('this.passthrough(url) shortcut works with wild cards', async function() {
    const MemServer = require('../../lib/index.js');

    MemServer.start();

    await window.$.ajax({
      type: 'GET', url: 'http://localhost:4000/movies/too-big-to-fail',
      headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(jqXHR.responseJSON, { movie: 'is too-big-to-fail' });
    });
  });

  describe('global passthrough feature', function() {
    beforeEach(function(done) {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        import Response from '../lib/response';

        export default function({ Photo }) {
          this.get('/photos', () => {
            const photos = Photo.findAll();

            if (!photos || photos.length === 0) {
              return Response(404, { error: 'Not found' });
            }

            return { photos: Photo.serializer(photos) };
          });

          this.passthrough();
        }
      `);

      Object.keys(require.cache).forEach((key) => delete require.cache[key]);

      done();
    });

    it('can create global passthrough via this.passthrough()', async function() {
      this.timeout(10000);

      Object.keys(require.cache).forEach((key) => delete require.cache[key]);

      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      MemServer.Server.unhandledRequest = sinon.spy();

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(jqXHR.responseJSON, { photos: Photo.serializer(Photo.findAll()) });
      });
      await window.$.ajax({
        type: 'GET', url: 'http://localhost:4000/films', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(jqXHR.responseJSON, { film: 'responsed correctly' });
      });
      await window.$.ajax({
        type: 'GET', url: 'http://localhost:4000/movies/too-big-to-fail',
        headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(jqXHR.responseJSON, { movie: 'is too-big-to-fail' });
      });
    });
  });

  // TODO: test this.passthrough('/something') when there is this.namespace;

  // NOTE: passthrough order? investigate
});
