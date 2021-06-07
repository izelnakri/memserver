import fs from "fs/promises";
import { promisify } from 'util';
import { exec } from 'child_process';
import esbuild from "esbuild";
import kleur from "kleur";
import { pluralize } from "inflected";
import recursiveLookup from 'recursive-lookup';
import setupDom from "@memserver/server/dist/setup-dom.js";

const CWD = process.cwd();
const shell = promisify(exec);

export default async function (memserverDirectory = `${CWD}/memserver`) {
  if (!(await pathExists(`${memserverDirectory}/memserver`))) {
    throw new Error(kleur.red("/memserver folder doesn't exist for this directory!"));
  } else if (!(await pathExists(`${memserverDirectory}/memserver/models`))) {
    throw new Error(kleur.red("/memserver/models folder doesn't exist for this directory!"));
  } else if (!(await checkFile(`${memserverDirectory}/memserver/routes`))) {
    throw new Error(kleur.red("/memserver/routes.ts or js doesn't exist for this directory!"));
  } else if (!(await checkFile(`${memserverDirectory}/memserver/initializer`))) {
    throw new Error(kleur.red("/memserver/initializer.ts or js doesn't exist for this directory!"));
  }

  const IS_TYPESCRIPT = (await fs.readdir(`${memServerDirectory}/models`).some((modelFile) => modelFile.endsWith(".ts"));
  const modelImportDirectory = IS_TYPESCRIPT
    ? await buildTmpDirectory(memServerDirectory)
    : memServerDirectory;

  if (IS_TYPESCRIPT) {
    const fixtureFiles = (await fs.readdir(`${memServerDirectory}/fixtures`));
    await esbuild.build({
      entryPoints: await recursiveLookup(memserverDirectory, (path) => ['.js', '.ts'].some((extension) => path.endsWith(extension))),
      bundle: true,
      logLevel: "error",
      write: true,
      outdir: modelImportDirectory,
    });

    let fileAbsolutePaths = await recursiveLookup(modelImportDirectory, (path) => path.endsWith('.js'));
    await Promise.all(fileAbsolutePaths.map((fileAbsolutePath) => {
      return shell(`babel ${fileAbsolutePath} --plugins babel-plugin-module-extension-resolver -o ${fileAbsolutePath}`);
    }));
  }

  await setupDom();

  window.Memserver = (await import("@memserver/server")).default;

  const [initializerModule, routesModule] = await Promise.all([
    import(`${modelImportDirectory}/initializer.js`),
    import(`${modelImportDirectory}/routes.js`),
  ]);

  window.memserver = new window.Memserver({
    globalizeModules: true,
    globalizeModels: true,
    initializer: initializerModule.default,
    routes: routesModule.default,
  });

  return window.memserver;
}

async function checkFile(filePath) {
  return (await pathExists(`${filePath}.ts`)) || (await pathExists(`${filePath}.js`));
}

async function pathExists(path) {
  try {
    await fs.access(path);

    return true;
  } catch {
    return false;
  }
}

async function buildTmpDirectory(memServerDirectory) {
  let paths = memServerDirectory.split("/");
  let tmpDirectory = paths
    .slice(0, paths - 1)
    .concat(["tmp", "memserver"])
    .join("/");

  await fs.mkdir(tmpDirectory, { recursive: true, force: true });

  return tmpDirectory;
}

