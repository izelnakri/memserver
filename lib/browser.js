import models from '_memserver_models';
import fixtures from '_memserver_fixtures'
import targetMemServer from '_memserver';
import MEMSERVER from './mem-server';

const modelFixtureTree = Object.keys(models).reduce((tree, modelName) => {
  return Object.assign({}, tree, {
    [modelName]: {
      model: models[modelName],
      fixtures: fixtures[modelName] || []
    }
  });
}, {});

const memserver = MEMSERVER(modelFixtureTree, targetMemServer);

export default memserver;
