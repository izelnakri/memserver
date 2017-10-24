const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

process.setMaxListeners(0);

describe('MemServer.Model Query Interface', function() {
  before(function() {
    const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
                              export default Model({});`;

    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, modelFileContent);
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

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }
    done();
  });

  // NOTE: maybe needs to be inside the inner describe blocks
  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  it('find() throws without a number id or ids', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start()

    const array = [null, undefined, '', '1', true, {}];
    array.forEach((param) => {
      assert.throws(() => Photo.find(param), (err) => {
        return (err instanceof Error) &&
          /MemServer Photo.find\(id\) cannot be called without a valid id/.test(err);
      });
      assert.throws(() => PhotoComment.find(param), (err) => {
        return (err instanceof Error) &&
          /MemServer PhotoComment.find\(id\) cannot be called without a valid id/.test(err);
      });
    });
  });

  it('find(id) works for different models', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    assert.deepEqual(Photo.find(1), {
      id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false
    });
    assert.deepEqual(Photo.find(3), {
      id: 3, name: 'Selfie', href: 'selfie.jpeg', is_public: false
    });
  });

  it('find(ids) works for multiple ids', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    assert.deepEqual(Photo.find([1, 3]), [
      { id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false },
      { id: 3, name: 'Selfie', href: 'selfie.jpeg', is_public: false }
    ]);
    assert.deepEqual(Photo.find([2, 3]), [
      { id: 2, name: 'Family photo', href: 'family-photo.jpeg', is_public: true },
      { id: 3, name: 'Selfie', href: 'selfie.jpeg', is_public: false }
    ]);
  });

  it('findBy() throws without params', function() {
    const MemServer = require('../index.js');
    const { Photo } = MemServer.Models;

    MemServer.start();

    assert.throws(() => Photo.findBy(), (err) => {
      return (err instanceof Error) &&
        /MemServer Photo.findBy\(id\) cannot be called without a parameter/.test(err);
    });
  });

  it('findBy(options) returns a single model for the options', function() {
    const firstPhoto = { id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false };
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    assert.deepEqual(Photo.findBy({ is_public: false }), firstPhoto);
    assert.deepEqual(Photo.findBy(firstPhoto), firstPhoto);
    assert.deepEqual(Photo.findBy({ name: 'Family photo', href: 'family-photo.jpeg' }), {
      id: 2, name: 'Family photo', href: 'family-photo.jpeg', is_public: true
    });
    assert.deepEqual(PhotoComment.findBy({ uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3' }), {
      uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3',
      content: 'I was kidding',
      photo_id: 1,
      user_id: 1
    });
  });

  it('findAll() without parameters returns all the models in the database', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

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
      }
    ]);
    assert.deepEqual(PhotoComment.findAll(), [
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

  it('findAll(options) returns right models in the database', function() {
    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    MemServer.start();

    assert.deepEqual(Photo.findAll({ is_public: false }), [
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
    assert.deepEqual(PhotoComment.findAll({ photo_id: 1, user_id: 1 }), [
      {
        uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
        content: 'What a nice photo!',
        photo_id: 1,
        user_id: 1
      },
      {
        uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3',
        content: 'I was kidding',
        photo_id: 1,
        user_id: 1
      }
    ]);
    assert.deepEqual(PhotoComment.findAll({ user_id: 1 }), [
      {
        uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
        content: 'What a nice photo!',
        photo_id: 1,
        user_id: 1
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
});
