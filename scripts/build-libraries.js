import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import recursiveLookup from 'recursive-lookup';

const shell = promisify(exec);

let targetPackages = [
  '@memserver/model',
  '@memserver/response',
  '@memserver/server'
];

await targetPackages.reduce(async (lastCompile, packageName) => {
  await lastCompile;

  return buildPackage(packageName);
}, new Promise((resolve) => resolve()));


// TODO: maybe do not use --bundle due to cross reference:
async function buildPackage(packageName) {

  let targetFolder = `${process.cwd()}/packages/${packageName}`;

  await fs.rm(`${targetFolder}/dist`, { recursive: true, force: true });
  await fs.mkdir(`${targetFolder}/dist`, { recursive: true });

  // TODO: cannot use tsc for tests
  try {
    if (process.env.ENVIRONMENT === 'development') {
      await shell(`node_modules/.bin/esbuild $(find 'packages/${packageName}/src' -type f)  --outdir="./packages/${packageName}/dist"`);
    } else {
      await shell(`node_modules/.bin/tsc $(find 'packages/${packageName}/src' -type f ) --outDir packages/${packageName}/dist --module es2020 --target ES2018 --moduleResolution node --allowSyntheticDefaultImports true --experimentalDecorators true -d --allowJs`);
    }

    let fileAbsolutePaths = await recursiveLookup(`packages/${packageName}/dist`, (path) => path.endsWith('.js'));
    await Promise.all(fileAbsolutePaths.map((fileAbsolutePath) => {
      return shell(`node_modules/.bin/babel ${fileAbsolutePath} --plugins babel-plugin-module-extension-resolver -o ${fileAbsolutePath}`);
    }));
  } catch (error) {
    console.error(error);
  }
}

