import chalk from 'ansi-colors';
import fs from 'fs-extra';

export default async function(memServerDirectory) {
  if (!(await fs.exists(`${memServerDirectory}/fixtures`))) {
    await fs.mkdirp(`${memServerDirectory}/fixtures`);

    console.log(chalk.cyan('[MemServer CLI] /memserver/fixtures folder created'));
  }

  if (!(await fs.exists(`${memServerDirectory}/models`))) {
    await fs.mkdirp(`${memServerDirectory}/models`);

    console.log(chalk.cyan('[MemServer CLI] /memserver/models folder created'));
  }
}

