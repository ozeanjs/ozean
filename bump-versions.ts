import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const bumpType = process.argv[2]; // 'major' | 'minor' | 'patch'
if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('❌ Invalid version bump type. Use: major | minor | patch');
  process.exit(1);
}

const packagesDir = path.resolve('packages');

// find subfolders that have a package.json file inside
const packagePaths = fs
  .readdirSync(packagesDir)
  .map((name) => path.join(packagesDir, name))
  .filter((dir) => fs.existsSync(path.join(dir, 'package.json')));

if (packagePaths.length === 0) {
  console.error('❌ No packages found in ./packages');
  process.exit(1);
}

let newVersion = '';

interface PackageInfo {
  path: string;
  json: any;
}

// Retrieve all package.json info
const packages: PackageInfo[] = packagePaths.map((pkgPath) => {
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  const content = fs.readFileSync(pkgJsonPath, 'utf-8');
  return {
    path: pkgJsonPath,
    json: JSON.parse(content),
  };
});

// Bump version number
const currentVersion = packages[0].json.version;
newVersion = bumpVersion(currentVersion);

function bumpVersion(version: string): string {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error('Invalid bump type');
  }
}

// Update version and dependencies
for (const pkg of packages) {
  pkg.json.version = newVersion;

  if (pkg.json.dependencies) {
    for (const depName of Object.keys(pkg.json.dependencies)) {
      const match = packages.find((p) => p.json.name === depName);
      if (match) {
        pkg.json.dependencies[depName] = newVersion;
      }
    }
  }

  fs.writeFileSync(pkg.path, JSON.stringify(pkg.json, null, 2) + '\n');
  console.log(`✅ Bumped ${pkg.json.name} to v${newVersion}`);
}

// Create release branch
const branchName = `release/v${newVersion}`;
console.log(`🚀 Creating branch: ${branchName}`);
execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

// git add & commit
console.log(`📦 Committing version bump`);
execSync(`git add .`, { stdio: 'inherit' });
execSync(`git commit -m "chore(release): bump version to v${newVersion}"`, {
  stdio: 'inherit',
});

console.log(`✅ Branch ${branchName} created and committed.`);
