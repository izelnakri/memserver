import test from 'ava';
import fs from 'fs-extra';
import sinon from 'sinon';

const CWD = process.cwd();
const MODEL_FILE_CONTENT = `import Model from '${CWD}/lib/model';
                          export default Model({});`;

test.beforeEach(async () => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  await fs.mkdir(`${CWD}/memserver`);
  await fs.mkdir(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/photo.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/user.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/photo-comment.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/server.js`, 'export default function(Models) {}')
  ]);
});

test.afterEach.always(async () => {
  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }
});

test.serial('MemServer can be started without fixtures', (t) => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  const MemServer = require('../lib/index.js');

  t.deepEqual(MemServer.Server, {});

  MemServer.start();

  t.deepEqual(Object.keys(MemServer.Server), [
    'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
    'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
    'running', 'ctx', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
  ]);
});

test.serial('MemServer can be started with fixtures', async (t) => {
  t.plan(12);

  await fs.mkdir(`${CWD}/memserver/fixtures`);
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
    fs.writeFile(`${CWD}/memserver/fixtures/photo-comments.js`, `export default [
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
    ];`)
  ]);

  const MemServer = require('../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  t.deepEqual(MemServer.Server, {});
  t.deepEqual(MemServer.DB, {});

  t.deepEqual(Photo.findAll(), []);
  t.deepEqual(PhotoComment.findAll(), []);

  MemServer.start();

  t.deepEqual(Object.keys(MemServer.Server), [
    'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
    'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
    'running', 'ctx', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
  ]);
  t.deepEqual(MemServer.DB, {
    Photo: Photo.findAll(), PhotoComment: PhotoComment.findAll(), User: []
  });
  t.is(Photo.primaryKey, 'id');
  t.deepEqual(Photo.findAll().length, 3);
  t.deepEqual(Photo.find(1), {
    id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false
  });

  t.is(PhotoComment.primaryKey, 'uuid');
  t.deepEqual(PhotoComment.findAll().length, 4);
  t.deepEqual(PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' }), {
    uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed',
    photo_id: 2, user_id: 1
  });
});

test('MemServer can be shut down', (t) => {
  const MemServer = require('../lib/index.js');

  t.deepEqual(MemServer.Server, {});

  MemServer.start();

  t.deepEqual(Object.keys(MemServer.Server), [
    'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
    'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
    'running', 'ctx', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
  ]);

  MemServer.Server.shutdown = sinon.spy();
  MemServer.shutdown();

  t.true(MemServer.Server.shutdown.calledOnce, 'MemServer.shutdown() calls shutdown on Pretender instance');
});

test.serial('MemServer can be shut down and started again with restarted INITIAL STATE, NO MUTATION', async (t) => {
  t.plan(8);

  await fs.mkdir(`${CWD}/memserver/fixtures`);
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
    fs.writeFile(`${CWD}/memserver/fixtures/photo-comments.js`, `export default [
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
    ];`)
  ]);

  const MemServer = require('../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  t.deepEqual(MemServer.Server, {});

  MemServer.start();

  t.deepEqual(Object.keys(MemServer.Server), [
    'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
    'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
    'running', 'ctx', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
  ]);

  const initialPhotos = Photo.findAll();
  const initialPhotoComments = PhotoComment.findAll();

  t.is(initialPhotos.length, 3);
  t.is(initialPhotoComments.length, 4);

  Photo.insert({ id: 55, name: 'Great another photo' });
  PhotoComment.insert({ uuid: '21f5ef47-332a-4d68-91b8-b7e13aa2f941', content: 'interesting photo indeed' });
  Photo.insert({ id: 56, name: 'one more' });
  Photo.insert({ id: 57, name: 'another' });

  t.is(Photo.findAll().length, 6);
  t.is(PhotoComment.findAll().length, 5);

  Photo.update({ id: 1, name: 'Mutated photo name' });
  Photo.update({ id: 2, name: 'Another mutated photo name' });
  PhotoComment.update({
    uuid: '499ec646-493f-4eea-b92e-e383d94182f4', content: 'Mutated photo comment'
  });

  MemServer.shutdown();
  MemServer.start();

  t.deepEqual(Photo.findAll(), [
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
  ]);
  t.deepEqual(PhotoComment.findAll(), [
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
  ]);
});
