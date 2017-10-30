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
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
        defaultAttributes: {
          inserted_at() {
            return '2017-10-25T20:54:04.447Z';
          },
          is_important: true
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
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photo-comments.js`, `export default [
      {
        uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
        content: 'What a nice photo!',
        photo_id: 1,
        user_id: 1
      },
      {
        uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7',
        content: 'I agree',
        photo_id: 1,
        user_id: 2
      },
      {
        uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3',
        content: 'I was kidding',
        photo_id: 1,
        user_id: 1
      },
      {
        uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29',
        content: 'Interesting indeed',
        photo_id: 2,
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
      import Response from '../lib/mem-server/response';

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
    const MemServer = require('../../index.js');

    MemServer.start();
    MemServer.Server.unhandledRequest = sinon.spy();

    window.$.ajax({
      type: 'GET', url: '/izelnakri', headers: { 'Content-Type': 'application/json' }
    });

    assert.ok(MemServer.Server.unhandledRequest.calledOnce, 'MemServer.Server.unhandledRequest called once');
  });

  it('this.passthrough(url) shortcut works', async function() {
    const MemServer = require('../../index.js');

    MemServer.start();

    await window.$.ajax({
      type: 'GET', url: 'http://localhost:4000/films', headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(jqXHR.responseJSON, { film: 'responsed correctly' });
    });
  });

  it('this.passthrough(url) shortcut works with wild cards', async function() {
    const MemServer = require('../../index.js');

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
        import Response from '../lib/mem-server/response';

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
      this.timeout(5000);

      Object.keys(require.cache).forEach((key) => delete require.cache[key]);

      const MemServer = require('../../index.js');
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

  // NOTE: passthrough order? investigate

  // TODO: test this.passthrough('/something') when there is this.namespace;
});
