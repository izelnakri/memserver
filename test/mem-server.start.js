const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const sinon = require('sinon');

describe('MemServer start/stop functionality', function() {
  beforeEach(function() {
    this.timeout(5000);

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
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }
    done();
  });

  it('can be started without fixtures', function() {
    this.timeout(5000);

    const MemServer = require('../index.js');

    assert.deepEqual(MemServer.Server, {});

    MemServer.start();

    assert.deepEqual(Object.keys(MemServer.Server), [
      'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
      'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
      'running', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
    ]);
  });

  it('can be started with fixtures', function() {
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

    assert.deepEqual(MemServer.Server, {});
    assert.deepEqual(MemServer.DB, {});

    assert.deepEqual(Photo.findAll(), []);
    assert.deepEqual(PhotoComment.findAll(), []);

    MemServer.start();

    assert.deepEqual(Object.keys(MemServer.Server), [
      'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
      'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
      'running', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
    ]);
    assert.deepEqual(MemServer.DB, {
      Photo: Photo.findAll(), PhotoComment: PhotoComment.findAll(), User: []
    });
    assert.equal(Photo.primaryKey, 'id');
    assert.deepEqual(Photo.findAll().length, 3);
    assert.deepEqual(Photo.find(1), {
      id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false
    });

    assert.equal(PhotoComment.primaryKey, 'uuid');
    assert.deepEqual(PhotoComment.findAll().length, 4);
    assert.deepEqual(PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' }), {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed',
      photo_id: 2, user_id: 1
    });
  });

  it('can be shut down', () => {
    this.timeout(5000);

    const MemServer = require('../index.js');

    assert.deepEqual(MemServer.Server, {});

    MemServer.start();

    assert.deepEqual(Object.keys(MemServer.Server), [
      'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
      'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
      'running', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
    ]);

    MemServer.Server.shutdown = sinon.spy();
    MemServer.shutdown();

    assert.ok(MemServer.Server.shutdown.calledOnce, 'MemServer.shutdown() calls shutdown on Pretender instance');
  });

  it('can be shut down and started again with restarted state', () => {
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

    const MemServer = require('../index.js');
    const { Photo, PhotoComment } = MemServer.Models;

    assert.deepEqual(MemServer.Server, {});

    MemServer.start();

    assert.deepEqual(Object.keys(MemServer.Server), [
      'hosts', 'handlers', 'handledRequests', 'passthroughRequests', 'unhandledRequests',
      'requestReferences', 'forcePassthrough', 'disableUnhandled', '_nativeXMLHttpRequest',
      'running', 'handledRequest', 'passthroughRequest', 'unhandledRequest', 'passthrough'
    ]);

    const initialPhotos = Photo.findAll();
    const initialPhotoComments = PhotoComment.findAll();

    assert.equal(initialPhotos.length, 3);
    assert.equal(initialPhotoComments.length, 4);

    Photo.insert({ id: 55, name: 'Great another photo' });
    PhotoComment.insert({ uuid: '21f5ef47-332a-4d68-91b8-b7e13aa2f941', content: 'interesting photo indeed' });
    Photo.insert({ id: 56, name: 'one more' });
    Photo.insert({ id: 57, name: 'another' });

    assert.equal(Photo.findAll().length, 6);
    assert.equal(PhotoComment.findAll().length, 5);

    MemServer.shutdown();
    MemServer.start();

    assert.deepEqual(Photo.findAll(), initialPhotos);
    assert.deepEqual(PhotoComment.findAll(), initialPhotoComments);
  });
});
