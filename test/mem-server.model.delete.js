const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Model Delete Interface', function() {
  before(function() {
    const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
                              export default Model({});`;

    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
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

  beforeEach(function() {
    Object.keys(require.cache).forEach((key) => delete require.cache[key]);
  });

  after(function(done) {
    if (fs.existsSync(`${process.cwd()}/memserver`)) {
      rimraf.sync(`${process.cwd()}/memserver`);
    }
    done();
  });

  describe('$Model.delete() interface', function() {
    it('can delete existing items', function() {
      this.timeout(5000);

      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start()

      const deletedPhoto = Photo.delete({ id: 2 });
      const deletedComment = PhotoComment.delete({ uuid: '499ec646-493f-4eea-b92e-e383d94182f4' });

      PhotoComment.delete({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' });

      assert.deepEqual(deletedPhoto, {
        id: 2,
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true
      });
      assert.deepEqual(deletedComment, {
        uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
        content: 'What a nice photo!',
        photo_id: 1,
        user_id: 1
      });
      assert.deepEqual(Photo.findAll(), [
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
      assert.deepEqual(PhotoComment.findAll(), [
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
        }
      ]);
    });

    it('throws when the $Model.delete(model) doesnt exist in the database', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      assert.throws(() => Photo.delete({ id: 1 }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Photo has no records in the database to delete\. Photo\.delete\(\{ id: 1 \}\) failed/.test(err);
      });
      assert.throws(() => PhotoComment.delete({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] PhotoComment has no records in the database to delete\. PhotoComment\.delete\(\{ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' \}\) failed/.test(err);
      });

      MemServer.start()

      Photo.delete({ id: 1 });
      assert.throws(() => Photo.delete({ id: 1 }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Could not find Photo with id 1 to delete\. Photo\.delete\(\{ id: 1 \}\) failed/.test(err);
      });
      assert.throws(() => PhotoComment.delete({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' }), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Could not find PhotoComment with uuid 374c7f4a-85d6-429a-bf2a-0719525f5111 to delete\. PhotoComment\.delete\(\{ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' \}\) failed/.test(err);
      });
    });

    it('throws when $Model.delete() called without a parameter', function() {
      const MemServer = require('../index.js');
      const { Photo, PhotoComment } = MemServer.Models;

      MemServer.start()

      assert.throws(() => Photo.delete(), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] Photo\.delete\(model\) model object parameter required to delete a model/.test(err);
      });
      assert.throws(() => PhotoComment.delete(), (err) => {
        return (err instanceof Error) &&
          /\[MemServer\] PhotoComment\.delete\(model\) model object parameter required to delete a model/.test(err);
      });
    });

    // NOTE: Photo.delete(primaryKey) feature ?
  });
});
