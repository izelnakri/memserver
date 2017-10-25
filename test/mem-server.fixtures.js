const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer fixture constraint feature', function() {
  beforeEach(function() {
    const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
                              export default Model({});`;

    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  afterEach(function(done) {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }

    done();
  });

  it('should throw error if any of the fixtures missing id or uuid', function() {
    this.timeout(5000);

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
    ];`);

    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    assert.deepEqual(MemServer.Pretender, {});
    assert.deepEqual(MemServer.DB, {});

    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);

    assert.throws(() => MemServer.start(), (err) => {
      return (err instanceof Error) &&
        /MemServer DATABASE ERROR\: At least one of your PhotoComment fixtures missing a primary key\. Please make sure all your PhotoComment fixtures have either id or uuid primaryKey/.test(err);
    });

    assert.deepEqual(MemServer.Pretender, {});
    assert.deepEqual(MemServer.DB, {});
    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);
  });

  it('should throw error if any of the id fixtures have an incorrect type', function() {
    fs.mkdirSync(`./memserver/fixtures`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
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

    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    assert.deepEqual(MemServer.Pretender, {});
    assert.deepEqual(MemServer.DB, {});

    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);

    assert.throws(() => MemServer.start(), (err) => {
      return (err instanceof Error) &&
        /MemServer Photo model primaryKey type is 'id'. Instead you've tried to enter id: 2 with string type/.test(err);
    });

    assert.deepEqual(MemServer.Pretender, {});
    assert.deepEqual(MemServer.DB, {});
    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);
  });

  it('should throw error if any of the uuid fixtures have an incorrect type', function() {
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
        uuid: 12,
        content: 'Interesting indeed',
        photo_id: 2,
        user_id: 1
      }
    ];`);

    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    assert.deepEqual(MemServer.Pretender, {});
    assert.deepEqual(MemServer.DB, {});

    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);

    assert.throws(() => MemServer.start(), (err) => {
      return (err instanceof Error) &&
        /MemServer PhotoComment model primaryKey type is 'uuid'. Instead you've tried to enter uuid: 12 with number type/.test(err);
    });

    assert.deepEqual(MemServer.Pretender, {});
    assert.deepEqual(MemServer.DB, {});
    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);
  });
});

// TODO: throw if there are duplicates of the same id or uuid
