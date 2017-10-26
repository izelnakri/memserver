const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const moment = require('moment');

const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
                          export default Model({});`;

describe('MemServer.Model Insert Interface', function() {
  before(function(done) {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
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

  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

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
  });

  afterEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }
    done();
  });

  describe('$Model.insert() factory interface', function() {
    it('$Model.insert() will insert an empty model and auto-generate primaryKeys', function() {
      this.timeout(5000);

      fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
      fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, modelFileContent);

      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      assert.deepEqual(Photo.findAll().map((photo) => photo.id), [1, 2, 3]);

      Photo.insert();

      assert.deepEqual(Photo.findAll().map((photo) => photo.id), [1, 2, 3, 4])

      Photo.insert();

      assert.equal(Photo.count(), 5);
      assert.deepEqual(Photo.findAll(), [
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
        },
        {
          id: 4,
          href: undefined,
          is_public: undefined,
          name: undefined
        },
        {
          id: 5,
          href: undefined,
          is_public: undefined,
          name: undefined
        }
      ]);

      const initialCommentUUIDs = PhotoComment.findAll().map((photoComment) => photoComment.uuid);

      assert.deepEqual(initialCommentUUIDs, [
        '499ec646-493f-4eea-b92e-e383d94182f4', '77653ad3-47e4-4ec2-b49f-57ea36a627e7',
        'd351963d-e725-4092-a37c-1ca1823b57d3', '374c7f4a-85d6-429a-bf2a-0719525f5f29'
      ]);

      PhotoComment.insert();

      const allPhotoComments = PhotoComment.findAll();
      const lastPhotoComment = allPhotoComments[allPhotoComments.length - 1];

      assert.equal(PhotoComment.count(), 5);
      assert.ok(!initialCommentUUIDs[lastPhotoComment.uuid], 'inserted comment has a unique uuid');
    });

    it('$Model.insert() will insert a model with defaultAttributes and auto-generated primaryKey', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      Photo.insert();
      Photo.insert();

      assert.equal(Photo.count(), 5);
      assert.deepEqual(Photo.findAll(), [
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
        },
        {
          id: 4,
          href: undefined,
          is_public: true,
          name: 'Some default name'
        },
        {
          id: 5,
          href: undefined,
          is_public: true,
          name: 'Some default name'
        }
      ]);

      const initialCommentUUIDs = PhotoComment.findAll().map((comment) => comment.uuid);

      PhotoComment.insert();
      PhotoComment.insert();

      assert.equal(PhotoComment.count(), 6);

      const allComments = PhotoComment.findAll();
      const lastInsertedComments = allComments.slice(4, allComments.length);

      lastInsertedComments.forEach((comment) => {
        assert.ok(!initialCommentUUIDs.includes(comment.uuid), 'inserted comment uuid is unique');
        assert.equal(comment.is_important, true);
        assert.equal(comment.inserted_at, '2017-10-25T20:54:04.447Z');
      });
    });

    it('$Model.insert(options) will insert a model with overriden attributes', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      Photo.insert({ id: 99, href: '/izel.html', is_public: false });
      Photo.insert({ name: 'Baby photo', href: '/baby.jpg' });

      assert.equal(Photo.count(), 5);
      assert.deepEqual(Photo.findAll(), [
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
        },
        {
          id: 99,
          href: '/izel.html',
          is_public: false,
          name: 'Some default name'
        },
        {
          id: 4,
          href: '/baby.jpg',
          is_public: true,
          name: 'Baby photo'
        }
      ]);

      const initialCommentUUIDs = PhotoComment.findAll().map((comment) => comment.uuid);

      const commentOne = PhotoComment.insert({
        inserted_at: '2015-10-25T20:54:04.447Z', photo_id: 1
      });
      const commentTwo = PhotoComment.insert({
        uuid: '6401f27c-49aa-4da7-9835-08f6f669e29f', is_important: false
      });

      assert.equal(PhotoComment.count(), 6);

      const allComments = PhotoComment.findAll();
      const lastInsertedComments = allComments.slice(4, allComments.length);

      assert.ok(allComments.includes(commentOne), 'first comment insert is in the database');
      assert.ok(allComments.includes(commentTwo), 'second comment insert is in the database');

      assert.equal(commentOne.inserted_at, '2015-10-25T20:54:04.447Z');
      assert.equal(commentOne.photo_id, 1);
      assert.equal(commentOne.is_important, true);
      assert.equal(commentTwo.uuid, '6401f27c-49aa-4da7-9835-08f6f669e29f');
      assert.equal(commentTwo.inserted_at, '2017-10-25T20:54:04.447Z');
      assert.equal(commentTwo.photo_id, undefined);
      assert.equal(commentTwo.is_important, false);

      lastInsertedComments.forEach((comment) => {
        assert.ok(!initialCommentUUIDs.includes(comment.uuid), 'inserted comment uuid is unique');
      });
    });

    it('$Model.insert(options) will throw if overriden primaryKey already exists', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      assert.throws(() => Photo.insert({ id: 1 }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Photo id 1 already exists in the database! Photo.insert\(\{ id: 1 \}\) fails/.test(err);
      });
      assert.throws(() => PhotoComment.insert({ uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3' }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] PhotoComment uuid d351963d-e725-4092-a37c-1ca1823b57d3 already exists in the database! PhotoComment.insert\(\{ uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3' \}\) fails/.test(err);
      });
    });

    it('$Model.insert(options) will throw if overriden primaryKey is wrong type', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      assert.throws(() => Photo.insert({ id: '99' }), (err) => {
        return (err instanceof Error) &&
          /MemServer Photo model primaryKey type is 'id'. Instead you've tried to enter id: 99 with string type/.test(err);
      });
      assert.throws(() => PhotoComment.insert({ uuid: 1 }), (err) => {
        return (err instanceof Error) &&
          /MemServer PhotoComment model primaryKey type is 'uuid'. Instead you've tried to enter uuid: 1 with number type/.test(err);
      });
    });
  });

  it('can add new values to $Model.attributes when new attributes are discovered', function() {
    this.timeout(5000);

    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    Photo.insert({ published_at: moment('2017-10-10').toJSON(), description: 'Some description' });
    Photo.insert({ location: 'Istanbul', is_public: false });
    PhotoComment.insert({ updated_at: moment('2017-01-10').toJSON(), like_count: 22 });
    PhotoComment.insert({ reply_id: 1 });

    assert.deepEqual(Photo.attributes, [
      'is_public', 'name', 'id', 'href', 'published_at', 'description', 'location'
    ]);
    assert.deepEqual(PhotoComment.attributes, [
      'inserted_at', 'is_important', 'uuid', 'content', 'photo_id', 'user_id', 'updated_at',
      'like_count', 'reply_id'
    ]);
    assert.deepEqual(Photo.findAll(), [
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
      },
      {
        id: 4,
        href: undefined,
        is_public: true,
        published_at: '2017-10-09T22:00:00.000Z',
        description: 'Some description',
        name: 'Some default name'
      },
      {
        id: 5,
        href: undefined,
        is_public: false,
        location: 'Istanbul',
        published_at: undefined,
        name: 'Some default name',
        description: undefined
      }
    ]);
  });
});
