import child_process from 'child_process';
import chalk from 'ansi-colors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// TODO: convert require.resolve();
//
export default async function() {
  const outputFile = process.argv[3] || 'memserver.dist.js';
  const rollup = child_process.spawnSync('rollup', [
    '--config', `${require.resolve('memserver')}/../../rollup.config.js`, '-o', outputFile
  ]);

  console.log(rollup.stderr.toString());
  console.log(chalk.cyan('[MemServer CLI]'), ` NEW BUILD: ${outputFile}`);
}
