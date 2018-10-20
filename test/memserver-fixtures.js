import test from 'ava';
import fs from 'fs-extra';

const CWD = process.cwd();
const MODEL_FILE_CONTENT = `import Model from '${process.cwd()}/lib/model';
                          export default Model({});`;

test.beforeEach(async (t) => {
  await fs.mkdirp(`${CWD}/memserver`);
  await fs.mkdirp(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/photo.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/user.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/photo-comment.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/server.js`, 'export default function(Models) {}')
  ]);

  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.afterEach.always(async () => { // NOTE: maybe remove require cache if needed
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }
});

test.serial('MemServer fixtures should throw error if any of the fixtures missing id or uuid', async (t) => {
  t.plan(10);

  if (!await fs.exists(`${CWD}/memserver/fixtures`)) {
    await fs.mkdir(`${CWD}/memserver/fixtures`);
  }

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
        content: 'What a nice photo!',
        photo_id: 1,
        user_id: 1
      },
      {
        content: 'I agree',
        photo_id: 1,
        user_id: 2
      },
      {
        content: 'I was kidding',
        photo_id: 1,
        user_id: 1
      },
      {
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

  const error = t.throws(() => MemServer.start(), Error);

  t.true(/\[MemServer\] DATABASE ERROR: At least one of your PhotoComment fixtures missing a primary key\. Please make sure all your PhotoComment fixtures have either id or uuid primaryKey/.test(error.message))

  t.deepEqual(MemServer.Server, {});
  t.deepEqual(MemServer.DB, {});
  t.deepEqual(Photo.findAll(), []);
  t.deepEqual(PhotoComment.findAll(), []);
});

test.serial('MemServer fixtures should throw error if any of the id fixtures have an incorrect type', async (t) => {
  t.plan(10);

  await fs.mkdirp(`${CWD}/memserver/fixtures`);
  await Promise.all([
    fs.writeFile(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
      {
        id: 1,
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      },
      {
        id: '2',
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
    fs.writeFile(`${process.cwd()}/memserver/fixtures/photo-comments.js`, `export default [
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

  const error = t.throws(() => MemServer.start(), Error);

  t.true(/\[MemServer\] Photo model primaryKey type is 'id'\. Instead you've tried to enter id: 2 with string type/.test(error.message));
  t.deepEqual(MemServer.Server, {});
  t.deepEqual(MemServer.DB, {});
  t.deepEqual(Photo.findAll(), []);
  t.deepEqual(PhotoComment.findAll(), []);
});

test('MemServer fixtures should throw error if any of the uuid fixtures have an incorrect type', async (t) => {
  t.plan(10);

  await fs.mkdirp('./memserver/fixtures');
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
        uuid: 12,
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

  const error = t.throws(() => MemServer.start(), Error);

  t.true(/\[MemServer\] PhotoComment model primaryKey type is 'uuid'. Instead you've tried to enter uuid: 12 with number type/.test(error.message))

  t.deepEqual(MemServer.Server, {});
  t.deepEqual(MemServer.DB, {});
  t.deepEqual(Photo.findAll(), []);
  t.deepEqual(PhotoComment.findAll(), []);
});

test.serial('MemServer fixtures should throw error if there are duplicate id fixtures', async (t) => {
  t.plan(2);

  await fs.mkdirp(`${CWD}/memserver/fixtures`);
  await fs.writeFile(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
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
      id: 2,
      name: 'Selfie',
      href: 'selfie.jpeg',
      is_public: false
    }
  ];`);

  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  const MemServer = require('../lib/index.js');

  const error = t.throws(() => MemServer.start(), Error);

  t.true(/\[MemServer\] DATABASE ERROR: Duplication in Photo fixtures with id: 2/.test(error.message));
});

test.serial('MemServer fixtures should throw error if there are duplicate uuid fixtures', async (t) => {
  t.plan(2);

  await fs.mkdirp('./memserver/fixtures');
  await fs.writeFile(`${process.cwd()}/memserver/fixtures/photo-comments.js`, `export default [
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
      uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
      content: 'Interesting indeed',
      photo_id: 2,
      user_id: 1
    }
  ];`);

  const MemServer = require('../lib/index.js');

  const error = t.throws(() => MemServer.start(), Error);

  t.true(/\[MemServer\] DATABASE ERROR: Duplication in PhotoComment fixtures with uuid: 499ec646-493f-4eea-b92e-e383d94182f4/.test(error.message));
});
