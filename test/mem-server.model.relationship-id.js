const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Model ID Relationships Interface', function() {
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

    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        authentication_token: '1RQFPDXxNBvhGwZAEOj8ztGFItejDusXJw_F1FAg5-GknxhqrcfH9h4p9NGCiCVG',
        password_digest: 'tL4rJzy3GrjSQ7K0ZMNqKsgMthsikbWfIEPTi/HJXD3lme7q6HT57RpuCKJOcAC9DFb3lXtEONmkB3fO0q3zWA==',
        primary_email_id: 1
      }
    ];`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/emails.js`, `export default [
      {
        id: 1,
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

  describe('$Model.getRelationship method for id relationships', function() {
    it('getRelationship() works for hasOne/belongsTo id relationships both sides', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, Activity } = MemServer.Models;

      MemServer.start();

      const activity = Photo.getRelationship(Photo.find(1), 'activity');

      assert.deepEqual(activity, { id: 1, user_id: 1, photo_id: 1 });
      assert.deepEqual(Photo.getRelationship(Photo.find(2), 'activity'), null);
      assert.deepEqual(Activity.getRelationship(activity, 'photo'), Photo.find(1));
      assert.deepEqual(Activity.getRelationship(Activity.find(2), 'photo'), null);
    });

    it('getRelationship() works for hasMany/belongsTo id relationships both sides', function() {
      const photoCommentCode = fs.readFileSync(`${process.cwd()}/memserver/models/photo-comment.js`);
      const commentFixtures = fs.readFileSync(`${process.cwd()}/memserver/fixtures/photo-comments.js`);

      fs.writeFileSync(`${process.cwd()}/memserver/models/comment.js`, photoCommentCode);
      fs.writeFileSync(`${process.cwd()}/memserver/fixtures/comments.js`, commentFixtures);

      const MemServer = require('../lib/index.js');
      const { Photo, Comment } = MemServer.Models;

      MemServer.start();

      const firstPhotoComments = Photo.getRelationship(Photo.find(1), 'comments');
      const secondPhotoComments = Photo.getRelationship(Photo.find(2), 'comments');
      const thirdPhotoComments = Photo.getRelationship(Photo.find(3), 'comments');

      assert.deepEqual(firstPhotoComments, [
        {
          uuid: '499ec646-493f-4eea-b92e-e383d94182f4', content: 'What a nice photo!', photo_id: 1,
          user_id: 1
        },
        {
          uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7', content: 'I agree', photo_id: 1,
          user_id: 2
        },
        {
          uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3', content: 'I was kidding', photo_id: 1,
          user_id: 1
        }
      ]);
      assert.deepEqual(secondPhotoComments, [
        {
          uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed', photo_id: 2,
          user_id: 1
        }
      ]);
      assert.deepEqual(thirdPhotoComments, []);
      assert.throws(() => Comment.getRelationship(firstPhotoComments, 'photo'), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Comment\.getRelationship expects model input to be an object not an array/.test(err);
      });
      assert.deepEqual(Comment.getRelationship(firstPhotoComments[0], 'photo'), {
        id: 1,
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      });
      assert.deepEqual(Comment.getRelationship(secondPhotoComments[0], 'photo'), {
        id: 2,
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      });

      fs.unlinkSync(`${process.cwd()}/memserver/models/comment.js`);
      fs.unlinkSync(`${process.cwd()}/memserver/fixtures/comments.js`);
    });

    it('getRelationship() works for custom named hasOne/belongsTo id relationships both side', function() {
      this.timeout(5000);

      const MemServer = require('../lib/index.js');
      const { Photo, Activity, User, Email } = MemServer.Models;

      MemServer.start();

      const activity = Photo.getRelationship(Photo.find(1), 'userActivity', Activity);

      assert.deepEqual(activity, { id: 1, user_id: 1, photo_id: 1 });
      assert.deepEqual(User.getRelationship(User.find(1), 'primaryEmail', Email), {
        id: 1,
        address: 'contact@izelnakri.com',
        is_public: false,
        confirmed_at: '2018-02-25T23:00:00.000Z',
        confirmation_token: '951d3321-9e66-4099-a4a5-cc1e4795d4ss',
        confirmation_token_sent_at: '2018-02-25T22:16:01.133Z',
        person_id: 1
      });
      assert.deepEqual(Photo.getRelationship(Photo.find(2), 'userActivity', Activity), null);
      assert.deepEqual(Activity.getRelationship(activity, 'photo', Photo), Photo.find(1));
      assert.deepEqual(Activity.getRelationship(Activity.find(2), 'userPhoto', Photo), null);
      assert.deepEqual(Activity.getRelationship(activity, 'photo', Photo), Photo.find(1));
    });

    it('getRelationship() works for custom named hasMany/belongsTo id relationships both side', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start();

      const firstPhotoComments = Photo.getRelationship(Photo.find(1), 'comments', PhotoComment);
      const secondPhotoComments = Photo.getRelationship(Photo.find(2), 'comments', PhotoComment);
      const thirdPhotoComments = Photo.getRelationship(Photo.find(3), 'comments', PhotoComment);

      assert.deepEqual(firstPhotoComments, [
        {
          uuid: '499ec646-493f-4eea-b92e-e383d94182f4', content: 'What a nice photo!', photo_id: 1,
          user_id: 1
        },
        {
          uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7', content: 'I agree', photo_id: 1,
          user_id: 2
        },
        {
          uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3', content: 'I was kidding', photo_id: 1,
          user_id: 1
        }
      ]);
      assert.deepEqual(secondPhotoComments, [
        {
          uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed', photo_id: 2,
          user_id: 1
        }
      ]);
      assert.deepEqual(thirdPhotoComments, []);
      assert.throws(() => PhotoComment.getRelationship(firstPhotoComments, 'photo'), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] PhotoComment\.getRelationship expects model input to be an object not an array/.test(err);
      });
      assert.deepEqual(PhotoComment.getRelationship(firstPhotoComments[0], 'photo'), {
        id: 1,
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false
      });
      assert.deepEqual(PhotoComment.getRelationship(secondPhotoComments[0], 'photo'), {
        id: 2,
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      });
    });

    it('throws an error when id relationship reference is invalid', function() {
      const MemServer = require('../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.throws(() => Photo.getRelationship(Photo.find(1), 'comments'), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] comments relationship could not be found on Photo model\. Please put the comments Model object as the third parameter to Photo\.getRelationship function/.test(err);
      });
      assert.throws(() => Photo.getRelationship(Photo.find(2), 'userActivity'), (err) => {
        return (err instanceof Error) &&
        /\[MemServer\] userActivity relationship could not be found on Photo model\. Please put the userActivity Model object as the third parameter to Photo\.getRelationship function/.test(err);
      });
    });
  });

  describe('$Model relationship embedding', function() {
    it('can register relationship embeds before runtime', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, PhotoComment, User } = MemServer.Models;

      MemServer.start();

      assert.deepEqual(Photo.embedReferences, { comments: PhotoComment });
      assert.deepEqual(PhotoComment.embedReferences, { author: User });
    });

    it('can register relationships embeds during runtime', function() {
      const MemServer = require('../lib/index.js');
      const { Activity, Photo, PhotoComment, User } = MemServer.Models;

      MemServer.start();

      Photo.embed({ userActivity: Activity });
      User.embed({ activities: Activity });

      assert.deepEqual(Photo.embedReferences, { comments: PhotoComment, userActivity: Activity });
      assert.deepEqual(User.embedReferences, { activities: Activity });
    });

    it('throws error when runtime $Model.embed() doesnt receive an object parameter', function() {
      const MemServer = require('../lib/index.js');
      const { Activity, User } = MemServer.Models;

      MemServer.start();

      assert.throws(() => User.embed(), (err) => {
        return (err instanceof Error) &&
        /\[MemServer\] User\.embed\(relationshipObject\) requires an object as a parameter: { relationshipKey: \$RelationshipModel }/.test(err);
      });
      assert.throws(() => User.embed(Activity), (err) => {
        return (err instanceof Error) &&
        /\[MemServer\] User\.embed\(relationshipObject\) requires an object as a parameter: { relationshipKey: \$RelationshipModel }/.test(err);
      });
    });

    it('throws error when runtime $Model.embed(relationship) called with a Model that doesnt exist', function() {
      const MemServer = require('../lib/index.js');
      const { Activity, User } = MemServer.Models;

      MemServer.start();

      assert.throws(() => User.embed({ activities: undefined }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] User\.embed\(\) fails: activities Model reference is not a valid\. Please put a valid \$ModelName to User\.embed\(\)/.test(err);
      });
    });
  });
});
