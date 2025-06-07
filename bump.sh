#!/bin/sh

if [ -z "$1" ]; then
  echo "Error: Invalid version"
  echo "Please specify version e.g. sh bump.sh v1.0.0 or sh bump.sh [major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]"
  exit 1
fi

release_version=$(npm version --commit-hooks false --git-tag-version false $1)
if [ $? -ne 0 ]; then
  exit 1
fi

git branch release/$release_version
git checkout release/$release_version
git add .
git commit -m "Release $release_version"
