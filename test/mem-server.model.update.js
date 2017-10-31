const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Model Update Interface', function() {
  before(function() {
    const modelFileContent = `import Model from '${process.cwd()}/lib/model';
                              export default Model({});`;

    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({
        defaultAttributes: {
          is_public: true,
          name() {
            return 'Some default name';
          }
        }
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({
        defaultAttributes: {
          inserted_at() {
            return '2017-10-25T20:54:04.447Z';
          },
          is_important: true
        }
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
  });

  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }
    done();
  });

  describe('$Model.update() interface', function() {
    it('can update models', function() {
      this.timeout(5000);

      const MemServer = require('../lib/index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start()

      Photo.update({ id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false });
      Photo.update({ id: 2, href: 'family-photo-2.jpeg', is_public: false });
      PhotoComment.update({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Cool' });

      assert.deepEqual(Photo.find(1), {
        id: 1, name: 'Ski trip', href: 'ski-trip.jpeg', is_public: false
      });
      assert.deepEqual(Photo.find(2), {
        id: 2, name: 'Family photo', href: 'family-photo-2.jpeg', is_public: false
      });
      assert.deepEqual(PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' }), {
        uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', content: 'Cool', photo_id: 2, user_id: 1
      });
    });

    it('throws error when updating a nonexistent model', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start()

      assert.throws(() => Photo.update({ id: 99, href: 'family-photo-2.jpeg' }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Photo\.update\(record\) failed because Photo with id: 99 does not exist/.test(err);
      });
      assert.throws(() => PhotoComment.update({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5666', content: 'Nice' }), (err) => {
        return (err instanceof Error) &&
        /\[MemServer\] PhotoComment\.update\(record\) failed because PhotoComment with uuid: 374c7f4a-85d6-429a-bf2a-0719525f5666 does not exist/.test(err);
      });
    });

    it('throws error when a model get updated with an unknown $Model.attribute', function() {
      const MemServer = require('../lib/index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start()

      assert.throws(() => Photo.update({ id: 1, name: 'ME', is_verified: false }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Photo\.update id: 1 fails, Photo model does not have is_verified attribute to update/.test(err);
      });
      assert.throws(() => PhotoComment.update({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29', location: 'Amsterdam' }), (err) => {
        return (err instanceof Error) &&
        /\[MemServer\] PhotoComment\.update uuid: 374c7f4a-85d6-429a-bf2a-0719525f5f29 fails, PhotoComment model does not have location attribute to update/.test(err);
      });
    });
  });
});
