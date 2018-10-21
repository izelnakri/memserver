import test from 'ava';
import fs from 'fs-extra';

const CWD = process.cwd();
const MODEL_FILE_CONTENT = `import Model from '${CWD}/lib/model';
                          export default Model({});`;

test.before(async () => {
  await fs.mkdir(`${CWD}/memserver`);
  await fs.mkdir(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/user.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/photo.js`, `
      import Model from '${CWD}/lib/model';

      export default Model({
        defaultAttributes: {
          is_public: true,
          name() {
            return 'Some default name';
          }
        }
      });
    `),
    fs.writeFile(`${CWD}/memserver/models/photo-comment.js`, `
      import Model from '${CWD}/lib/model';

      export default Model({
        defaultAttributes: {
          inserted_at() {
            return '2017-10-25T20:54:04.447Z';
          },
          is_important: true
        }
      });
    `),
    fs.writeFile(`${CWD}/memserver/server.js`, 'export default function(Models) {}'),
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
});

test.beforeEach(() => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.after.always(async () => {
  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }
});

test.serial('$Model.update(attributes) can update models', (t) => {
  t.plan(3);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  Photo.update({ id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false });
  Photo.update({ id: 2, href: 'family-photo-2.jpeg', is_public: false });
  PhotoComment.update({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Cool' });

  t.deepEqual(Photo.find(1), {
    id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false
  });
  t.deepEqual(Photo.find(2), {
    id: 2, name: 'Family photo', href: 'family-photo-2.jpeg', is_public: false
  });
  t.deepEqual(PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' }), {
    uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Cool', photo_id: 2, user_id: 1
  });
});

test.serial('$Model.update(attributes) throws an exception when updating a nonexistent model', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  const error = t.throws(() => Photo.update({ id: 99, href: 'family-photo-2.jpeg' }), Error);

  t.true(/\[MemServer\] Photo\.update\(record\) failed because Photo with id: 99 does not exist/.test(error.message));

  const secondError = t.throws(() => PhotoComment.update({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5666', content: 'Nice' }), Error);

  t.true(/\[MemServer\] PhotoComment\.update\(record\) failed because PhotoComment with uuid: 374c7f4a-85d6-429a-bf2a-0719525f5666 does not exist/.test(secondError.message));
});

test.serial('$Model.update(attributes) throws an exception when a model gets updated with an unknown $Model.attribute', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  const error = t.throws(() => Photo.update({ id: 1, name: 'ME', is_verified: false }), Error);

  t.true(/\[MemServer\] Photo\.update id: 1 fails, Photo model does not have is_verified attribute to update/.test(error.message));

  const secondError = t.throws(() => PhotoComment.update({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', location: 'Amsterdam' }), Error);

  t.true(/\[MemServer\] PhotoComment\.update uuid: 374c7f4a-85d6-429a-bf2a-0719525f5f29 fails, PhotoComment model does not have location attribute to update/.test(secondError.message));
});
