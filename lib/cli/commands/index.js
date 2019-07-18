import chalk from 'ansi-colors';

export default async function() {
  const config = (await import('../../../package.json')).default;
  const highlight = (text) => chalk.bold.cyan(text);

  console.log(`${highlight('[MemServer CLI v' + config.version + '] Usage:')} memserver ${chalk.yellow('<command (Default: help)>')}

memserver init | new                    # Sets up the initial memserver folder structure
memserver generate model ${chalk.yellow('[ModelName]')}    # Generates the initial files for a MemServer Model ${chalk.cyan('[alias: "memserver g model"]')}
memserver generate fixtures             # Outputs your initial MemServer state as pure javascript fixture files
memserver generate fixtures ${chalk.yellow('[ModelName]')} # Outputs your initial MemServer state for certain model as pure javascript fixture
memserver console                       # Starts a MemServer console in node.js ${chalk.cyan('[alias: "memserver c"]')}
memserver serve | server ${chalk.yellow('[outputFile]')}   # Builds an ES5 javascript bundle with all your memserver code continuosly on watch ${chalk.cyan('[alias: "memserver s"]')}
memserver build | rollup ${chalk.yellow('[outputFile]')}   # Builds an ES5 javascript bundle with all your memserver code
memserver version | v                   # Displays memserver version
`);
}
