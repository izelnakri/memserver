import test from 'ava';
import fs from 'fs-extra';

const CWD = process.cwd();
const MODEL_FILE_CONTENT = `import Model from '${CWD}/lib/model';
                          export default Model({});`;

test.before(async () => {
  await fs.mkdir(`${CWD}/memserver`);
  await fs.mkdir(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/photo.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/photo-comment.js`, MODEL_FILE_CONTENT),
    fs.writeFile(`${CWD}/memserver/models/user.js`, MODEL_FILE_CONTENT),
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

test.serial('$Model.serialize(model) serializes a model', (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  const photo = Photo.find(1);
  const photoComment = PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' });

  t.deepEqual(Photo.serialize(photo), {
    id: 1,
    name: 'Ski trip',
    href: 'ski-trip.jpeg',
    is_public: false
  });
  t.deepEqual(PhotoComment.serialize(photoComment), {
    uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29',
    content: 'Interesting indeed',
    photo_id: 2,
    user_id: 1
  });
});

test.serial('$Model.serialize(models) can serialize models', (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  const photos = Photo.findAll({ is_public: false });
  const photoComments = PhotoComment.findAll({ photo_id: 1 });

  t.deepEqual(Photo.serializer(photos), [
    {
      id: 1,
      name: 'Ski trip',
      href: 'ski-trip.jpeg',
      is_public: false
    },
    {
      id: 3,
      name: 'Selfie',
      href: 'selfie.jpeg',
      is_public: false
    }
  ]);
  t.deepEqual(PhotoComment.serializer(photoComments), [
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
    }
  ]);
});

test.serial('$Model.serialize() can serialize empty record and record arrays', (t) => {
  t.plan(6);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  const notFoundPhoto = Photo.find(99);
  const notFoundPhotos = Photo.findAll({ name: 'Wubba lubba dub' });
  const notFoundComment = PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' });
  const notFoundComments = Photo.findAll({ content: 'Aint easy' });

  t.is(Photo.serializer(notFoundPhoto), undefined);
  t.deepEqual(Photo.serializer({}), {
    id: null, href: null, is_public: null, name: null
  });
  t.deepEqual(Photo.serializer(notFoundPhotos), []);
  t.is(PhotoComment.serializer(notFoundComment), undefined);
  t.deepEqual(PhotoComment.serializer({}), {
    uuid: null, content: null, photo_id: null, user_id: null
  });
  t.deepEqual(PhotoComment.serializer(notFoundComments), []);
});

test.serial('$Model.serialize(model) can serialize embeded records recursively', (t) => {
  t.plan(8);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment, User } = MemServer.Models;

  MemServer.start();

  User.insert({ id: 1, first_name: 'Izel', last_name: 'Nakri' });
  User.insert({ id: 2, first_name: 'Benjamin', last_name: 'Graham' });
  Photo.embed({ comments: PhotoComment }); // this works
  PhotoComment.embed({ author: User }); // this doesnt work!?!?

  const firstComment = PhotoComment.findBy({ uuid: '499ec646-493f-4eea-b92e-e383d94182f4' });
  const firstPhoto = Photo.find(1);
  const targetSerializedUser = User.find(1);

  t.deepEqual(targetSerializedUser, { id: 1, first_name: 'Izel', last_name: 'Nakri' });
  t.deepEqual(User.serializer(targetSerializedUser), targetSerializedUser);
  t.deepEqual(PhotoComment.serializer(firstComment), Object.assign({}, firstComment, {
    author: targetSerializedUser
  }));
  t.deepEqual(Photo.serializer(firstPhoto), Object.assign({}, firstPhoto, {
    comments: PhotoComment.findAll({ photo_id: 1 }).map((comment) => {
      return Object.assign({}, comment, { author: User.find(comment.user_id) });
    })
  }));

  const targetUsers = User.findAll();
  const photoComments = PhotoComment.findAll();
  const targetPhotos = [Photo.find(1), Photo.find(2)];

  t.deepEqual(User.findAll(), [
    { id: 1, first_name: 'Izel', last_name: 'Nakri' },
    { id: 2, first_name: 'Benjamin', last_name: 'Graham' }
  ]);
  t.deepEqual(User.serializer(targetUsers), targetUsers);
  t.deepEqual(PhotoComment.serializer(photoComments), photoComments.map((comment) => {
    return Object.assign({}, comment, { author: User.find(comment.user_id) });
  }));
  t.deepEqual(Photo.serializer(targetPhotos), targetPhotos.map((photo) => {
    return Object.assign({}, photo, {
      comments: PhotoComment.findAll({ photo_id: photo.id }).map((comment) => {
        return Object.assign({}, comment, { author: User.find(comment.user_id) });
      })
    });
  }));
});

test.serial('$Model allows for custom serializer declarations', (t) => {
  const MemServer = require('../../lib/index.js');
  const { User } = MemServer.Models;

  MemServer.start();

  const user = User.insert({ id: 1, first_name: 'Izel', last_name: 'Nakri' });
  const secondUser = User.insert({ id: 2, first_name: 'Benjamin', last_name: 'Graham' });

  User.authenticationSerializer = function(user) {
    let serializedResponse = this.serializer(user);

    if (Array.isArray(serializedResponse)) {
      serializedResponse.forEach((serializedModel) => delete serializedModel.last_name);
    } else {
      delete serializedResponse.last_name;
    }

    return serializedResponse;
  };

  t.deepEqual(User.authenticationSerializer(user), { id: 1, first_name: 'Izel' });
  t.deepEqual(User.authenticationSerializer([user, secondUser]), [
    { id: 1, first_name: 'Izel' }, { id: 2, first_name: 'Benjamin' }
  ]);
});
