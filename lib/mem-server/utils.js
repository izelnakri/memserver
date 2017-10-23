export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

// export function getModelPrimaryKey(models) {
//   if (!models.length) {
//     return false;
//   }
//
//
//   // take random 3 elements from the array
//   // check if all of them has id, otherwise getModelPrimaryKey is uuid, check they have uuid
//   // models.
// }
