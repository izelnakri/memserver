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
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/photo-comments.js`, `export default [
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
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/activities.js`, `export default [
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
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        authentication_token: '1RQFPDXxNBvhGwZAEOj8ztGFItejDusXJw_F1FAg5-GknxhqrcfH9h4p9NGCiCVG',
        password_digest: 'tL4rJzy3GrjSQ7K0ZMNqKsgMthsikbWfIEPTi/HJXD3lme7q6HT57RpuCKJOcAC9DFb3lXtEONmkB3fO0q3zWA==',
        primary_email_uuid: '951d3321-9e66-4099-a4a5-cc1e4795d4zz'
      }
    ];`),
    fs.writeFile(`${CWD}/memserver/fixtures/emails.js`, `export default [
      {
        uuid: '951d3321-9e66-4099-a4a5-cc1e4795d4zz',
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

test.after.always(async() => {
  if (await fs.exists(`${CWD}/memserver`)) {
    await fs.remove(`${CWD}/memserver`);
  }
});

test.serial('$Model.getRelationship() works for hasOne/belongsTo uuid relationships both sides on uuid relationship', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Photo, Activity } = MemServer.Models;

  MemServer.start();

  const activity = Photo.getRelationship(Photo.findBy({
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  }), 'activity');

  t.deepEqual(activity, {
    id: 1, user_id: 1, photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  });
  t.is(Photo.getRelationship(Photo.findBy({
    uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
  }), 'activity'), undefined);
  t.deepEqual(Activity.getRelationship(activity, 'photo'), Photo.findBy({
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  }));
  t.is(Activity.getRelationship(Activity.find(2), 'photo'), undefined);
});

test.serial('$Model.getRelationship() works for hasMany/belongsTo uuid relationship both sides on uuid', async (t) => {
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

  const firstPhotoComments = Photo.getRelationship(Photo.findBy({
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  }), 'comments');
  const secondPhotoComments = Photo.getRelationship(Photo.findBy({
    uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
  }), 'comments');
  const thirdPhotoComments = Photo.getRelationship(Photo.findBy({
    uuid: '6f0c74bb-13e0-4609-b34d-568cd3cee6bc'
  }), 'comments');

  t.deepEqual(firstPhotoComments, [
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
  t.deepEqual(secondPhotoComments, [
    {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed',
      photo_uuid: '2ae860da-ee55-4fd2-affb-da62e263980b', user_id: 1
    }
  ]);
  t.deepEqual(thirdPhotoComments, []);

  const error = t.throws(() => Comment.getRelationship(firstPhotoComments, 'photo'), Error);

  t.true(/\[MemServer\] Comment\.getRelationship expects model input to be an object not an array/.test(error.message));
  t.deepEqual(Comment.getRelationship(firstPhotoComments[0], 'photo'), {
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
    name: 'Ski trip',
    href: 'ski-trip.jpeg',
    is_public: false
  });
  t.deepEqual(Comment.getRelationship(secondPhotoComments[0], 'photo'), {
    uuid: '2ae860da-ee55-4fd2-affb-da62e263980b',
    name: 'Family photo',
    href: 'family-photo.jpeg',
    is_public: true
  });

  await Promise.all([
    fs.remove(`${CWD}/memserver/models/comment.js`),
    fs.remove(`${CWD}/memserver/fixtures/comments.js`)
  ]);
});

test.serial('$Model.getRelationship() works for custom named hasOne/belongsTo uuid relationships both side on uuid relationship', (t) => {
  t.plan(5);

  const MemServer = require('../../lib/index.js');
  const { Photo, Activity, User, Email } = MemServer.Models;

  MemServer.start();

  const activity = Photo.getRelationship(Photo.findBy({
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  }), 'userActivity', Activity);

  t.deepEqual(activity, {
    id: 1, user_id: 1, photo_uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  });
  t.deepEqual(User.getRelationship(User.find(1), 'primaryEmail', Email), {
    uuid: '951d3321-9e66-4099-a4a5-cc1e4795d4zz',
    address: 'contact@izelnakri.com',
    is_public: false,
    confirmed_at: '2018-02-25T23:00:00.000Z',
    confirmation_token: '951d3321-9e66-4099-a4a5-cc1e4795d4ss',
    confirmation_token_sent_at: '2018-02-25T22:16:01.133Z',
    person_id: 1
  });
  t.is(Photo.getRelationship(Photo.findBy({
    uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
  }), 'userActivity', Activity), undefined);
  t.deepEqual(Activity.getRelationship(activity, 'photo', Photo), Photo.findBy({
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  }));
  t.is(Activity.getRelationship(Activity.find(2), 'photo', Photo), undefined);
});

test.serial('$Model.getRelationship() works for custom named hasMany/belongsTo uuid relationships both side on uuid relationship', (t) => {
  t.plan(7);

  const MemServer = require('../../lib/index.js');
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

  t.deepEqual(firstPhotoComments, [
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
  t.deepEqual(secondPhotoComments, [
    {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Interesting indeed',
      photo_uuid: '2ae860da-ee55-4fd2-affb-da62e263980b', user_id: 1
    }
  ]);
  t.deepEqual(thirdPhotoComments, []);

  const error = t.throws(() => PhotoComment.getRelationship(firstPhotoComments, 'photo'), Error);

  t.true(/\[MemServer\] PhotoComment\.getRelationship expects model input to be an object not an array/.test(error.message));
  t.deepEqual(PhotoComment.getRelationship(firstPhotoComments[0], 'photo'), {
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a',
    name: 'Ski trip',
    href: 'ski-trip.jpeg',
    is_public: false
  });
  t.deepEqual(PhotoComment.getRelationship(secondPhotoComments[0], 'photo'), {
    uuid: '2ae860da-ee55-4fd2-affb-da62e263980b',
    name: 'Family photo',
    href: 'family-photo.jpeg',
    is_public: true
  });
});

test.serial('$Model.getRelationship() throws an error when uuid relationship reference is invalid', (t) => {
  t.plan(4);

  const MemServer = require('../../lib/index.js');
  const { Photo } = MemServer.Models;

  MemServer.start();

  const error = t.throws(() => Photo.getRelationship(Photo.findBy({
    uuid: '65075a0c-3f4c-47af-9995-d4a01747ff7a'
  }), 'comments'), Error);

  t.true(/\[MemServer\] comments relationship could not be found on Photo model\. Please put the comments Model object as the third parameter to Photo\.getRelationship function/.test(error.message));

  const secondError = t.throws(() => Photo.getRelationship(Photo.findBy({
    uuid: '2ae860da-ee55-4fd2-affb-da62e263980b'
  }), 'userActivity'), Error);

  t.true(/\[MemServer\] userActivity relationship could not be found on Photo model\. Please put the userActivity Model object as the third parameter to Photo\.getRelationship function/.test(secondError.message));
});
