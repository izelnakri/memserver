require('babel-register')({
  presets: ['env'],
  cache: false
});

const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const shell = require('child_process').exec;

describe('[MemServer CLI] $ memserver fixtures tests', function() {
  beforeEach(function(done) {
    rimraf.sync(`${process.cwd()}/memserver`);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    done();
  });

  afterEach(function(done) {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    done();
  });

  it('memserver g fixtures without memserver directory raises error', function(done) {
    assert.ok(!fs.existsSync(`${process.cwd()}/memserver`));

    shell(`node ${process.cwd()}/cli.js generate fixtures`, (error, stdout) => {
      assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

      shell(`node ${process.cwd()}/cli.js g fixtures`, (error, stdout) => {
        assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

        done();
      });
    });
  });

  it('memserver g fixtures [modelName] without memserver directory raises error', function(done) {
    assert.ok(!fs.existsSync(`${process.cwd()}/memserver`));

    shell(`node ${process.cwd()}/cli.js generate fixtures user`, (error, stdout) => {
      assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

      shell(`node ${process.cwd()}/cli.js g fixtures`, (error, stdout) => {
        assert.equal(stdout, '[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?\n');

        done();
      });
    });
  });

  it('memserver g fixtures works for the entire state', function(done) {
    this.timeout(5000);

    generateMemServerState();

    shell(`node ${process.cwd()}/cli.js g fixtures`, (error, stdout) => {
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/users.js'));
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/likes.js'));
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/photos.js'));
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/photo-comments.js'));

      const fixturesPath = `${process.cwd()}/memserver/fixtures`;

      assert.deepEqual(fs.readdirSync(fixturesPath), [
        'likes.js', 'photo-comments.js', 'photos.js', 'users.js'
      ]);
      assert.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      assert.deepEqual(require(`${fixturesPath}/photos.js`).default, [
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
      assert.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
      assert.deepEqual(require(`${fixturesPath}/likes.js`).default, []);

      done();
    });
  });

  it('memserver generate fixtures works for the entire state', function(done) {
    this.timeout(5000);

    generateMemServerState();

    shell(`node ${process.cwd()}/cli.js generate fixtures`, (error, stdout) => {
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/users.js'));
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/likes.js'));
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/photos.js'));
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/photo-comments.js'));

      const fixturesPath = `${process.cwd()}/memserver/fixtures`;

      assert.deepEqual(fs.readdirSync(fixturesPath), [
        'likes.js', 'photo-comments.js', 'photos.js', 'users.js'
      ]);
      assert.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      assert.deepEqual(require(`${fixturesPath}/photos.js`).default, [
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
      assert.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
      assert.deepEqual(require(`${fixturesPath}/likes.js`).default, []);

      done();
    });
  });

  it('memserver generate fixtures [modelName] works', function(done) {
    this.timeout(5000);

    generateMemServerState();

    shell(`node ${process.cwd()}/cli.js generate fixtures users`, (error, stdout) => {
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/users.js'));

      const fixturesPath = `${process.cwd()}/memserver/fixtures`;

      assert.deepEqual(fs.readdirSync(fixturesPath), [
        'photo-comments.js', 'photos.js', 'users.js'
      ]);
      assert.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      assert.deepEqual(require(`${fixturesPath}/photos.js`).default, [
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
      assert.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
      assert.ok(!fs.existsSync(`${fixturesPath}/likes.js`));

      shell(`node ${process.cwd()}/cli.js generate fixtures photos`, (error, stdout) => {
        assert.ok(stdout.includes('[MemServer] data written to /fixtures/photos.js'));

        assert.deepEqual(fs.readdirSync(fixturesPath), [
          'photo-comments.js', 'photos.js', 'users.js'
        ]);
        assert.deepEqual(require(`${fixturesPath}/users.js`).default, [
          {
            password: '123456',
            authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
            id: 1,
            first_name: 'Izel',
            last_name: 'Nakri'
          }
        ]);
        const photosFixtureData = fs.readFileSync(`${fixturesPath}/photos.js`).toString();
        assert.deepEqual(eval(photosFixtureData.slice(15, photosFixtureData.length - 1)), [ // TODO: babel cache: false doesnt work
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
        assert.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
        assert.ok(!fs.existsSync(`${fixturesPath}/likes.js`));

        done();
      });
    });
  });

  it('memserver g fixtures [modelName] works', function(done) {
    this.timeout(5000);

    generateMemServerState();

    shell(`node ${process.cwd()}/cli.js g fixtures users`, (error, stdout) => {
      assert.ok(stdout.includes('[MemServer] data written to /fixtures/users.js'));

      const fixturesPath = `${process.cwd()}/memserver/fixtures`;

      assert.deepEqual(fs.readdirSync(fixturesPath), [
        'photo-comments.js', 'photos.js', 'users.js'
      ]);
      assert.deepEqual(require(`${fixturesPath}/users.js`).default, [
        {
          password: '123456',
          authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
          id: 1,
          first_name: 'Izel',
          last_name: 'Nakri'
        }
      ]);
      assert.deepEqual(require(`${fixturesPath}/photos.js`).default, [
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
      assert.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
      assert.ok(!fs.existsSync(`${fixturesPath}/likes.js`));

      shell(`node ${process.cwd()}/cli.js g fixtures photos`, (error, stdout) => {
        assert.ok(stdout.includes('[MemServer] data written to /fixtures/photos.js'));

        assert.deepEqual(fs.readdirSync(fixturesPath), [
          'photo-comments.js', 'photos.js', 'users.js'
        ]);
        assert.deepEqual(require(`${fixturesPath}/users.js`).default, [
          {
            password: '123456',
            authentication_token: '12or12rnfasdfzlemfp1m3epfm134',
            id: 1,
            first_name: 'Izel',
            last_name: 'Nakri'
          }
        ]);
        const photosFixtureData = fs.readFileSync(`${fixturesPath}/photos.js`).toString();
        assert.deepEqual(eval(photosFixtureData.slice(15, photosFixtureData.length - 1)), [ // TODO: babel cache: false doesnt work
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
        assert.deepEqual(require(`${fixturesPath}/photo-comments.js`).default, [
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
        assert.ok(!fs.existsSync(`${fixturesPath}/likes.js`));

        done();
      });
    });
  });

  // it('memserver generate fixtures [modelName] with wrong modelName raises', function() {
  // });

  // it('memserver g fixtures [modelName] with wrong modelName raises', function() {
  // });
});

function generateMemServerState() {
  const modelFileContent = `import Model from '${process.cwd()}/lib/model';
                            export default Model({});`;

  fs.mkdirSync('./memserver');
  fs.mkdirSync('./memserver/models');
  fs.mkdirSync('./memserver/fixtures');
  fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `import Model from '${process.cwd()}/lib/model';
                            export default Model({
                              defaultAttributes: {
                                password: '123456',
                                authentication_token() {
                                  return '12or12rnfasdfzlemfp1m3epfm134';
                                }
                              }
                            });`);
  fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
  fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `import Model from '${process.cwd()}/lib/model';
                            export default Model({
                              createForUser(user, photo, photoOptions) {
                                return this.insert(Object.assign({}, photoOptions, {
                                  photo_id: photo.id, user_id: user.id
                                }));
                              }
                            });`);
  fs.writeFileSync(`${process.cwd()}/memserver/models/likes.js`, modelFileContent);
  fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');
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
  fs.writeFileSync(`${process.cwd()}/memserver/initializer.js`, `export default function({ User, Photo, PhotoComment }) {
    const user = User.insert({ first_name: 'Izel', last_name: 'Nakri' });
    const photo = Photo.find(1);

    Photo.insert({ name: 'Travel photo', href: 'travel-photo.jpeg', is_public: false });
    PhotoComment.createForUser(user, photo, {
      uuid: '374c7f4a-85d6-429a-bf2a-0719525faaaa', content: 'This is badass'
    });

    Photo.update({ id: 1, name: 'Me skiing' });
  }`);
}
