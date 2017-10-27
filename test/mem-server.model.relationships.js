const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Model Relationships Interface', function() {
  before(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({});
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/activity.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
      });
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
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/activities.js`, `export default [
      {
        id: 1,
        user_id: 1,
        photo_id: 1
      },
      {
        id: 2,
        user_id: 1,
        photo_id: null
      }
    ];`);
  });

  beforeEach(function(done) {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
    done();
  });

  afterEach(function(done) {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
    done();
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }

    done();
  });

  // it('can register relationship embeds before runtime', function() {
  //   const MemServer = require('../index.js');
  //   const { Photo, PhotoComment } = MemServer.Models;
  //
  //   MemServer.start();
  //
  //
  // });

  // it('can register relationships embeds during runtime', function() {
  //
  // });

  it('works for hasOne/belongsTo relationships both sides', function() {
    const MemServer = require('../index.js');
    const { Photo, Activity } = MemServer.Models;

    MemServer.start();

    const activity = Photo.getRelationship(Photo.find(1), 'activity');

    assert.deepEqual(activity, [{ id: 1, user_id: 1, photo_id: 1 }]);
    assert.deepEqual(Photo.getRelationship(Photo.find(2), 'activity'), null);
    assert.deepEqual(Activity.getRelationship(activity, 'photo'), [
      { id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false }
    ]);
    assert.deepEqual(Activity.getRelationship(Activity.find(2), 'photo'), null);
  });

  // it('works for hasMany/belongsTo relationships both side', function() {
  //   const MemServer = require('../index.js');
  //   const { Photo, PhotoComment } = MemServer.Models;
  //
  //   MemServer.start();
  //
  //   const firstPhotoComments = Photo.getRelationship(Photo.find(1), 'comments');
  //   const secondPhotoComments = Photo.getRelationship(Photo.find(2), 'comments');
  //   const thirdPhotoComments = Photo.getRelationship(Photo.find(3), 'comments');
  //
  //   assert.deepEqual(firstPhotoComments, [
  //
  //   ]);
  //   assert.deepEqual(secondPhotoComments, [
  //
  //   ]);
  //   assert.deepEqual(thirdPhotoComments, [
  //
  //   ]);
  //   assert.deepEqual(PhotoComment.getRelationship(firstPhotoComments, 'photo'), [
  //
  //   ]);
  //   assert.deepEqual(PhotoComment.getRelationship(secondPhotoComments, 'photo'), [
  //
  //   ]);
  //   assert.deepEqual(PhotoComment.getRelationship(thirdPhotoComments, 'photo'), [
  //
  //   ]);
  // });
  //
  // it('works for custom named hasOne/belongsTo and hasMany/belongsTo relationships both side', function() {
  //
  // });
  //
  // it('throws an error when relationship reference is invalid', function() {
  //     // NOTE: setup userActivity <-> Photo relationship
  // });
});
