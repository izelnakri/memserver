// TODO: change ids to uuid
const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Model UUID Relationships Interface', function() {
  before(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import Model from '${process.cwd()}/lib/model';
      import PhotoComment from '${process.cwd()}/memserver/models/photo-comment.js';

      export default Model({
        embedReferences: {
          comments: PhotoComment
        }
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `
      import Model from '${process.cwd()}/lib/model';
      import User from '${process.cwd()}/memserver/models/user.js';

      export default Model({
        embedReferences: {
          author: User
        }
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({});
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/email.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({});
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/activity.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');
    fs.mkdirSync(`./memserver/fixtures`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
      {
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      },
      {
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b',
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      },
      {
        uuid: '6f0c74bb-13e0-4609-b34d-568cd3cee6bc',
        name: 'Selfie',
        href: 'selfie.jpeg',
        is_public: false
      }
    ];`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photo-comments.js`, `export default [
      {
        uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
        content: 'What a nice photo!',
        photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
        user_id: 1
      },
      {
        uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7',
        content: 'I agree',
        photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
        user_id: 2
      },
      {
        uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3',
        content: 'I was kidding',
        photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
        user_id: 1
      },
      {
        uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29',
        content: 'Interesting indeed',
        photo_uuid: '2ae860da-ee55-4fd2-affb-da62e263980b',
        user_id: 1
      }
    ];`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/activities.js`, `export default [
      {
        id: 1,
        user_id: 1,
        photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      },
      {
        id: 2,
        user_id: 1,
        photo_uuid: null
      }
    ];`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        authentication_token: '1RQFPDXxNBvhGwZAEOj8ztGFItejDusXJw_F1FAg5-GknxhqrcfH9h4p9NGCiCVG',
        password_digest: 'tL4rJzy3GrjSQ7K0ZMNqKsgMthsikbWfIEPTi/HJXD3lme7q6HT57RpuCKJOcAC9DFb3lXtEONmkB3fO0q3zWA==',
        primary_email_uuid: '951d3321-9e66-4099-a4a5-cc1e4795d4zz'
      }
    ];`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/emails.js`, `export default [
      {
        uuid: '951d3321-9e66-4099-a4a5-cc1e4795d4zz',
        address: 'contact@izelnakri.com',
        is_public: false,
        confirmed_at: '2018-02-25T23:00:00.000Z',
        confirmation_token: '951d3321-9e66-4099-a4a5-cc1e4795d4ss',
        confirmation_token_sent_at: '2018-02-25T22:16:01.133Z',
        person_id: 1
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

  describe('$Model.getRelationship method for uuid relationships', function() {
    it('getRelationship() works for hasOne/belongsTo uuid relationships both sides', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, Activity } = MemServer.Models;

      MemServer.start();

      const activity = Photo.getRelationship(Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }), 'activity');

      assert.deepEqual(activity, {
        id: 1, user_id: 1, photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      });
      assert.deepEqual(Photo.getRelationship(Photo.findBy({
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
      }), 'activity'), null);
      assert.deepEqual(Activity.getRelationship(activity, 'photo'), Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }));
      assert.deepEqual(Activity.getRelationship(Activity.find(2), 'photo'), null);

    });

    it('getRelationship() works for hasMany/belongsTo uuid relationships both sides', function() {
      const photoCommentCode = fs.readFileSync(`${process.cwd()}/memserver/models/photo-comment.js`);
      const commentFixtures = fs.readFileSync(`${process.cwd()}/memserver/fixtures/photo-comments.js`);

      fs.writeFileSync(`${process.cwd()}/memserver/models/comment.js`, photoCommentCode);
      fs.writeFileSync(`${process.cwd()}/memserver/fixtures/comments.js`, commentFixtures);

      const MemServer = require('../lib/index.js');
      const { Photo, Comment } = MemServer.Models;

      MemServer.start();

      const firstPhotoComments = Photo.getRelationship(Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }), 'comments');
      const secondPhotoComments = Photo.getRelationship(Photo.findBy({
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
      }), 'comments');
      const thirdPhotoComments = Photo.getRelationship(Photo.findBy({
        uuid: '6f0c74bb-13e0-4609-b34d-568cd3cee6bc'
      }), 'comments');

      assert.deepEqual(firstPhotoComments, [
        {
          uuid: '499ec646-493f-4eea-b92e-e383d94182f4', content: 'What a nice photo!',
          photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a', user_id: 1
        },
        {
          uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7', content: 'I agree',
          photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a', user_id: 2
        },
        {
          uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3', content: 'I was kidding',
          photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a', user_id: 1
        }
      ]);
      assert.deepEqual(secondPhotoComments, [
        {
          uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed',
          photo_uuid: '2ae860da-ee55-4fd2-affb-da62e263980b', user_id: 1
        }
      ]);
      assert.deepEqual(thirdPhotoComments, []);
      assert.throws(() => Comment.getRelationship(firstPhotoComments, 'photo'), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Comment\.getRelationship expects model input to be an object not an array/.test(err);
      });
      assert.deepEqual(Comment.getRelationship(firstPhotoComments[0], 'photo'), {
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      });
      assert.deepEqual(Comment.getRelationship(secondPhotoComments[0], 'photo'), {
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b',
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      });

      fs.unlinkSync(`${process.cwd()}/memserver/models/comment.js`);
      fs.unlinkSync(`${process.cwd()}/memserver/fixtures/comments.js`);
    });

    it('getRelationship() works for custom named hasOne/belongsTo uuid relationships both side', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, Activity, User, Email } = MemServer.Models;

      MemServer.start();

      const activity = Photo.getRelationship(Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }), 'userActivity', Activity);

      assert.deepEqual(activity, {
        id: 1, user_id: 1, photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      });
      assert.deepEqual(User.getRelationship(User.find(1), 'primaryEmail', Email), {
        uuid: '951d3321-9e66-4099-a4a5-cc1e4795d4zz',
        address: 'contact@izelnakri.com',
        is_public: false,
        confirmed_at: '2018-02-25T23:00:00.000Z',
        confirmation_token: '951d3321-9e66-4099-a4a5-cc1e4795d4ss',
        confirmation_token_sent_at: '2018-02-25T22:16:01.133Z',
        person_id: 1
      });
      assert.deepEqual(Photo.getRelationship(Photo.findBy({
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
      }), 'userActivity', Activity), null);
      assert.deepEqual(Activity.getRelationship(activity, 'photo', Photo), Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }));
      assert.deepEqual(Activity.getRelationship(Activity.find(2), 'photo', Photo), null);
    });

    it('getRelationship() works for custom named hasMany/belongsTo uuid relationships both side', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      const firstPhotoComments = Photo.getRelationship(Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }), 'comments', PhotoComment);
      const secondPhotoComments = Photo.getRelationship(Photo.findBy({
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
      }), 'comments', PhotoComment);
      const thirdPhotoComments = Photo.getRelationship(Photo.findBy({
        uuid: '6f0c74bb-13e0-4609-b34d-568cd3cee6bc'
      }), 'comments', PhotoComment);

      assert.deepEqual(firstPhotoComments, [
        {
          uuid: '499ec646-493f-4eea-b92e-e383d94182f4', content: 'What a nice photo!',
          photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a', user_id: 1
        },
        {
          uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7', content: 'I agree',
          photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a', user_id: 2
        },
        {
          uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3', content: 'I was kidding',
          photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a', user_id: 1
        }
      ]);
      assert.deepEqual(secondPhotoComments, [
        {
          uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed',
          photo_uuid: '2ae860da-ee55-4fd2-affb-da62e263980b', user_id: 1
        }
      ]);
      assert.deepEqual(thirdPhotoComments, []);
      assert.throws(() => PhotoComment.getRelationship(firstPhotoComments, 'photo'), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] PhotoComment\.getRelationship expects model input to be an object not an array/.test(err);
      });
      assert.deepEqual(PhotoComment.getRelationship(firstPhotoComments[0], 'photo'), {
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      });
      assert.deepEqual(PhotoComment.getRelationship(secondPhotoComments[0], 'photo'), {
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b',
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      });
    });

    it('throws an error when uuid relationship reference is invalid', function() {
      const MemServer = require('../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.throws(() => Photo.getRelationship(Photo.findBy({
        uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
      }), 'comments'), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] comments relationship could not be found on Photo model\. Please put the comments Model object as the third parameter to Photo\.getRelationship function/.test(err);
      });
      assert.throws(() => Photo.getRelationship(Photo.findBy({
        uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
      }), 'userActivity'), (err) => {
        return (err instanceof Error) &&
        /\[MemServer\] userActivity relationship could not be found on Photo model\. Please put the userActivity Model object as the third parameter to Photo\.getRelationship function/.test(err);
      });
    });
  });
});
