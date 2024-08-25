#!/bin/bash
# If it doesn't exist, clone the repository
if [ ! -d "vscode-custom-extensions" ]; then
    git clone git@github.com:digital-logic-and-computer-design/vscode-custom-extensions.git
fi

# Update the latest and rename the files
cd vscode-custom-extensions
git pull
# if any files have a name like NAME-version.vsix, then rename them to NAME.vsix
if test -n "$(find . -maxdepth 1 -name '*-*.*.vsix' -print -quit)" 
then
    for f in *-*.vsix; do mv -- "$f" "${f%-*}.vsix"; done
fi
# Just the extensions. Not as a sub-module.
rm -Rf .git