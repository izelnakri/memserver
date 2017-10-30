const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

describe('MemServer.Server shortcut functionality', function() {
  before(function() {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
      import Model from '${process.cwd()}/lib/mem-server/model';

      export default Model({
        findFromHeaderToken(headers) {
          const authorizationHeader = headers.Authorization;
          const token = authorizationHeader ? authorizationHeader.slice(6) : false;

          return this.findBy({ authentication_token: token }) || false;
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

  describe('route shortcuts work', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        export default function(Models) {
          this.post('/photos');
          this.get('/photos');
          this.get('/photos/:id');
          this.put('/photos/:id');
          this.delete('/photos/:id');

        }
      `);
    });

    it('POST /resources work with shortcut', async function() {
      this.timeout(5000);

      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'POST', url: '/photos', headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ photo: { name: 'Izel Nakri' }})
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 201);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(4)) });
        assert.equal(Photo.count(), 4);
        assert.deepEqual(Photo.find(4), {
          id: 4, name: 'Izel Nakri', is_public: true, href: null, user_id: null
        })
      });
    });

    it('GET /resources works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'GET', url: '/photos', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photos: Photo.serializer(Photo.findAll()) });
        assert.equal(Photo.count(), 3);
      });
    });

    it('GET /resources/:id works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      await window.$.ajax({
        type: 'GET', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }).then((data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(Photo.find(1)) });
      });
    });

    it('PUT /resources/:id works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.find(1).name, 'Ski trip')

      await window.$.ajax({
        type: 'PUT', url: '/photos/1', headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ photo: { id: 1, name: 'New custom title'} })
      }, (data, textStatus, jqXHR) => {
        const photo = Photo.find(1);

        assert.equal(jqXHR.status, 200);
        assert.deepEqual(data, { photo: Photo.serializer(photo) });
        assert.equal(photo.name, 'New custom title');
      });
    });

    it('DELETE /resources/:id works with shortcut', async function() {
      const MemServer = require('../../index.js');
      const { Photo } = MemServer.Models;

      MemServer.start();

      assert.equal(Photo.count(), 3);

      await window.$.ajax({
        type: 'DELETE', url: '/photos/1', headers: { 'Content-Type': 'application/json' }
      }, (data, textStatus, jqXHR) => {
        assert.equal(jqXHR.status, 204);
        assert.deepEqual(data, {});
        assert.equal(Photo.count(), 2);
        assert.equal(PHoto.find(1), undefined);
      });
    });
  });

  // TODO: after this point
  it('throws an helpful error message when shortcuts model is not found', function() {

  });

  describe('this.resource() shortcut creates all the resource routes', function() {
    before(function() {
      fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
        export default function(Models) {
          this.resources('/photo-comments');

          this.get('/photos');
        }
      `);
    });

    it('this.resource() generates POST /resources route with shortcut logic', function() {

    });

    it('this.resource() generates GET /resources route with shortcut logic', function() {

    });

    it('this.resource() generates GET /resources/:id route with shortcut logic', function() {

    });

    it('this.resource() generates PUT /resources/:id route with shortcut logic', function() {

    });

    it('this.resource() generates DELETE /resources/:id route with shortcut logic', function() {

    });
  });

  describe('this.passthrough shortcut works', function() {
    // for external urls, for relative paths, general this.passthrough works
  });

  describe('Server route handlers default responses', function() {
    // TODO: by default returning undefined should return Response(500) ?

  });

  // TODO: throws an error when MemServer tries to intercept an undeclared route
});
