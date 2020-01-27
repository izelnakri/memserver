import fs from "fs-extra";
import util from "util";
import child_process from "child_process";
import chalk from "ansi-colors";
import emberCliStringUtils from "ember-cli-string-utils";
import i from "i";

if (process.env.NODE_ENV === "test") {
  chalk.enabled = false;
}

const { classify, dasherize, underscore } = emberCliStringUtils;
const { pluralize, singularize } = i();
const CLI = {
  default(commandHandler) {
    !process.argv[2] ? commandHandler() : null;
  },
  command(commandName, commandHandler) {
    if (Array.isArray(commandName)) {
      return commandName.includes(process.argv[2]) ? commandHandler() : null;
    }

    commandName === process.argv[2] ? commandHandler() : null;
  }
};

CLI.default(printCommands);
CLI.command(["help", "h"], printCommands);
CLI.command(["init", "new"], async () => {
  let memServerDirectory = await getMemServerDirectory();

  if (!memServerDirectory) {
    memServerDirectory = "./memserver";
    await fs.mkdir(memServerDirectory);
  }

  if (!(await fs.pathExists(`${memServerDirectory}/server.js`))) {
    await fs.writeFile(
      `${memServerDirectory}/server.js`,
      `export default function(Models) {
}`
    );
    console.log(chalk.cyan("[MemServer CLI] /memserver/server.js created"));
  }

  if (!(await fs.pathExists(`${memServerDirectory}/initializer.js`))) {
    await fs.writeFile(
      `${memServerDirectory}/initializer.js`,
      `export default function(Models) {
}`
    );
    console.log(
      chalk.cyan("[MemServer CLI] /memserver/initializer.js created")
    );
  }

  await createFixtureAndModelFoldersIfNeeded(memServerDirectory);
});
CLI.command(["generate", "g"], async () => {
  const memServerDirectory = await getMemServerDirectory();
  const generationType = process.argv[3];

  if (!memServerDirectory) {
    return console.log(
      chalk.red(
        "[MemServer CLI] cannot find /memserver folder. Did you run $ memserver init ?"
      )
    );
  } else if (!generationType) {
    return console.log(
      chalk.red(
        "[MemServer CLI] generate should be either $ memserver g model [modelName] or $ memserver g fixtures"
      )
    );
  } else if (generationType === "model") {
    return await generateModel(process.argv[4], memServerDirectory);
  } else if (generationType === "fixtures") {
    return await generateFixtures(process.argv[4], memServerDirectory);
  }

  console.log(
    chalk.red(
      `[MemServer CLI] $ memserver ${process.argv[2]} ${
        process.argv[3]
      } ${process.argv[4] || ""} does not exists, available commands:`
    )
  );

  return printCommands();
});
CLI.command(["console", "c"], async () => await openConsole());
CLI.command(["version", "v"], async () => {
  console.log(
    chalk.cyan("[MemServer CLI]"),
    JSON.parse((await fs.readFile("./package.json")).toString()).version
  );
});

async function printCommands() {
  const config = JSON.parse((await fs.readFile("./package.json")).toString());
  const highlight = text => chalk.bold.cyan(text);

  console.log(`${highlight(
    "[MemServer CLI v" + config.version + "] Usage:"
  )} memserver ${chalk.yellow("<command (Default: help)>")}

memserver init | new                    # Sets up the initial memserver folder structure
memserver generate model ${chalk.yellow(
    "[ModelName]"
  )}    # Generates the initial files for a MemServer Model ${chalk.cyan(
    '[alias: "memserver g model"]'
  )}
memserver generate fixtures             # Outputs your initial MemServer state as pure javascript fixture files
memserver generate fixtures ${chalk.yellow(
    "[ModelName]"
  )} # Outputs your initial MemServer state for certain model as pure javascript fixture
memserver console                       # Starts a MemServer console in node.js ${chalk.cyan(
    '[alias: "memserver c"]'
  )}`);
}

async function generateModel(modelName, memServerDirectory) {
  if (!modelName) {
    return console.log(
      chalk.red(
        "[MemServer CLI] Please put a modelName to the memserver generate. Example: $ memserver generate model user"
      )
    );
  }

  await createFixtureAndModelFoldersIfNeeded(memServerDirectory);

  const modelFileName = dasherize(singularize(modelName));
  const fixtureFileName = dasherize(pluralize(modelName));

  if (
    !(await fs.pathExists(`${memServerDirectory}/models/${modelFileName}.js`))
  ) {
    await fs.writeFile(
      `${memServerDirectory}/models/${modelFileName}.js`,
      `import Model from 'memserver/model';

export default Model({

});`
    );
    console.log(
      chalk.cyan(
        `[MemServer CLI] /memserver/models/${modelFileName}.js created`
      )
    );
  }

  if (
    !(await fs.pathExists(
      `${memServerDirectory}/fixtures/${fixtureFileName}.js`
    ))
  ) {
    await fs.writeFile(
      `${memServerDirectory}/fixtures/${fixtureFileName}.js`,
      `export default [
];`
    );
    console.log(
      chalk.cyan(
        `[MemServer CLI] /memserver/fixtures/${fixtureFileName}.js created`
      )
    );
  }
}

async function generateFixtures(modelName, memServerDirectory) {
  const MemServer = await import("./index.js"); // TODO: problem

  MemServer.start();

  const targetModels = modelName
    ? [classify(singularize(modelName))]
    : Object.keys(MemServer.DB);

  targetModels.forEach(async Model => {
    const sortedState = MemServer.DB[Model].sort(sortFunction);
    const arrayOfRecords = util.inspect(sortedState, {
      depth: null,
      maxArrayLength: null
    });

    const targetFileName = pluralize(dasherize(underscore(Model)));
    const fileRelativePath = `/fixtures/${targetFileName}.js`;
    const fileAbsolutePath = `${memServerDirectory}${fileRelativePath}`;

    if (await fs.pathExists(fileAbsolutePath)) {
      const previousModels = (await import(fileAbsolutePath)).default;

      if (
        JSON.stringify(previousModels.sort(sortFunction)) ===
        JSON.stringify(sortedState)
      ) {
        return;
      }
    }

    await fs.writeFile(
      fileAbsolutePath,
      `export default ${arrayOfRecords};`,
      () => {
        // TODO: make this beter formatted
        console.log(
          chalk.yellow(`[MemServer] data written to ${fileRelativePath}`)
        );
      }
    );
  });
}

async function createFixtureAndModelFoldersIfNeeded(memServerDirectory) {
  if (!(await fs.pathExists(`${memServerDirectory}/fixtures`))) {
    await fs.mkdir(`${memServerDirectory}/fixtures`);

    console.log(
      chalk.cyan("[MemServer CLI] /memserver/fixtures folder created")
    );
  }

  if (!(await fs.pathExists(`${memServerDirectory}/models`))) {
    await fs.mkdir(`${memServerDirectory}/models`);

    console.log(chalk.cyan("[MemServer CLI] /memserver/models folder created"));
  }
}

async function openConsole() {
  if (process.cwd().includes("memserver")) {
    throw new Error(
      chalk.red(
        "[MemServer CLI] You are in the memserver directory, go to the root of your project to start memserver console."
      )
    );
  }

  const MemServer = (await import("./index")).default; // TODO: change
  const repl = (await import("repl")).default;

  console.log(
    chalk.cyan("[MemServer CLI]"),
    "Starting MemServer node.js console - Remember to MemServer.start() ;)"
  );
  repl.start("> ");
}

async function getMemServerDirectory() {
  const cwd = process.cwd();
  const folders = cwd.split("/");
  const memServerIndex = folders.findIndex(path => path === "memserver");

  if (memServerIndex !== -1) {
    return folders.slice(0, memServerIndex + 1).join("/");
  } else if ((await fs.readdir(".")).includes("memserver")) {
    return `${cwd}/memserver`;
  }
}

function sortFunction(a, b) {
  if (a.id > b.id) {
    return 1;
  } else if (a.id < b.id) {
    return -1;
  }

  return 0;
}