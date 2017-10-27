// const assert = require('assert');
// const fs = require('fs');
// const rimraf = require('rimraf');
//
// const modelFileContent = `import Model from '${process.cwd()}/lib/mem-server/model';
//                           export default Model({});`;
//
// describe('MemServer.Model Serialize Interface', function() {
//   before(function(done) {
//     fs.mkdirSync(`./memserver`);
//     fs.mkdirSync(`./memserver/models`);
//     fs.writeFileSync(`${process.cwd()}/memserver/models/user.js`, modelFileContent);
//     fs.writeFileSync(`${process.cwd()}/memserver/server.js`, 'export default function(Models) {}');
//     fs.mkdirSync(`./memserver/fixtures`);
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
//     done();
//   });
//
//   after(function(done) {
//     if (fs.existsSync(`${process.cwd()}/memserver`)) {
//       rimraf.sync(`${process.cwd()}/memserver`);
//     }
//     done();
//   });
//
//   beforeEach(function() {
//     Object.keys(require.cache).forEach((key) => delete require.cache[key]);
//   });
//
//   it('can serialize a model', function() {
//     const MemServer = require('../index.js');
//     const { Photo, PhotoComment } = MemServer.Models;
//
//     MemServer.start();
//
//     const photo = Photo.find(1);
//     const photoComment = PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5f29' });
//
//     assert.deepEqual(Photo.serialize(photo), {
//
//     });
//     assert.deepEqual(PhotoComment.serialize(photoComment), {
//
//     });
//   });
//
//   // it('can serialize models', function() {
//   //   const photos = Photo.findAll();
//   //   const photoComments = PhotoComment.findAll();
//   //
//   //   assert.deepEqual(Photo.serialize(photos), [
//   //
//   //   ]);
//   //   assert.deepEqual(PhotoComment.serialize(photoComments), [
//   //
//   //   ]);
//   // });
//   //
//   // it('can serialize empty record and record arrays', function() {
//   //   const notFoundPhoto = Photo.find(99);
//   //   const notFoundPhotos = Photo.findAll({ name: 'Wubba lubba dub' });
//   //   const notFoundComment = PhotoComment.findBy({ uuid: '374c7f4a-85d6-429a-bf2a-0719525f5111' });
//   //   const notFoundComments = Photo.findAll({ content: 'Aint easy' });
//   //
//   //   assert.deepEqual(Photo.serialize(notFoundPhoto), {});
//   //   assert.deepEqual(Photo.serialize(notFoundPhotos), []);
//   //   assert.deepEqual(PhotoComment.serialize(photoComment), {});
//   //   assert.deepEqual(PhotoComment.serialize(photoComments), []);
//   // });
//   //
//   // it('can serialize embeded records recursively', function() {
//   //   // NOTE: make photo embed comments embed users
//   // });
//
//   // TODO: serrialize embedding interface
// });
