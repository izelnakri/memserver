export default async function() {
  if (process.cwd().includes('memserver')) {
    throw new Error(chalk.red('[MemServer CLI] You are in the memserver directory, go to the root of your project to start memserver console.'));
  }

  const MemServer = (await import('./lib/index.js')).default;
  const repl = (await import('repl')).default;

  console.log(chalk.cyan('[MemServer CLI]'), 'Starting MemServer node.js console - Remember to MemServer.start() ;)');
  repl.start('> ');
}
