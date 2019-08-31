const eslint = require("eslint");

const options = require("./options");
const request = require("./request");

const { GITHUB_ACTION, GITHUB_EVENT_PATH, GITHUB_SHA, GITHUB_TOKEN, GITHUB_WORKSPACE, RUN_DIR } = process.env;
const args = process.argv.slice(2);

const event = require(GITHUB_EVENT_PATH); /* eslint-disable-line import/no-dynamic-require */
const { repository } = event;
const { owner: { login: owner } } = repository;
const { name: repo } = repository;

const headers = {
  Accept: "application/vnd.github.antiope-preview+json",
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  "Content-Type": "application/json",
  "User-Agent": "eslint-action",
};

const levels = ["", "warning", "failure"];

// change the working directory if we're not running in the root of the repo
if (RUN_DIR) {
  process.chdir(RUN_DIR);
}

function translateOptions(cliOptions) {
  return {
    allowInlineConfig: cliOptions.inlineConfig,
    cache: cliOptions.cache,
    cacheFile: cliOptions.cacheFile,
    cacheLocation: cliOptions.cacheLocation,
    configFile: cliOptions.config,
    envs: cliOptions.env,
    extensions: cliOptions.ext,
    globals: cliOptions.global,
    ignore: cliOptions.ignore,
    ignorePath: cliOptions.ignorePath,
    ignorePattern: cliOptions.ignorePattern,
    parser: cliOptions.parser,
    parserOptions: cliOptions.parserOptions,
    plugins: cliOptions.plugin,
    reportUnusedDisableDirectives: cliOptions.reportUnusedDisableDirectives,
    resolvePluginsRelativeTo: cliOptions.resolvePluginsRelativeTo,
    rulePaths: cliOptions.rulesdir,
    rules: cliOptions.rule,
    useEslintrc: cliOptions.eslintrc,
  };
}

async function createCheck() {
  const body = {
    head_sha: GITHUB_SHA,
    name: GITHUB_ACTION,
    started_at: new Date(),
    status: "in_progress",
  };

  const { data } = await request(
    `https://api.github.com/repos/${owner}/${repo}/check-runs`,
    {
      body,
      headers,
      method: "POST",
    },
  );

  return data.id;
}

async function runESLint() {
  const currentOptions = options.parse(args.join(" ") || "./");

  const files = currentOptions._;

  const cli = new eslint.CLIEngine(translateOptions(currentOptions));
  const report = cli.executeOnFiles(files);

  const { results, errorCount, warningCount } = report;

  const annotations = [];

  results.forEach((result) => {
    const { filePath, messages } = result;

    messages.forEach((resultMessage) => {
      const { severity, ruleId, line, column, message } = resultMessage;

      annotations.push({
        annotation_level: levels[severity],
        end_column: column,
        end_line: line,
        message: `[${ruleId}] ${message}`,
        path: filePath.substring(GITHUB_WORKSPACE.length + 1),
        start_column: column,
        start_line: line,
      });
    });
  });

  return {
    conclusion: errorCount ? "failure" : "success",
    output: {
      annotations,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
      title: GITHUB_ACTION,
    },
  };
}

async function updateCheck(id, conclusion, output) {
  const body = {
    completed_at: new Date(),
    conclusion,
    head_sha: GITHUB_SHA,
    name: GITHUB_ACTION,
    output,
    status: "completed",
  };

  await request(
    `https://api.github.com/repos/${owner}/${repo}/check-runs/${id}`,
    {
      body,
      headers,
      method: "PATCH",
    },
  );
}

function exitWithError(err) {
  console.error("Error", err.stack);

  if (err.data) {
    console.error(err.data);
  }

  process.exit(1);
}

async function run() {
  const id = await createCheck();

  try {
    const { conclusion, output } = await runESLint();
    console.info(output.summary);

    await updateCheck(id, conclusion, output);

    if (conclusion === "failure") {
      process.exit(78);
    }
  } catch (err) {
    await updateCheck(id, "failure");

    exitWithError(err);
  }
}

run().catch(exitWithError);
