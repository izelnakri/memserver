const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Server shortcut functionality', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
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
    fs.mkdirSync(`./memserver/fixtures`);
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
      {
        id: 1,
        name: 'Ski trip',
        href: 'ski-trip.jpeg',
        is_public: false,
        user_id: 1
      },
      {
        id: 2,
        name: 'Family photo',
        href: 'family-photo.jpeg',
        is_public: true,
        user_id: 1
      },
      {
        id: 3,
        name: 'Selfie',
        href: 'selfie.jpeg',
        is_public: false,
        user_id: 1
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

  it('namespace configuration option could be passed in during MemServer.start()', async function() {
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      import Response from '../lib/response';

      export default function({ Photo }) {
        this.get('/photos', () => {
          const photos = Photo.findAll();

          if (!photos || photos.length === 0) {
            return Response(404, { error: 'Not found' });
          }

          return { photos: Photo.serializer(photos) };
        });
      }
    `);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    const MemServer = require('../../lib/index.js');
    const { Photo } = MemServer.Models;

    MemServer.start({ namespace: 'api/v1' });
    window.$ = require('jquery');

    await window.$.ajax({
      type: 'GET', url: '/api/v1/photos', headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
    });
  });

  it('server this.namespace() configuration can overwrite existing namespace config', async function() {
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      import Response from '../lib/response';

      export default function({ Photo }) {
        this.namespace = 'api/';

        this.get('/photos', () => {
          const photos = Photo.findAll();

          if (!photos || photos.length === 0) {
            return Response(404, { error: 'Not found' });
          }

          return { photos: Photo.serializer(photos) };
        });
      }
    `);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    const MemServer = require('../../lib/index.js');
    const { Photo } = MemServer.Models;

    MemServer.start({ namespace: 'api/v1' });
    window.$ = require('jquery');

    await window.$.ajax({
      type: 'GET', url: '/api/photos', headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
    });
  });

  it('urlPrefix configuration option could be passed in during MemServer.start()', async function() {
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      import Response from '../lib/response';

      export default function({ Photo }) {
        this.namespace = 'api/';
        this.get('/photos', () => {
          const photos = Photo.findAll();

          if (!photos || photos.length === 0) {
            return Response(404, { error: 'Not found' });
          }

          return { photos: Photo.serializer(photos) };
        });
      }
    `);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    const MemServer = require('../../lib/index.js');
    const { Photo } = MemServer.Models;

    MemServer.start({ urlPrefix: 'http://twitter.com' });
    window.$ = require('jquery');

    await window.$.ajax({
      type: 'GET', url: 'http://twitter.com/api/photos', headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
    });
  });

  it('server this.urlPrefix() configuration can overwrite existing urlPrefix config', async function() {
    this.timeout(5000);

    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      import Response from '../lib/response';

      export default function({ Photo }) {
        this.urlPrefix = 'http://facebook.com'
        this.namespace = 'api';
        this.get('/photos', () => {
          const photos = Photo.findAll();

          if (!photos || photos.length === 0) {
            return Response(404, { error: 'Not found' });
          }

          return { photos: Photo.serializer(photos) };
        });
      }
    `);

    Object.keys(require.cache).forEach((key) => delete require.cache[key]);

    const MemServer = require('../../lib/index.js');
    const { Photo } = MemServer.Models;

    MemServer.start({ urlPrefix: 'http://twitter.com' });
    window.$ = require('jquery');

    await window.$.ajax({
      type: 'GET', url: 'http://facebook.com/api/photos',
      headers: { 'Content-Type': 'application/json' }
    }).then((data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
    });
  });

  // it('timing configuration option could be passed in during MemServer.start()', async function() {
  //   this.timeout(5000);
  //
  //   fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
  //     import Response from '../lib/response';
  //
  //     export default function({ Photo }) {
  //       this.get('/photos', () => {
  //         const photos = Photo.findAll();
  //
  //         if (!photos || photos.length === 0) {
  //           return Response(404, { error: 'Not found' });
  //         }
  //
  //         return { photos: Photo.serializer(photos) };
  //       });
  //     }
  //   `);
  //
  //   const MemServer = require('../../lib/index.js');
  //   const { Photo } = MemServer.Models;
  //
  //   MemServer.start({ timing: 3000 });
  //
  //   let timer;
  //   var ThreeSecondsPassed = false;
  //   setTimeout(() => { ThreeSecondsPassed = true; }, 1900);
  //   await window.$.ajax({
  //     type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
  //   }).then((data, textStatus, jqXHR) => {
  //     assert.equal(ThreeSecondsPassed, true);
  //     assert.equal(jqXHR.status, 200);
  //     assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
  //   });
  // });

  // it('server this.get(url, timing) configuration can overwrite existing timing config', function() {
  //   const MemServer = require('../../lib/index.js');
  //
  //   MemServer.start({ timing: 2000 });
  // });
});
