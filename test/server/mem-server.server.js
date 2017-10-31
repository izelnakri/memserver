const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

const AUTHENTICATION_TOKEN = 'ec25fc7b-6ee2-4bda-b57c-6c9867b30ff4';
const AJAX_AUTHORIZATION_HEADERS = {
  'Content-Type': 'application/json', 'Authorization': `Token ${AUTHENTICATION_TOKEN}`
};

process.setMaxListeners(0);

describe('MemServer.Server general functionality', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
      import Model from '${process.cwd()}/lib/model';

      export default Model({
        findFromHeaderToken(headers) {
          const authorizationHeader = headers.Authorization;
          const token = authorizationHeader ? authorizationHeader.slice(6) : false;

          return this.findBy({ authentication_token: token }) || false;
        }
      });
    `);
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

  describe('server can process custom headers and responses', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        import Response from '../lib/response';

        export default function({ User, Photo }) {
          this.post('/photos', ({ headers }) => {
            const user = User.findFromHeaderToken(headers);

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

            if (user && Photo.findBy({ id: params.id, user_id: user.id })) {
              return Photo.delete({ id: params.id });
            }
          });
        }
      `);
    });

    it('POST /resources work with custom headers and responses', async function() {
      this.timeout(5000);

      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
      });

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 201);
        assert.deepEqual(data, {
          photo: { is_public: true, name: 'Some default name', id: 4, user_id: 1, href: null }
        });
      });
    });

    it('GET /resources works with custom headers and responses', async function() {
      const MemServer = require('../../lib/index.js');
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
      const MemServer = require('../../lib/index.js');
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
      const MemServer = require('../../lib/index.js');
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
      const MemServer = require('../../lib/index.js');
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

  describe('server can process custom queryParams and responses', function() {
    before(function(){
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        import Response from '../lib/response';

        export default function({ User, Photo }) {
          this.post('/photos', ({ headers, params, queryParams }) => {
            const user = User.findFromHeaderToken(headers);

            if (!user || !queryParams.is_admin) {
              return Response(401, { error: 'Unauthorized' });
            }

            const photo = Photo.insert(Object.assign({}, params.photo, { user_id: user.id }));

            return { photo: Photo.serializer(photo) };
          });

          this.get('/photos', ({ headers, queryParams }) => {
            const user = User.findFromHeaderToken(headers);

            if (!user) {
              return Response(404, { error: 'Not found' });
            }

            const photos = Photo.findAll(Object.assign({}, { user_id: user.id }, queryParams));

            if (!photos || photos.length === 0) {
              return Response(404, { error: 'Not found' });
            }

            return { photos: Photo.serializer(photos) };
          });

          this.get('/photos/:id', ({ headers, params, queryParams }) => {
            const user = User.findFromHeaderToken(headers);

            if (!user) {
              return Response(401, { error: 'Unauthorized' });
            } else if (queryParams.nonce === 123123123) {
              const photo = Photo.findBy({ id: params.id, user_id: user.id });

              return photo ? { photo: Photo.serializer(photo) } : Response(404, { error: 'Not found' });
            }

            return Response(404, { error: 'Not found' });
          });

          this.put('/photos/:id', ({ headers, params, queryParams }) => {
            const user = User.findFromHeaderToken(headers);
            const validRequest = user && queryParams.nonce === 123123123 &&
              Photo.findBy({ id: params.id, user_id: user.id });

            if (validRequest) {
              return { photo: Photo.serializer(Photo.update(params.photo)) };
            }

            return Response(500, { error: 'Unexpected error occured' });
          });

          this.delete('/photos/:id', ({ headers, params, queryParams }) => {
            const user = User.findFromHeaderToken(headers);

            if (!(queryParams.nonce === 123123123)) {
              return Response(500, { error: 'Invalid nonce to delete a photo' });
            } else if (!user && !Photo.findBy({ id: params.id, user_id: user.id })) {
              return Response(404, { error: 'Not found' });
            }

            Photo.delete({ id: params.id }); // NOTE: what to do with this response
          });
        }
      `);
    });

    it('POST /resources work with custom headers, queryParams and responses', async function() {
      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
      });

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: AJAX_AUTHORIZATION_HEADERS
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 401);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unauthorized' });
      });

      await window.$.ajax({
        type: 'POST', url: '/photos?is_admin=true', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 201);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(4)) });
        assert.equal(Photo.count(), 4);
      });
    });

    it('GET /resources works with custom headers, queryParams and responses', async function() {
      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 404);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Not found' });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos?is_public=false', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll({ is_public: false })) });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos?href=family-photo.jpeg', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll({ href: 'family-photo.jpeg' })) });
      });
    });

    it('GET /resources/:id works with custom headers, queryParams and responses', async function() {
      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos/1', headers: AJAX_AUTHORIZATION_HEADERS
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 404);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Not found' });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos/1?nonce=123123123', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(1)) });
      });
    });

    it('PUT /resources/:id works with custom headers, queryParams and responses', async function() {
      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'PUT', url: '/photos/1', headers: AJAX_AUTHORIZATION_HEADERS,
        data: JSON.stringify({ photo: { id: 1, name: 'Life' } })
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 500);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Unexpected error occured' });
      });

      await window.$.ajax({
        type: 'PUT', url: '/photos/1?nonce=123123123', headers: AJAX_AUTHORIZATION_HEADERS,
        data: JSON.stringify({ photo: { id: 1, name: 'Life' } })
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(1)) });
      });
    });

    it('DELETE /resources/:id works with custom headers, queryParams and responses', async function() {
      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1', headers: AJAX_AUTHORIZATION_HEADERS
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 500);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Invalid nonce to delete a photo' });
      });

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1?nonce=123123123', headers: AJAX_AUTHORIZATION_HEADERS
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 204);
      });
    });
  });

  describe('some edge cases', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        import Response from '../lib/response';

        export default function({ Photo }) {
          this.get('/photos', ({ queryParams }) => {
            const photos = Photo.find(queryParams.ids || []);

            if (!photos || photos.length === 0) {
              return Response(404, { error: 'Not found' });
            }

            return { photos: Photo.serializer(photos) };
          });

          this.get('http://izelnakri.com', () => {
            return Response(200, { result: 'external urls work!!' })
          })
        }
      `);
    });

    it('works for coalasceFindRequests routes', async function() {
      const MemServer = require('../../lib/index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 404);
        assert.deepEqual(jqXHR.responseJSON, { error: 'Not found' });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos?ids[]=1&ids[]=2', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(jqXHR.responseJSON, { photos: Photo.serializer(Photo.find([1, 2])) });
      });

      await window.$.ajax({
        type: 'GET', url: '/photos?ids[]=2&ids[]=3', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(jqXHR.responseJSON, { photos: Photo.serializer(Photo.find([2, 3])) });
      });
    });

    it('works for external links', async function() {
      const MemServer = require('../../lib/index.js');

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: 'http://izelnakri.com', headers: { 'Content-Type': 'application/json' }
      }).catch((jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(jqXHR.responseJSON, { result: 'external urls work!!' });
      });
    });
  });

});
