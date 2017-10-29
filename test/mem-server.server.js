// TODO: test Response first
const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

const AUTHENTICATION_TOKEN = 'ec25fc7b-6ee2-4bda-b57c-6c9867b30ff4';
const AJAX_AUTHORIZATION_HEADERS = {
  'Content-Type': 'application/json', 'Authorization': `Token ${AUTHENTICATION_TOKEN}`
};

describe('MemServer.Server functionality', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
        findFromHeaderToken(headers) {
          const authorizationHeader = headers.Authorization;
          const token = authorizationHeader ? authorizationHeader.slice(6) : null;

          return this.findBy({ authentication_token: token });
        }
      });
    `);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

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
      import Model from '${process.cwd()}/lib/mem-server/model';

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
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        email: 'contact@izelnakri.com',
        username: 'izelnakri',
        authentication_token: '${AUTHENTICATION_TOKEN}'
      }
    ];`);
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

  // describe('route shortcuts work', function() {
  //   before(function() {
  //     fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
  //       export default function(Models) {
  //         this.post('/photos');
  //         this.get('/photos');
  //         this.get('/photos/:id');
  //         this.put('/photos/:id');
  //         this.delete('/photos/:id');
  //
  //       }
  //     `);
  //   });
    // NOTE: add this.resource and this.passthrough here

    // it('POST /resources work with shortcut', function(done) {
    //   const MemServer = require('../index.js');
    //   const { Photo } = MemServer.Models;
    //
    //   MemServer.start();
    //   window.$.ajaxSetup({ headers: { 'Content-Type': 'application/json' } });
    //
    //   assert.equal(Photo.count(), 3);
    //
    //   window.$.ajax({
    //     type: 'POST', url: '/photos', headers: { 'Content-Type': 'application/json' }
    //   }, (data, textStatus, jqXHR) => {
    //     assert.equal(jqXHR.status, 201);
    //     assert.deepEqual(data, { is_public: true, name: 'Some default name', id: 4, user_id: 1 });
    //     assert.equal(Photo.count(), 4);
    //
    //     done();
    //   });
    // });

  //   it('GET /resources works with shortcut', function(done) {
  //     const MemServer = require('../index.js');
  //     const { Photo } = MemServer.Models;
  //
  //     MemServer.start();
  //     window.$.ajaxSetup({ headers: { 'Content-Type': 'application/json' } });
  //
  //     assert.equal(Photo.count(), 3);
  //
  //     window.$.getJSON('/photos', (data, textStatus, jqXHR) => {
  //       assert.equal(jqXHR.status, 200);
  //       assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
  //       assert.equal(Photo.count(), 3);
  //
  //       done();
  //     });
  //   });
  //
  //   it('GET /resources/:id works with shortcut', function(done) {
  //     const MemServer = require('../index.js');
  //     const { Photo } = MemServer.Models;
  //
  //     MemServer.start();
  //     window.$.ajaxSetup({ headers: { 'Content-Type': 'application/json' } });
  //
  //     window.$.getJSON('/photos/1', (data, textStatus, jqXHR) => {
  //       assert.equal(jqXHR.status, 200);
  //       assert.deepEqual(data, { photos: Photo.serializer(Photo.find(1)) });
  //
  //       done();
  //     });
  //   });
  //
  //   it('PUT /resources/:id works with shortcut', function(done) {
  //     const MemServer = require('../index.js');
  //     const { Photo } = MemServer.Models;
  //
  //     MemServer.start();
  //     window.$.ajaxSetup({ headers: { 'Content-Type': 'application/json' } });
  //
  //     assert.equal(Photo.find(1).name, 'Ski trip')
  //
  //     window.$.ajax({
  //       type: 'PUT',
  //       url: '/photos/1',
  //       headers: { 'Content-Type': 'application/json' },
  //       data: { photo: { id: 1, title: 'New custom title'} }
  //     }, (data, textStatus, jqXHR) => {
  //       const photo = Photo.find(1);
  //
  //       assert.equal(jqXHR.status, 200);
  //       assert.deepEqual(data, { photo: Photo.serializer(photo) });
  //       assert.equal(photo.name, 'New custom title');
  //
  //       done();
  //     });
  //   });
  //
  //   it('DELETE /resources/:id works with shortcut', function(done) {
  //     const MemServer = require('../index.js');
  //     const { Photo } = MemServer.Models;
  //
  //     MemServer.start();
  //     window.$.ajaxSetup({ headers: { 'Content-Type': 'application/json' } });
  //
  //     assert.equal(Photo.count(), 3);
  //
  //     window.$.ajax({
  //       type: 'DELETE',
  //       url: '/photos/1',
  //       headers: { 'Content-Type': 'application/json' }
  //     }, (data, textStatus, jqXHR) => {
  //       assert.equal(jqXHR.status, 204);
  //       assert.deepEqual(data, {});
  //       assert.equal(Photo.count(), 2);
  //       assert.equal(PHoto.find(1), undefined);
  //
  //       done();
  //     });
  //   });
  // });

  describe('server can process custom headers and responses', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        import Response from '../lib/mem-server/response';

        export default function({ User, Photo }) {
          this.post('/photos', ({ headers }) => {
            const user = User.findFromHeaderToken(headers);
            console.log('user is', user);

            if (!user) {
              return Response(401, { error: 'Unauthorized' });
            }

            const photo = Photo.insert({ user_id: user.id });

            return { photo: Photo.serializer(photo) };
          });

          this.get('/photos', ({ headers }) => {
            const user = User.findFromHeaderToken(headers);

            if (!user) {
              return Response(404, { error: 'Not found' });
            }

            const photos = Photo.findAll({ user_id: user.id });

            return { photos: Photo.serializer(photos) };
          });

          this.get('/photos/:id', ({ headers, params }) => {
            const user = User.findFromHeaderToken(headers);

            if (!user) {
              return Response(401, { error: 'Unauthorized' });
            }

            const photo = Photo.findBy({ id: params.id, user_id: user.id });

            return photo ? { photo: Photo.serializer(photo) } : Response(404, { error: 'Not found'});
          });

          this.put('/photos/:id', ({ headers, params }) => {
            const user = User.findFromHeaderToken(headers);

            if (!user) {
              return Response(401, { error: 'Unauthorized' });
            }

            if (Photo.findBy({ id: params.id, user_id: user.id })) {
              return { photo: Photo.update(params.photo) };
            }
          });

          this.delete('/photos/:id', ({ headers, params }) => {
            const user = User.findFromHeaderToken(headers);
            console.log('called');
            console.log(user);

            if (user && Photo.findBy({ id: params.id, user_id: user.id })) {
              return Photo.delete({ id: params.id });
            }
          });
        }
      `);
    });

    it('POST /resources work with custom headers and responses', async function() {
      this.timeout(5000);

      const MemServer = require('../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();
      window.$.ajaxSetup({ headers: { 'Content-Type': 'application/json' } });

      assert.equal(Photo.count(), 3);

      await window.$.post('/photos').catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
      });

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 201);
        assert.deepEqual(data, {
          photo: { is_public: true, name: 'Some default name', id: 4, user_id: 1 }
        });
      });
    });

    it('GET /resources works with custom headers and responses', async function() {
      const MemServer = require('../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 404);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Not found' });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll())});
      });
    });

    it('GET /resources/:id works with custom headers and responses', async function() {
      const MemServer = require('../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos/1', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(1))});
      });
    });

    it('PUT /resources/:id works with custom headers and responses', async function() {
      const MemServer = require('../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'PUT', url: '/photos/1', headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ photo: { id: 1, name: 'Photo after edit' }})
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
      });

      await window.$.ajax({
        type: 'PUT', url: '/photos/1', headers: AJAX_AUTHORIZATION_HEADERS,
        data: JSON.stringify({ photo: { id: 1, name: 'Photo after edit' } })
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(1))});
        assert.equal(Photo.find(1).name, 'Photo after edit');
      });
    });

    it('DELETE /resources/:id works with custom headers and responses', async function() {
      const MemServer = require('../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.ok(Photo.find(1), 'User id: 1 exists');

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
        assert.ok(Photo.find(1), 'User id: 1 exists');
      });

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 204);
        assert.deepEqual(data, undefined);
        assert.ok(!Photo.find(1), 'User id: 1 gets deleted');
      });
    });
  });

  // describe('server can process custom queryParams and responses', function() {
  //   fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
  //     import Response from '';
  //
  //     export default function(Models) {
  //       this.post('/photos', ({ headers, queryParams }) => {
  //         const user = User.findFromToken(request);
  //
  //         if (!user && queryParams.is_admin) {
  //           return Response(401, { error: 'Unauthorized' });
  //         }
  //
  //         const photo = Photo.insert({ user_id: user.id });
  //
  //         return Photo.serialize(photo);
  //       });
  //
  //       this.get('/photos'), ({ headers, queryParams }) => {
  //         const user = User.findFromToken(request);
  //
  //         if (!user) {
  //           return Response(404, { error: 'Not found' });
  //         }
  //
  //         const photos = Photo.findAll(Object.assign({ user_id: user.id }, queryParams));
  //
  //         if (!photos) { // NOTE: change here maybe
  //           return Response(404, { error: 'Not found' });
  //         }
  //
  //         return Photo.serialize(photos);
  //       });
  //
  //       this.get('/photos/:id', ({ params, headers, queryParams }) => {
  //         const user = User.findFromToken(request);
  //
  //         if (!user) {
  //           return Response(401, { error: 'Unauthorized' });
  //         } else if (queryParams.nonce === '123123123') {
  //           const photo = Photo.findBy({ id: params.id, user_id: user.id });
  //
  //           return photo ? Photo.serialize(photo) : Response(404, { error: 'Not found'})
  //         }
  //       });
  //
  //       this.put('/photos/:id', ({ params, headers, queryParams }) => {
  //         const user = User.findFromToken(request);
  //         const validRequest = user && queryParams.nonce === '123123123' &&
  //           Photo.findBy({ id: params.id, user_id: user.id });
  //
  //         if (validRequest) {
  //           return Photo.update(request.params);
  //         }
  //       });
  //
  //       this.delete('/photos/:id', ({ params, headers }) => {
  //         const user = User.findFromToken(request);
  //
  //         if (!(queryParams.nonce === '123123123') {
  //           return Response(500, { error: 'Invalid nonce to delete a photo' });
  //         } else if (user && Photo.findBy({ id: params.id, user_id: user.id })) {
  //           return Photo.delete(request.params); // NOTE: what to do with this response
  //         }
  //       });
  //     }
  //   `);

    //   it('POST /resources work with custom headers, queryParams and responses', function() {
    //
    //   });
    //
    //   it('GET /resources works with custom headers, queryParams and responses', function() {
    //
    //   });
    //
    //   it('GET /resources/:id works with custom headers, queryParams and responses', function() {
    //
    //   });
    //
    //   it('PUT /resources/:id works with custom headers, queryParams and responses', function() {
    //
    //   });
    //
    //   it('DELETE /resources/:id works with custom headers, queryParams and responses', function() {
    //
    //   });
  // });

  // TODO: passthrough works
  // NOTE: by default returning undefined should return Response(500) ?
});
