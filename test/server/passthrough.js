import test from 'ava';
import cors from 'cors';
import express from 'express';
import fs from 'fs-extra';
import sinon from 'sinon';

let actualServer;

const AUTHENTICATION_TOKEN = 'ec25fc7b-6ee2-4bda-b57c-6c9867b30ff4';
const AJAX_AUTHORIZATION_HEADERS = {
  'Content-Type': 'application/json', 'Authorization': `Token ${AUTHENTICATION_TOKEN}`
};
const CWD = process.cwd();

test.before(async () => {
  await fs.mkdir(`${CWD}/memserver`);
  await fs.mkdir(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/photo.js`, `
    import Model from '${CWD}/lib/model';

    export default Model({
    });`),
    fs.mkdir(`${CWD}/memserver/fixtures`)
  ]);
  await fs.writeFile(`${CWD}/memserver/fixtures/photos.js`, `export default [
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

  const app = express();

  app.use(cors());

  app.get('/films', (req, res) => {
    res.json({ film: 'responsed correctly' });
  });

  app.get('/movies/too-big-to-fail', (req, res) => {
    res.json({ movie: 'is too-big-to-fail' });
  });

  actualServer = app.listen(4000, () => console.log('Web server started on port 4000'));
});

test.beforeEach(async () => {
  await fs.writeFile(`${CWD}/memserver/server.js`, `
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

test.after.always(async () => {
  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }

  actualServer.close();
});

test.serial('[MemServer.Server] throws an error when MemServer tried to intercept an undeclared route', (t) => {
  t.plan(1);

  const MemServer = require('../../lib/index.js');

  MemServer.start();
  MemServer.Server.unhandledRequest = sinon.spy();
  window.$ = require('jquery');

  window.$.ajax({
    type: 'GET', url: '/izelnakri', headers: { 'Content-Type': 'application/json' }
  });

  t.true(MemServer.Server.unhandledRequest.calledOnce, 'MemServer.Server.unhandledRequest called once');
});

test.serial('[MemServer.Server] this.passthrough(url) shortcut works', async (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');

  MemServer.start();
  window.$ = require('jquery');

  await window.$.ajax({
    type: 'GET', url: 'http://localhost:4000/films', headers: { 'Content-Type': 'application/json' }
  }).then((data, textStatus, jqXHR) => {
    t.is(jqXHR.status, 200);
    t.deepEqual(jqXHR.responseJSON, { film: 'responsed correctly' });
  });
});


test.serial('[MemServer.Server] this.passthrough(url) shortcut works with wild cards', async (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');

  MemServer.start();
  window.$ = require('jquery');

  await window.$.ajax({
    type: 'GET', url: 'http://localhost:4000/movies/too-big-to-fail',
    headers: { 'Content-Type': 'application/json' }
  }).then((data, textStatus, jqXHR) => {
    t.is(jqXHR.status, 200);
    t.deepEqual(jqXHR.responseJSON, { movie: 'is too-big-to-fail' });
  });
});

// TODO: TEST BELOW ISNT WORKING: has beforeEach!! afterwards
// test.serial('[MemServer.Server] can create global passthrough via this.passthrough()', async (t) => {
//   t.plan(6);
//
//   Object.keys(require.cache).forEach((key) => delete require.cache[key]);
//
//   await writeGlobalPassthroughServerFile();
//
//   const MemServer = require('../../lib/index.js');
//   const { Photo } = MemServer.Models;
//
//   MemServer.start();
//   MemServer.Server.unhandledRequest = sinon.spy();
//   window.$ = require('jquery');
//
//   await window.$.ajax({
//     type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
//   }).then((data, textStatus, jqXHR) => {
//     t.is(jqXHR.status, 200);
//     t.deepEqual(jqXHR.responseJSON, { photos: Photo.serializer(Photo.findAll()) });
//   });
//   await window.$.ajax({
//     type: 'GET', url: 'http://localhost:4000/films', headers: { 'Content-Type': 'application/json' }
//   }).then((data, textStatus, jqXHR) => {
//     t.equal(jqXHR.status, 200);
//     t.deepEqual(jqXHR.responseJSON, { film: 'responsed correctly' });
//   });
//   await window.$.ajax({
//     type: 'GET', url: 'http://localhost:4000/movies/too-big-to-fail',
//     headers: { 'Content-Type': 'application/json' }
//   }).then((data, textStatus, jqXHR) => {
//     t.is(jqXHR.status, 200);
//     t.deepEqual(jqXHR.responseJSON, { movie: 'is too-big-to-fail' });
//   });
// });

// TODO: test this.passthrough('/something') when there is this.namespace;

// NOTE: passthrough order? investigate

async function writeGlobalPassthroughServerFile() {
  await fs.writeFile(`${CWD}/memserver/server.js`, `
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
}
