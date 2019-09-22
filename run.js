// @ts-check

const eslint = require("eslint");
const { getInput, setFailed } = require("@actions/core");
const { context, GitHub } = require("@actions/github");

const options = require("./options");

const { GITHUB_WORKSPACE, RUN_DIR } = process.env;
const args = process.argv.slice(2);

const githubClient = new GitHub(getInput("repo-token", { required: true }));

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
  const { data } = await githubClient.checks.create({
    ...context.repo,
    head_sha: context.sha,
    name: context.action,
    started_at: new Date().toISOString(),
    status: "in_progress",
  });

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
      title: context.action,
    },
  };
}

async function updateCheck(id, conclusion, output) {
  await githubClient.checks.update({
    ...context.repo,
    check_run_id: id,
    completed_at: new Date().toISOString(),
    conclusion,
    output,
    status: "completed",
  });
}

async function run() {
  const id = await createCheck();

  try {
    const { conclusion, output } = await runESLint();
    console.info(output.summary);

    await updateCheck(id, conclusion, output);

    if (conclusion === "failure") {
      setFailed("ESLint found errors");
    }
  } catch (error) {
    setFailed(error.message);
    await updateCheck(id, "failure");
    throw error;
  }
}

run();
