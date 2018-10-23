import test from 'ava';
import fs from 'fs-extra';

const CWD = process.cwd();

test.before(async () => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);

  await fs.mkdir(`${CWD}/memserver`);
  await fs.mkdir(`${CWD}/memserver/models`);
  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/photo.js`, `
      import Model from '${CWD}/lib/model';
      import PhotoComment from '${CWD}/memserver/models/photo-comment.js';

      export default Model({
        embedReferences: {
          comments: PhotoComment
        }
      });
    `),
    fs.writeFile(`${CWD}/memserver/models/photo-comment.js`, `
      import Model from '${CWD}/lib/model';
      import User from '${CWD}/memserver/models/user.js';

      export default Model({
        embedReferences: {
          author: User
        }
      });
    `),
    fs.writeFile(`${CWD}/memserver/models/user.js`, `
      import Model from '${CWD}/lib/model';

      export default Model({});
    `),
    fs.writeFile(`${CWD}/memserver/models/email.js`, `
      import Model from '${CWD}/lib/model';

      export default Model({});
    `),
    fs.writeFile(`${CWD}/memserver/models/activity.js`, `
      import Model from '${CWD}/lib/model';

      export default Model({
      });
    `),
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
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/activities.js`, `export default [
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
    ];`),
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
    fs.writeFile(`${CWD}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        authentication_token: '1RQFPDXxNBvhGwZAEOj8ztGFItejDusXJw_F1FAg5-GknxhqrcfH9h4p9NGCiCVG',
        password_digest: 'tL4rJzy3GrjSQ7K0ZMNqKsgMthsikbWfIEPTi/HJXD3lme7q6HT57RpuCKJOcAC9DFb3lXtEONmkB3fO0q3zWA==',
        primary_email_id: 1
      }
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/emails.js`, `export default [
      {
        id: 1,
        address: 'contact@izelnakri.com',
        is_public: false,
        confirmed_at: '2018-02-25T23:00:00.000Z',
        confirmation_token: '951d3321-9e66-4099-a4a5-cc1e4795d4ss',
        confirmation_token_sent_at: '2018-02-25T22:16:01.133Z',
        person_id: 1
      }
    ];`)
  ]);
});

test.beforeEach(() => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.afterEach(() => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.after.always(async () => {
  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }
});

test.serial('$Model.getRelationship() works for hasOne/belongsTo id relationships both sides on id relationships', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Photo, Activity } = MemServer.Models;

  MemServer.start();

  const activity = Photo.getRelationship(Photo.find(1), 'activity');

  t.deepEqual(activity, { id: 1, user_id: 1, photo_id: 1 });
  t.is(Photo.getRelationship(Photo.find(2), 'activity'), undefined);
  t.deepEqual(Activity.getRelationship(activity, 'photo'), Photo.find(1));
  t.is(Activity.getRelationship(Activity.find(2), 'photo'), undefined);
});

test.serial('$Model.getRelationship() works for hasMany/belongsTo id relationships both sides on id relationships', async (t) => {
  t.plan(7);

  const photoCommentCode = await fs.readFile(`${CWD}/memserver/models/photo-comment.js`);
  const commentFixtures = await fs.readFile(`${CWD}/memserver/fixtures/photo-comments.js`);

  await Promise.all([
    fs.writeFile(`${CWD}/memserver/models/comment.js`, photoCommentCode),
    fs.writeFile(`${CWD}/memserver/fixtures/comments.js`, commentFixtures)
  ]);

  const MemServer = require('../../lib/index.js');
  const { Photo, Comment } = MemServer.Models;

  MemServer.start();

  const firstPhotoComments = Photo.getRelationship(Photo.find(1), 'comments');
  const secondPhotoComments = Photo.getRelationship(Photo.find(2), 'comments');
  const thirdPhotoComments = Photo.getRelationship(Photo.find(3), 'comments');

  t.deepEqual(firstPhotoComments, [
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
  t.deepEqual(secondPhotoComments, [
    {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed', photo_id: 2,
      user_id: 1
    }
  ]);
  t.deepEqual(thirdPhotoComments, []);

  const error = t.throws(() => Comment.getRelationship(firstPhotoComments, 'photo'), Error);

  t.true(/\[MemServer\] Comment\.getRelationship expects model input to be an object not an array/.test(error.message));
  t.deepEqual(Comment.getRelationship(firstPhotoComments[0], 'photo'), {
    id: 1,
    name: 'Ski trip',
    href: 'ski-trip.jpeg',
    is_public: false
  });
  t.deepEqual(Comment.getRelationship(secondPhotoComments[0], 'photo'), {
    id: 2,
    name: 'Family photo',
    href: 'family-photo.jpeg',
    is_public: true
  });

  await Promise.all([
    fs.remove(`${CWD}/memserver/models/comment.js`),
    fs.remove(`${CWD}/memserver/fixtures/comments.js`)
  ]);
});

test.serial('$Model.getRelationship() works for custom named hasOne/belongsTo id relationships both side on id relationships', (t) => {
  t.plan(6);

  const MemServer = require('../../lib/index.js');
  const { Photo, Activity, User, Email } = MemServer.Models;

  MemServer.start();

  const activity = Photo.getRelationship(Photo.find(1), 'userActivity', Activity);

  t.deepEqual(activity, { id: 1, user_id: 1, photo_id: 1 });
  t.deepEqual(User.getRelationship(User.find(1), 'primaryEmail', Email), {
    id: 1,
    address: 'contact@izelnakri.com',
    is_public: false,
    confirmed_at: '2018-02-25T23:00:00.000Z',
    confirmation_token: '951d3321-9e66-4099-a4a5-cc1e4795d4ss',
    confirmation_token_sent_at: '2018-02-25T22:16:01.133Z',
    person_id: 1
  });
  t.is(Photo.getRelationship(Photo.find(2), 'userActivity', Activity), undefined);
  t.deepEqual(Activity.getRelationship(activity, 'photo', Photo), Photo.find(1));
  t.is(Activity.getRelationship(Activity.find(2), 'userPhoto', Photo), undefined);
  t.deepEqual(Activity.getRelationship(activity, 'photo', Photo), Photo.find(1));
});

test.serial('$Model.getRelationship() works for custom named hasMany/belongsTo id relationships both side on id relationships', (t) => {
  t.plan(7);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment } = MemServer.Models;

  MemServer.start();

  const firstPhotoComments = Photo.getRelationship(Photo.find(1), 'comments', PhotoComment);
  const secondPhotoComments = Photo.getRelationship(Photo.find(2), 'comments', PhotoComment);
  const thirdPhotoComments = Photo.getRelationship(Photo.find(3), 'comments', PhotoComment);

  t.deepEqual(firstPhotoComments, [
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
  t.deepEqual(secondPhotoComments, [
    {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed', photo_id: 2,
      user_id: 1
    }
  ]);
  t.deepEqual(thirdPhotoComments, []);

  const error = t.throws(() => PhotoComment.getRelationship(firstPhotoComments, 'photo'), Error);

  t.true(/\[MemServer\] PhotoComment\.getRelationship expects model input to be an object not an array/.test(error.message));
  t.deepEqual(PhotoComment.getRelationship(firstPhotoComments[0], 'photo'), {
    id: 1,
    name: 'Ski trip',
    href: 'ski-trip.jpeg',
    is_public: false
  });
  t.deepEqual(PhotoComment.getRelationship(secondPhotoComments[0], 'photo'), {
    id: 2,
    name: 'Family photo',
    href: 'family-photo.jpeg',
    is_public: true
  });
});

test.serial('$Model.getRelationship() throws an error when id relationship reference is invalid', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Photo } = MemServer.Models;

  MemServer.start();

  const error = t.throws(() => Photo.getRelationship(Photo.find(1), 'comments'), Error);

  t.true(/\[MemServer\] comments relationship could not be found on Photo model\. Please put the comments Model object as the third parameter to Photo\.getRelationship function/.test(error.message));

  const secondError = t.throws(() => Photo.getRelationship(Photo.find(2), 'userActivity'), Error);

  t.true(/\[MemServer\] userActivity relationship could not be found on Photo model\. Please put the userActivity Model object as the third parameter to Photo\.getRelationship function/.test(secondError.message));
});

test.serial('$Model.embedReferences can be set before runtime', (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');
  const { Photo, PhotoComment, User } = MemServer.Models;

  MemServer.start();

  t.deepEqual(Photo.embedReferences, { comments: PhotoComment });
  t.deepEqual(PhotoComment.embedReferences, { author: User });
});

test.serial('$Model.embed({ embedName: ModelName }) sets an embedReference during runtime', (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');
  const { Activity, Photo, PhotoComment, User } = MemServer.Models;

  MemServer.start();

  Photo.embed({ userActivity: Activity });
  User.embed({ activities: Activity });

  t.deepEqual(Photo.embedReferences, { comments: PhotoComment, userActivity: Activity });
  t.deepEqual(User.embedReferences, { activities: Activity });
});

test.serial('$Model.embed() throws error at runtime doesnt receive an object as parameter', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Activity, User } = MemServer.Models;

  MemServer.start();

  const error = t.throws(() => User.embed(), Error);

  t.true(/\[MemServer\] User\.embed\(relationshipObject\) requires an object as a parameter: { relationshipKey: \$RelationshipModel }/.test(error.message));

  const secondError = t.throws(() => User.embed(Activity), Error);

  t.true(/\[MemServer\] User\.embed\(relationshipObject\) requires an object as a parameter: { relationshipKey: \$RelationshipModel }/.test(secondError.message));
});

test.serial('$Model.embed() throws error when runtime $Model.embed(relationship) called with a Model that doesnt exist', (t) => {
  t.plan(2);

  const MemServer = require('../../lib/index.js');
  const { User } = MemServer.Models;

  MemServer.start();

  const error = t.throws(() => User.embed({ activities: undefined }), Error);

  t.true(/\[MemServer\] User\.embed\(\) fails: activities Model reference is not a valid\. Please put a valid \$ModelName to User\.embed\(\)/.test(error.message));
});
