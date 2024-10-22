#!/bin/bash
# If it doesn't exist, clone the repository
rm -Rf vscode-custom-extensions
git clone git@github.com:digital-logic-and-computer-design/vscode-custom-extensions.git

# Update the latest and rename the files
cd vscode-custom-extensions
# Show the file version in ext_vers.txt
ls *.vsix > ext_vers.txt
# if any files have a name like NAME-version.vsix, then rename them to NAME.vsix
if test -n "$(find . -maxdepth 1 -name '*-*.*.vsix' -print -quit)" 
then
    for f in *-*.vsix; do mv -- "$f" "${f%-*}.vsix"; done
    # Rename files to remove the -dlca suffix
    for f in *-dlacd.vsix; do mv -- "$f" "${f%-dlacd*}.vsix"; done
fi
# Just the extensions. Not as a sub-module.
rm -Rf .git