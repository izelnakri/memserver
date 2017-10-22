export default function(Models) {
  // this.namespace = '';

  this.get('/photos', () => {
    return { photos: Models.Photo.findAll() };
  });
}
