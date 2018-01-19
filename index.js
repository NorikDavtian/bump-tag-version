#!/usr/bin/env node
const fs = require('fs');
const { join } = require('path');
const chalk = require('chalk');
const jsonfile = require('jsonfile');
const minimist = require('minimist');
const semver = require('semver');
const simpleGit = require('simple-git');

function error(msg) {
  console.log(chalk.red(`Error: ${msg}`));
  process.exit(1);
}

function log(msg) {
  console.log(chalk.yellow(`${msg}`));
}

(function () {
  // try {
  const git = simpleGit().outputHandler(function (cmd, stdout, stderr) {
    stdout.pipe(process.stdout);
    stderr.pipe(process.stderr);
  });

  const argv = minimist(process.argv.slice(2));
  const filename = argv['f'] || argv['file'] || 'package.json';
  const packagePath = join(process.cwd(), filename);
  const package = jsonfile.readFileSync(packagePath);

  function bump(type, label) {
    const oldVersion = package.version;
    const newVersion = label ?
      semver.inc(oldVersion, type, label) :
      semver.inc(oldVersion, type);

    // package.json
    package.version = newVersion;
    jsonfile.writeFileSync(packagePath, package, { spaces: 2 });

    // tags
    git.tag([newVersion]);
    git.pushTags('origin');

    console.log(chalk.green(`v${oldVersion} => v${newVersion}`));
  }

  if (package == null) {
    error('no package.json found, use -f or change directories');
  }

  const type = argv['_'];
  switch (type[0]) {
    case 'major':
    case 'minor':
    case 'patch':
      bump(type[0]);
      break;
    case 'prerelease':
    case 'prepatch':
      bump(type[0]);
      break;
    default:
      bump('patch');
      break;
  }
  // } catch (e) {
  //   error(e.stack);
  // }
  process.exit(0);
})();
