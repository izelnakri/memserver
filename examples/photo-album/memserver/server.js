export default function(Models) {
  // this.namespace = '';
  // this.timing = '';

  // this.passthrough?

  this.get('/photos', () => {
    return { photos: Models.Photo.findAll() };
  });
}
