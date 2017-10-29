// // TODO: test Response first
// const assert = require('assert');
// const AUTHENTICATION_TOKEN = 'ec25fc7b-6ee2-4bda-b57c-6c9867b30ff4';
//
// describe('MemServer.Server', function() {
//   before(function() {
//     fs.mkdirSync(`./memserver`);
//     fs.mkdirSync(`./memserver/models`);
//     fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, `
//       import Model from '${process.cwd()}/lib/mem-server/model';
//
//       export default Model({
//         findFromToken(request) {
//           const authorizationHeader = request.requestHeaders.Authorization;
//           const token = authorizationHeader ? authorizationHeader.slice(4) : null;
//
//           console.log('token');
//
//           return this.findBy({ authentication_token: token });
//         }
//       });
//     `);
//     fs.writeFileSync(`${process.cwd()}/memserver/models/photo.js`, `
//       import Model from '${process.cwd()}/lib/mem-server/model';
//
//       export default Model({
//         defaultAttributes: {
//           is_public: true,
//           name() {
//             return 'Some default name';
//           }
//         }
//       });
//     `);
//     fs.writeFileSync(`${process.cwd()}/memserver/models/photo-comment.js`, `
//       import Model from '${process.cwd()}/lib/mem-server/model';
//
//       export default Model({
//         defaultAttributes: {
//           inserted_at() {
//             return '2017-10-25T20:54:04.447Z';
//           },
//           is_important: true
//         }
//       });
//     `);
//     fs.mkdirSync(`./memserver/fixtures`);
//     fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photo-comments.js`, `export default [
//       {
//         id: 1,
//         email: 'contact@izelnakri.com',
//         username: 'izelnakri',
//         authentication_token: '${AUTHENTICATION_TOKEN}'
//       }
//     ];`);
//     fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photos.js`, `export default [
//       {
//         id: 1,
//         name: 'Ski trip',
//         href: 'ski-trip.jpeg',
//         is_public: false
//       },
//       {
//         id: 2,
//         name: 'Family photo',
//         href: 'family-photo.jpeg',
//         is_public: true
//       },
//       {
//         id: 3,
//         name: 'Selfie',
//         href: 'selfie.jpeg',
//         is_public: false
//       }
//     ];`);
//     fs.writeFileSync(`${process.cwd()}/memserver/fixtures/photo-comments.js`, `export default [
//       {
//         uuid: '499ec646-493f-4eea-b92e-e383d94182f4',
//         content: 'What a nice photo!',
//         photo_id: 1,
//         user_id: 1
//       },
//       {
//         uuid: '77653ad3-47e4-4ec2-b49f-57ea36a627e7',
//         content: 'I agree',
//         photo_id: 1,
//         user_id: 2
//       },
//       {
//         uuid: 'd351963d-e725-4092-a37c-1ca1823b57d3',
//         content: 'I was kidding',
//         photo_id: 1,
//         user_id: 1
//       },
//       {
//         uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29',
//         content: 'Interesting indeed',
//         photo_id: 2,
//         user_id: 1
//       }
//     ];`);
//   });
//
//   beforeEach(function() {
//     Object.keys(require.cache).forEach((key) => delete require.cache[key]);
//   });
//
//   after(function(done) {
//     if (fs.existsSync(`${process.cwd()}/memserver`)) {
//       rimraf.sync(`${process.cwd()}/memserver`);
//     }
//
//     done();
//   });
//
//   // describe('route shortcuts work', function() {
//   //   before(function() {
//   //     fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
//   //       export default function(Models) {
//   //         this.post('/photos');
//   //         this.get('/photos');
//   //         this.get('/photos/:id');
//   //         this.put('/photos/:id');
//   //         this.delete('/photos/:id');
//   //       }
//   //     `);
//   //   });
//   //
//   //   it('POST /resources work with shortcut', function() {
//   //
//   //   });
//   //
//   //   it('GET /resources works with shortcut', function() {
//   //
//   //   });
//   //
//   //   it('GET /resources/:id works with shortcut', function() {
//   //
//   //   });
//   //
//   //   it('PUT /resources/:id works with shortcut', function() {
//   //
//   //   });
//   //
//   //   it('DELETE /resources/:id works with shortcut', function() {
//   //
//   //   });
//   // });
//
//   describe('server can process custom headers and responses', function() {
//     before(function() {
//       fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
//         import Response from '';
//
//         export default function(Models) {
//           this.post('/photos', ({ headers }) => {
//             const user = User.findFromToken(request);
//
//             if (!user) {
//               return Response(401, { error: 'Unauthorized' });
//             }
//
//             const photo = Photo.insert({ user_id: user.id });
//
//             return Photo.serialize(photo);
//           });
//
//           this.get('/photos'), ({ headers }) => {
//             const user = User.findFromToken(request);
//
//             if (!user) {
//               return Response(404, { error: 'Not found' });
//             }
//
//             const photos = Photo.findAll({ user_id: user.id });
//
//             return Photo.serialize(photos);
//           });
//
//           this.get('/photos/:id', ({ params, headers }) => {
//             const user = User.findFromToken(request);
//
//             if (!user) {
//               return Response(401, { error: 'Unauthorized' });
//             }
//
//             const photo = Photo.findBy({ id: params.id, user_id: user.id });
//
//             return photo ? Photo.serialize(photo) : Response(404, { error: 'Not found'})
//           });
//
//           this.put('/photos/:id', ({ params, headers }) => {
//             const user = User.findFromToken(request);
//
//             if (user && Photo.findBy({ id: params.id, user_id: user.id })) {
//               return Photo.update(request.params);
//             }
//           });
//
//           this.delete('/photos/:id', ({ params, headers }) => {
//             const user = User.findFromToken(request);
//
//             if (user && Photo.findBy({ id: params.id, user_id: user.id })) {
//               return Photo.delete(request.params); // NOTE: what to do with this response
//             }
//           });
//         }
//       `);
//     });
//
//     it('POST /resources work with custom headers and responses', function() {
//
//     });
//
//     // it('GET /resources works with custom headers and responses', function() {
//     //
//     // });
//     //
//     // it('GET /resources/:id works with custom headers and responses', function() {
//     //
//     // });
//     //
//     // it('PUT /resources/:id works with custom headers and responses', function() {
//     //
//     // });
//     //
//     // it('DELETE /resources/:id works with custom headers and responses', function() {
//     //
//     // });
//   });
// });
//
//   // describe('server can process custom queryParams and responses', function() {
//   //   fs.writeFileSync(`${process.cwd()}/memserver/server.js`, `
//   //     import Response from '';
//   //
//   //     export default function(Models) {
//   //       this.post('/photos', ({ headers, queryParams }) => {
//   //         const user = User.findFromToken(request);
//   //
//   //         if (!user && queryParams.is_admin) {
//   //           return Response(401, { error: 'Unauthorized' });
//   //         }
//   //
//   //         const photo = Photo.insert({ user_id: user.id });
//   //
//   //         return Photo.serialize(photo);
//   //       });
//   //
//   //       this.get('/photos'), ({ headers, queryParams }) => {
//   //         const user = User.findFromToken(request);
//   //
//   //         if (!user) {
//   //           return Response(404, { error: 'Not found' });
//   //         }
//   //
//   //         const photos = Photo.findAll(Object.assign({ user_id: user.id }, queryParams));
//   //
//   //         if (!photos) { // NOTE: change here maybe
//   //           return Response(404, { error: 'Not found' });
//   //         }
//   //
//   //         return Photo.serialize(photos);
//   //       });
//   //
//   //       this.get('/photos/:id', ({ params, headers, queryParams }) => {
//   //         const user = User.findFromToken(request);
//   //
//   //         if (!user) {
//   //           return Response(401, { error: 'Unauthorized' });
//   //         } else if (queryParams.nonce === '123123123') {
//   //           const photo = Photo.findBy({ id: params.id, user_id: user.id });
//   //
//   //           return photo ? Photo.serialize(photo) : Response(404, { error: 'Not found'})
//   //         }
//   //       });
//   //
//   //       this.put('/photos/:id', ({ params, headers, queryParams }) => {
//   //         const user = User.findFromToken(request);
//   //         const validRequest = user && queryParams.nonce === '123123123' &&
//   //           Photo.findBy({ id: params.id, user_id: user.id });
//   //
//   //         if (validRequest) {
//   //           return Photo.update(request.params);
//   //         }
//   //       });
//   //
//   //       this.delete('/photos/:id', ({ params, headers }) => {
//   //         const user = User.findFromToken(request);
//   //
//   //         if (!(queryParams.nonce === '123123123') {
//   //           return Response(500, { error: 'Invalid nonce to delete a photo' });
//   //         } else if (user && Photo.findBy({ id: params.id, user_id: user.id })) {
//   //           return Photo.delete(request.params); // NOTE: what to do with this response
//   //         }
//   //       });
//   //     }
//   //   `);
//
//     //   it('POST /resources work with custom headers, queryParams and responses', function() {
//     //
//     //   });
//     //
//     //   it('GET /resources works with custom headers, queryParams and responses', function() {
//     //
//     //   });
//     //
//     //   it('GET /resources/:id works with custom headers, queryParams and responses', function() {
//     //
//     //   });
//     //
//     //   it('PUT /resources/:id works with custom headers, queryParams and responses', function() {
//     //
//     //   });
//     //
//     //   it('DELETE /resources/:id works with custom headers, queryParams and responses', function() {
//     //
//     //   });
//   // });
//
//   // TODO: passthrough works
//   // NOTE: by default returning undefined should return Response(500) ?
// });
