const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');

const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
                          export default Model({});`;

describe('MemServer.Response Interface', function() {
  before(function(done) {
    fs.mkdirSync(`./memserver`);
    fs.mkdirSync(`./memserver/models`);
    fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
    fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
      export default function(Models) {
        const { Photo } = Models;

        this.get('/photos', () => {
          const photos = Photo.findAll();

          return [200, {'Content-Type': 'application/json'}, JSON.stringify({ photos: Photo.serializer(photos) })]
        });
      }`);
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
    fs.writeFileSync(`${process.cwd()}/memserver/fixtures/users.js`, `export default [
      {
        id: 1,
        first_name: 'Izel',
        last_name: 'Nakri'
      }
    ]`);

    done();
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

  it('can be used outside the server file', function(done) {
    this.timeout(5000);

    const MemServer = require('../index.js');
    const Response = require('../lib/mem-server/response.js').default;

    MemServer.start();

    const { Server } = MemServer;
    const { Photo, User } = MemServer.Models;

    Server.get('/users/:id', (request) => {
      const user = User.find(Number(request.params.id));

      if (user) {
        return Response(200, { user: User.serializer(user) });
      }
    });

    window.$.getJSON('/users/1', (data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(data, { user: { id: 1, first_name: 'Izel', last_name: 'Nakri' } });

      done();
    });
  });

  it('can be used inside the server file', function(done) {
    this.timeout(5000);

    const MemServer = require('../index.js');
    const Response = require('../lib/mem-server/response.js').default;

    MemServer.start();

    const { Server } = MemServer;
    const { Photo, User } = MemServer.Models;

    window.$.getJSON('/photos', (data, textStatus, jqXHR) => {
      assert.equal(jqXHR.status, 200);
      assert.deepEqual(data, { photos: Photo.findAll() });

      done();
    });
  });

  it('can overwrite an existing server route', function(done) {
    this.timeout(5000);

    const MemServer = require('../index.js');
    const Response = require('../lib/mem-server/response.js').default;

    MemServer.start();

    const { Server } = MemServer;
    const { Photo, User } = MemServer.Models;

    Server.get('/photos', () => Response(500, { error: 'Internal Server Error'} ));

    window.$.getJSON('/photos').fail((jqXHR) => {
      assert.equal(jqXHR.status, 500);
      assert.deepEqual(jqXHR.responseJSON, { error: 'Internal Server Error' });

      done();
    });
  });
});
