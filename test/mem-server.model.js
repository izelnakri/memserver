const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Model Interface', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import faker from 'faker';
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
        defaultAttributes: {
          is_public: true,
          name() {
            return faker.name.title();
          }
        }
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `
      import moment from 'moment';
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
        defaultAttributes: {
          inserted_at() {
            return moment().toJSON();
          },
          is_important: true
        }
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({});
    `);
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
  });

  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
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

  describe('$Model interface', function() {
    it('sets modelNames correctly', function() {
      this.timeout(5000);

      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      assert.equal(Photo.modelName, 'Photo');
      assert.equal(PhotoComment.modelName, 'PhotoComment');

      MemServer.start();

      assert.equal(Photo.modelName, 'Photo');
      assert.equal(PhotoComment.modelName, 'PhotoComment');
    });

    it('sets primaryKeys correctly', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment, User } = MemServer.Models;

      assert.equal(Photo.primaryKey, null);
      assert.equal(PhotoComment.primaryKey, null);
      assert.equal(User.primaryKey, null);

      MemServer.start();

      assert.equal(Photo.primaryKey, 'id');
      assert.equal(PhotoComment.primaryKey, 'uuid');
      assert.equal(User.primaryKey, null);
    });

    it('reads the defaultAttributes correctly', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment, User } = MemServer.Models;
      const initialPhotoDefaultAttributes = Photo.defaultAttributes;
      const initialPhotoCommentDefaultAttributes = PhotoComment.defaultAttributes;

      assert.deepEqual(Object.keys(initialPhotoDefaultAttributes), ['is_public', 'name']);
      assert.equal(initialPhotoDefaultAttributes.is_public, true);
      assert.ok(initialPhotoDefaultAttributes.name.toString().includes('name.title();'));

      assert.deepEqual(Object.keys(initialPhotoCommentDefaultAttributes), ['inserted_at', 'is_important']);
      assert.ok(initialPhotoCommentDefaultAttributes.inserted_at.toString().includes('.toJSON();'));
      assert.equal(initialPhotoCommentDefaultAttributes.is_important, true);
      assert.deepEqual(User.defaultAttributes, {});

      MemServer.start();

      assert.equal(Photo.defaultAttributes, initialPhotoDefaultAttributes);
      assert.deepEqual(PhotoComment.defaultAttributes, initialPhotoCommentDefaultAttributes);
      assert.deepEqual(User.defaultAttributes, {});
    });

    it('sets attributes correctly', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment, User } = MemServer.Models;

      assert.deepEqual(Photo.attributes, ['is_public', 'name']);
      assert.deepEqual(PhotoComment.attributes, ['inserted_at', 'is_important']);
      assert.deepEqual(User.attributes, []);

      MemServer.start();

      assert.deepEqual(Photo.attributes, ['is_public', 'name', 'id', 'href']);
      assert.deepEqual(PhotoComment.attributes, ['inserted_at', 'is_important', 'uuid', 'content', 'photo_id', 'user_id']);
      assert.deepEqual(User.attributes, []);
    });

    it('counts the models correctly with $Model.count()', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment, User } = MemServer.Models;

      assert.equal(Photo.count(), 0);
      assert.equal(PhotoComment.count(), 0);

      MemServer.start();

      assert.equal(Photo.count(), 3);
      assert.equal(PhotoComment.count(), 4);
    });

    // TODO: it('can have custom queries for a Model', function() {
    //
    // });
  });
});

// describe('update factory interface');
// describe('delete factory interface');
// describe('serialization interface');
