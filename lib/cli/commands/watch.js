import buildCommand from './build.js';
import fs from 'fs-extra';

export default async function() {
  await buildCommand();

  fs.watch(`${process.cwd()}/memserver`, { recursive: true }, async () => {
    await buildCommand();
  });
}
