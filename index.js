#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');
const minimist = require('minimist');
const simpleGit = require('simple-git');
const semver = require('semver');
const jsonfile = require('jsonfile');


const argv = minimist(process.argv.slice(2));
const path = argv['path'] ? argv['path'] : 'package.json';
const git = simpleGit(process.cwd()).outputHandler(gitHandler);
const file = `${process.cwd()}/${path}`;
var package = jsonfile.readFileSync(file);

function error(msg) {
  console.log(chalk.red(`Error: ${msg}`));
}

function log(msg) {
  console.log(chalk.yellow(`${msg}`));
}

function missingType() {
  error('Missing semantic type\n');
  log('Usage: bump-tag-version major|minor|patch');
  process.exit(1);
}

function gitHandler(cmd, stdout, stderr) {
  stdout.pipe(process.stdout);
  stderr.pipe(process.stderr);
}

function bump(type, label) {
  const oldVersion = package.version;
  const newVersion = label ?
    semver.inc(oldVersion, type, label) :
    semver.inc(oldVersion, type);

  // package.json
  package.version = newVersion;
  jsonfile.writeFileSync(file, package, { spaces: 2 });

  // git tag
  git.addTag(newVersion);
  git.pushTags();

  console.log(chalk.green(`v${oldVersion} => v${newVersion}`));
}

function init() {
  try {
    if (package == null) {
      error('no package.json found');
      process.exit(1);
    }
    const typeArg = argv['_'];
    switch (typeArg[0]) {
      case 'major':
      case 'minor':
      case 'patch':
        bump(typeArg[0])
        break;
      case 'prerelease':
      case 'prepatch':
        bump(typeArg[0], typeArg[1]);
        break;
      default:
        bump('patch');
        break;
    }
  } catch (e) {
    error(e.stack);
    process.exit(1);
  }
  process.exit(0);
}

init();
