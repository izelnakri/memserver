const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
                          export default Model({});`;

describe('MemServer.Model Serialize Interface', function() {
  before(function(done) {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');
    fs.mkdirSync(`./memserver/fixtures`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
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
    done();
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }
    done();
  });

  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  it('can serialize a model', function() {
    this.timeout(5000);

    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    const photo = Photo.find(1);
    const photoComment = PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' });

    assert.deepEqual(Photo.serialize(photo), {
      id: 1,
      name: 'Ski trip',
      href: 'ski-trip.jpeg',
      is_public: false
    });
    assert.deepEqual(PhotoComment.serialize(photoComment), {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29',
      content: 'Interesting indeed',
      photo_id: 2,
      user_id: 1
    });
  });

  it('can serialize models', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    const photos = Photo.findAll({ is_public: false });
    const photoComments = PhotoComment.findAll({ photo_id: 1 });

    assert.deepEqual(Photo.serialize(photos), [
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
    assert.deepEqual(PhotoComment.serialize(photoComments), [
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

  it('can serialize empty record and record arrays', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    const notFoundPhoto = Photo.find(99);
    const notFoundPhotos = Photo.findAll({ name: 'Wubba lubba dub' });
    const notFoundComment = PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' });
    const notFoundComments = Photo.findAll({ content: 'Aint easy' });

    assert.equal(Photo.serialize(notFoundPhoto), undefined);
    assert.deepEqual(Photo.serialize({}), {});
    assert.deepEqual(Photo.serialize(notFoundPhotos), []);
    assert.equal(PhotoComment.serialize(notFoundComment), undefined);
    assert.deepEqual(PhotoComment.serialize({}), {});
    assert.deepEqual(PhotoComment.serialize(notFoundComments), []);
  });

  it('can serialize embeded records recursively', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment, User } = MemServer.Models;

    MemServer.start();

    User.insert({ id: 1, first_name: 'Izel', last_name: 'Nakri' });
    User.insert({ id: 2, first_name: 'Benjamin', last_name: 'Graham' });
    Photo.embed({ comments: PhotoComment });
    PhotoComment.embed({ author: User });

    const firstComment = PhotoComment.findBy({ uuid: '499ec646-493f-4eea-b92e-e383d94182f4' });
    const firstPhoto = Photo.find(1);
    const targetSerializedUser = User.find(1);

    assert.deepEqual(targetSerializedUser, { id: 1, first_name: 'Izel', last_name: 'Nakri' });
    assert.deepEqual(User.serializer(targetSerializedUser), targetSerializedUser);
    assert.deepEqual(PhotoComment.serializer(firstComment), Object.assign({}, firstComment, {
      author: targetSerializedUser
    }));
    assert.deepEqual(Photo.serializer(firstPhoto), Object.assign({}, firstPhoto, {
      comments: PhotoComment.findAll({ photo_id: 1 }).map((comment) => {
        return Object.assign({}, comment, { author: User.find(comment.user_id) });
      })
    }));

    const targetUsers = User.findAll();
    const photoComments = PhotoComment.findAll();
    const targetPhotos = [Photo.find(1), Photo.find(2)];

    assert.deepEqual(User.findAll(), [
      { id: 1, first_name: 'Izel', last_name: 'Nakri' },
      { id: 2, first_name: 'Benjamin', last_name: 'Graham' }
    ]);
    assert.deepEqual(User.serializer(targetUsers), targetUsers);
    assert.deepEqual(PhotoComment.serializer(photoComments), photoComments.map((comment) => {
      return Object.assign({}, comment, { author: User.find(comment.user_id) });
    }));
    assert.deepEqual(Photo.serializer(targetPhotos), targetPhotos.map((photo) => {
      return Object.assign({}, PhotoComment.serializer(photo));
    }))
  });

  it('allows for custom serializer declarations', function() {
    const MemServer = require('../index.js');
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
    }

    assert.deepEqual(User.authenticationSerializer(user), { id: 1, first_name: 'Izel' });
    assert.deepEqual(User.authenticationSerializer([user, secondUser]), [
      { id: 1, first_name: 'Izel' }, { id: 2, first_name: 'Benjamin' }
    ])
  });
});
