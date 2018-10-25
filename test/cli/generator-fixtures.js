import test from 'ava';
import fs from 'fs-extra';
import child_process from 'child_process';

const CWD = process.cwd();
const shell = child_process.exec;

test.beforeEach(async () => {
  await fs.remove(`${CWD}/memserver`);

  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.afterEach(() => {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

test.after.always(async () => {
  await fs.remove(`${CWD}/memserver`);
});

test.serial.cb('$ memserver g fixtures | without memserver directory raises error', (t) => {
  t.plan(3);

  fs.exists(`${CWD}/memserver`).then((folderExistence) => {
    t.true(!folderExistence);

    shell(`node ${CWD}/cli.js generate fixtures`, (error, stdout) => {
      t.true(stdout.includes('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));

      shell(`node ${CWD}/cli.js g fixtures`, (error, stdout) => {
        t.true(stdout.includes('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));

        t.end();
      });
    });
  });
});

test.serial.cb('$ memserver g fixtures [modelName] | without memserver directory raises error', (t) => {
  t.plan(3);

  fs.exists(`${CWD}/memserver`).then((folderExistence) => {
    t.true(!folderExistence);

    shell(`node ${CWD}/cli.js generate fixtures user`, (error, stdout) => {
      t.true(stdout.includes('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));

      shell(`node ${CWD}/cli.js g fixtures`, (error, stdout) => {
        t.true(stdout.includes('[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?'));

        t.end();
      });
    });
  });
});

test.serial.cb('$ memserver g fixtures | works for the entire state', (t) => {
  t.plan(9);

  generateMemServerState().then(() => {
    shell(`node ${process.cwd()}/cli.js g fixtures`, async (error, stdout) => {
      t.true(stdout.includes('[MemServer] data written to /fixtures/users.js'));
      t.true(stdout.includes('[MemServer] data written to /fixtures/likes.js'));
      t.true(stdout.includes('[MemServer] data written to /fixtures/photos.js'));
      t.true(stdout.includes('[MemServer] data written to /fixtures/photo-comments.js'));

      const fixturesPath = `${CWD}/memserver/fixtures`;

      t.deepEqual(await fs.readdir(fixturesPath), [
        'likes.js', 'photo-comments.js', 'photos.js', 'users.js'
      ]);
      t.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      t.deepEqual(require(`${fixturesPath}/photos.js`).default, [
        { id: 1,
          name: 'Me skiing',
          href: 'ski-trip.jpeg',
          is_public: false },
        { id: 2,
          name: 'Family photo',
          href: 'family-photo.jpeg',
          is_public: true },
        { id: 3, name: 'Selfie', href: 'selfie.jpeg', is_public: false },
        { id: 4,
          name: 'Travel photo',
          href: 'travel-photo.jpeg',
          is_public: false }
      ]);
      t.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
        { uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
          content: 'What a nice photo!',
          photo_id: 1,
          user_id: 1 },
        { uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7',
          content: 'I agree',
          photo_id: 1,
          user_id: 2 },
        { uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3',
          content: 'I was kidding',
          photo_id: 1,
          user_id: 1 },
        { uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29',
          content: 'Interesting indeed',
          photo_id: 2,
          user_id: 1 },
        { uuid: '374c7f4a-85d6-429a-bf2a-0719525faaaa',
          content: 'This is badass',
          photo_id: 1,
          user_id: 1 }
      ]);
      t.deepEqual(require(`${fixturesPath}/likes.js`).default, []);

      t.end();
    });
  });
});

test.serial.cb('$ memserver generate fixtures [modelName] works', (t) => {
  t.plan(12);

  generateMemServerState().then(() => {
    shell(`node ${CWD}/cli.js generate fixtures users`, async (error, stdout) => {
      t.true(stdout.includes('[MemServer] data written to /fixtures/users.js'));

      const fixturesPath = `${CWD}/memserver/fixtures`;

      t.deepEqual(await fs.readdir(fixturesPath), [
        'photo-comments.js', 'photos.js', 'users.js'
      ]);
      t.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      t.deepEqual(require(`${fixturesPath}/photos.js`).default, [
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
      t.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
      t.true(!await fs.exists(`${fixturesPath}/likes.js`));

      shell(`node ${process.cwd()}/cli.js generate fixtures photos`, async (error, stdout) => {
        t.true(stdout.includes('[MemServer] data written to /fixtures/photos.js'));

        t.deepEqual(await fs.readdir(fixturesPath), [
          'photo-comments.js', 'photos.js', 'users.js'
        ]);
        t.deepEqual(require(`${fixturesPath}/users.js`).default, [
          {
            password: '123456',
            authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
            id: 1,
            first_name: 'Izel',
            last_name: 'Nakri'
          }
        ]);

        const photosFixtureData = (await fs.readFile(`${fixturesPath}/photos.js`)).toString();

        t.deepEqual(eval(photosFixtureData.slice(15, photosFixtureData.length - 1)), [ // TODO: babel cache: false doesnt work
          { id: 1,
            name: 'Me skiing',
            href: 'ski-trip.jpeg',
            is_public: false },
          { id: 2,
            name: 'Family photo',
            href: 'family-photo.jpeg',
            is_public: true },
          { id: 3, name: 'Selfie', href: 'selfie.jpeg', is_public: false },
          { id: 4,
            name: 'Travel photo',
            href: 'travel-photo.jpeg',
            is_public: false }
        ]);
        t.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
        t.true(!await fs.exists(`${fixturesPath}/likes.js`));

        t.end();
      });
    });
  });
});

test.serial.cb('$ memserver g fixtures [modelName] works', (t) => {
  t.plan(12);

  generateMemServerState().then(() => {
    shell(`node ${CWD}/cli.js g fixtures users`, async (error, stdout) => {
      t.true(stdout.includes('[MemServer] data written to /fixtures/users.js'));

      const fixturesPath = `${CWD}/memserver/fixtures`;

      t.deepEqual(await fs.readdir(fixturesPath), [
        'photo-comments.js', 'photos.js', 'users.js'
      ]);
      t.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      t.deepEqual(require(`${fixturesPath}/photos.js`).default, [
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
      t.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
      t.true(!await fs.exists(`${fixturesPath}/likes.js`));

      shell(`node ${CWD}/cli.js g fixtures photos`, async (error, stdout) => {
        t.true(stdout.includes('[MemServer] data written to /fixtures/photos.js'));

        t.deepEqual(await fs.readdir(fixturesPath), [
          'photo-comments.js', 'photos.js', 'users.js'
        ]);
        t.deepEqual(require(`${fixturesPath}/users.js`).default, [
          {
            password: '123456',
            authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
            id: 1,
            first_name: 'Izel',
            last_name: 'Nakri'
          }
        ]);

        const photosFixtureData = (await fs.readFile(`${fixturesPath}/photos.js`)).toString();

        t.deepEqual(eval(photosFixtureData.slice(15, photosFixtureData.length - 1)), [ // TODO: babel cache: false doesnt work
          { id: 1,
            name: 'Me skiing',
            href: 'ski-trip.jpeg',
            is_public: false },
          { id: 2,
            name: 'Family photo',
            href: 'family-photo.jpeg',
            is_public: true },
          { id: 3, name: 'Selfie', href: 'selfie.jpeg', is_public: false },
          { id: 4,
            name: 'Travel photo',
            href: 'travel-photo.jpeg',
            is_public: false }
        ]);
        t.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
        t.true(!await fs.exists(`${fixturesPath}/likes.js`));

        t.end();
      });
    });
  });
});

// test('$ memserver generate fixtures [modelName] with wrong modelName raises', (t) => {
// });

// test('$ memserver g fixtures [modelName] with wrong modelName raises', (t) => {
// });

function generateMemServerState() {
  return new Promise(async (resolve) => {
    const MODEL_FILE_CONTENT = `import Model from '${CWD}/lib/model';
                              export default Model({});`;

    await fs.mkdir(`${CWD}/memserver`);
    await Promise.all([
      fs.mkdir(`${CWD}/memserver/models`),
      fs.mkdir(`${CWD}/memserver/fixtures`)
    ]);
    await Promise.all([
      fs.writeFile(`${CWD}/memserver/models/user.js`, `import Model from '${CWD}/lib/model';
      export default Model({
        defaultAttributes: {
          password: '123456',
          authentication_token() {
            return '12or12rnfasdfzlemfp1m3epfm134';
          }
        }
      });`),
      fs.writeFile(`${CWD}/memserver/models/photo.js`, MODEL_FILE_CONTENT),
      fs.writeFile(`${CWD}/memserver/models/photo-comment.js`, `import Model from '${CWD}/lib/model';
      export default Model({
        createForUser(user, photo, photoOptions) {
          return this.insert(Object.assign({}, photoOptions, {
            photo_id: photo.id, user_id: user.id
          }));
        }
      });`),
      fs.writeFile(`${CWD}/memserver/models/likes.js`, MODEL_FILE_CONTENT),
      fs.writeFile(`${CWD}/memserver/server.js`, 'export default function(Models) {}'),
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
      fs.writeFile(`${CWD}/memserver/initializer.js`, `export default function({ User, Photo, PhotoComment }) {
        const user = User.insert({ first_name: 'Izel', last_name: 'Nakri' });
        const photo = Photo.find(1);

        Photo.insert({ name: 'Travel photo', href: 'travel-photo.jpeg', is_public: false });
        PhotoComment.createForUser(user, photo, {
          uuid: '374c7f4a-85d6-429a-bf2a-0719525faaaa', content: 'This is badass'
        });

        Photo.update({ id: 1, name: 'Me skiing' });
      }`)
    ]);

    resolve();
  });
}
