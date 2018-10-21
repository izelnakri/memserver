import test from 'ava';
import fs from 'fs-extra';

const CWD = process.cwd();
const MODEL_FILE_CONTENT = `import Model from '${process.cwd()}/lib/model';
                          export default Model({});`;

test.before(async () => {
  await fs.mkdir(`${CWD}/memserver`);
  await fs.mkdir(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/photo.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/user.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/server.js`, `
      const Response = require('../lib/response').default;

      export default function(Models) {
        const { Photo } = Models;

        this.get('/photos', () => {
          const photos = Photo.findAll();

          return Response(202, { photos: Photo.serializer(photos) });
        });
      }`),
    fs.mkdir(`${CWD}/memserver/fixtures`)
  ]);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/fixtures/photos.js`, `export default [
      {
        id: 1,
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      },
      {
        id: 2,
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      },
      {
        id: 3,
        name: 'Selfie',
        href: 'selfie.jpeg',
        is_public: false
      }
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        first_name: 'Izel',
        last_name: 'Nakri'
      }
    ]`)
  ]);
});

test.after.always(async () => {
  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }
});

test.beforeEach(() => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.serial.cb('MemServer.Response can be used outside the server file', (t) => {
  t.plan(2);

  const MemServer = require('../lib/index.js');
  const Response = require('../lib/response.js').default;

  MemServer.start();
  window.$ = require('jquery');

  const { Server } = MemServer;
  const { User } = MemServer.Models;

  Server.get('/users/:id', (request) => {
    const user = User.find(Number(request.params.id));

    if (user) {
      return Response(200, { user: User.serializer(user) });
    }
  });

  window.$.getJSON('/users/1', (data, textStatus, jqXHR) => {
    t.is(jqXHR.status, 200);
    t.deepEqual(data, { user: { id: 1, first_name: 'Izel', last_name: 'Nakri' } });

    t.end();
  });
});

test.serial.cb('MemServer.Response can be used inside the server file', (t) => {
  t.plan(2);

  const MemServer = require('../lib/index.js');

  MemServer.start();
  window.$ = require('jquery');

  const { Photo } = MemServer.Models;

  window.$.getJSON('/photos', (data, textStatus, jqXHR) => {
    t.is(jqXHR.status, 202);
    t.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });

    t.end();
  });
});

test.serial.cb('MemServer.Response can be used when overwriting an existing server route', (t) => {
  t.plan(2);

  const MemServer = require('../lib/index.js');
  const Response = require('../lib/response.js').default;

  MemServer.start();
  window.$ = require('jquery');

  const { Server } = MemServer;

  Server.get('/photos', () => Response(500, { error: 'Internal Server Error'} ));

  window.$.getJSON('/photos').fail((jqXHR) => {
    t.is(jqXHR.status, 500);
    t.deepEqual(jqXHR.responseJSON, { error: 'Internal Server Error' });

    t.end();
  });
});
