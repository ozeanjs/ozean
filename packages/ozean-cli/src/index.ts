#!/usr/bin/env bun

import { Command } from 'commander';
import { execa } from 'execa';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

const pkg = require('../package.json');

const program = new Command();

program
  .version(pkg.version, '-v, --version', 'Output the current version')
  .description('A simple CLI for the Ozeanjs framework');

program
  .command('new <project-name>')
  .alias('n')
  .description('Create a new Ozean.js project')
  .action(async (projectName) => {
    const starterRepo = 'https://github.com/ozeanjs/ozean-starter.git';
    console.log(`🌊 Cloning starter repository into '${projectName}'...`);

    try {
      await execa('git', ['clone', starterRepo, projectName]);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const cliPackageJsonPath = path.join(__dirname, '..', 'package.json');
      const cliPackageJson = JSON.parse(await fs.readFile(cliPackageJsonPath, 'utf-8'));
      const cliVersion = cliPackageJson.version;
      console.log(`Syncing ozean version to CLI version: ^${cliVersion}`);

      const newProjectPackageJsonPath = path.join(process.cwd(), projectName, 'package.json');
      let newProjectPackageJson = JSON.parse(await fs.readFile(newProjectPackageJsonPath, 'utf-8'));

      if (newProjectPackageJson.dependencies && newProjectPackageJson.dependencies.ozean) {
        newProjectPackageJson.dependencies.ozean = `^${cliVersion}`;
      }

      await fs.writeFile(newProjectPackageJsonPath, JSON.stringify(newProjectPackageJson, null, 2));

      console.log('📦 Installing dependencies...');
      await execa('bun', ['install'], { cwd: projectName });

      await execa('rm', ['-rf', `${projectName}/.git`]);

      console.log(`✅ Successfully created project ${projectName}!`);
      console.log('To get started, run:');
      console.log(`  cd ${projectName}`);
      console.log(`  bun run index`);
    } catch (error) {
      console.error('❌ Failed to create project:', error);
    }
  });

program.parse(process.argv);

console.log('Welcome to Ozean CLI! 🌊');
