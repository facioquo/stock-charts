---
applyTo: "**/packages.json"
description: "Guidelines for managing NPM packages"
---

- always update packages to their latest compatible versions
- do not use `^` or `~`
- start with Angular package updates, use `ng update` CLI because it correctly migrates code
- use `ncu --peer` CLI to determine the latest version of packages
- ALWAYS understand and resolve all `npm warn` messages and `npm audit` issues

**Important information and examples**:

- use the highest version of Jest compatible with Angular, which may not be the latest Jest package

```bash
# from root of repository
cd $(git rev-parse --show-toplevel)

# start with
npm install

# (optional) install latest `ng` and `npm-check-updates` CLI tools
npm i -g @angular/cli npm-check-updates

# check for Angular package updates first, using ng CLI
cd web
ng update  # to determine Angular packages to update

# based on console output, update ng packages (example only)
ng update @angular/cli @angular/core @angular/material --allow-dirty

# then, from repo root folder, update all npm packages
# to latest non-prerelease peer compatible versions
cd $(git rev-parse --show-toplevel)
ncu -u --peer
npm install
```
