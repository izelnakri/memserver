require('babel-register')({
  presets: ['env']
});

const assert = require('assert');
const { generateUUID, primaryKeyTypeSafetyCheck } = require('../lib/mem-server/utils.js');

describe('MemServer Utils Unit tests', function() {
  it('exports generateUUID correctly', function() {
    const UUIDs = Array.from({ length: 10 }).map(() => generateUUID());

    assert.equal(UUIDs.length, 10);
    UUIDs.forEach((currentUUID) => {
      assert.equal(currentUUID.length, 36);
      assert.equal(UUIDs.filter((uuid) => uuid === currentUUID).length, 1);
    })
  })

  it('exports primaryKeyTypeSafetyCheck correctly', function() {
    assert.throws(() => primaryKeyTypeSafetyCheck('id', '22', 'Photo'), (err) => {
      return (err instanceof Error) &&
      /MemServer Photo model primaryKey type is 'id'. Instead you've tried to enter id: 22 with string type/.test(err);
    });
    assert.doesNotThrow(() => primaryKeyTypeSafetyCheck('id', 22, 'Photo'), Error);
    assert.throws(() => primaryKeyTypeSafetyCheck('uuid', 22, 'PhotoComment'), (err) => {
      return (err instanceof Error) &&
      /MemServer PhotoComment model primaryKey type is 'uuid'. Instead you've tried to enter uuid: 22 with number type/.test(err);
    });
    assert.doesNotThrow(() => primaryKeyTypeSafetyCheck('uuid', '166a435d-ad3d-4662-9f6f-04373280a38b', 'PhotoComment'), Error);
  });
});
