---
applyTo: '**/package.json'
description: "Guidelines for managing NPM packages"
---

- always update packages up their latest compatible versions
- do not use `^` or `~`
- use `ncu` CLI to determine the latest version of packages
- for Angular package updates, use `ng update` CLI because it correctly migrates code
- ALWAYS understand and resolve all `npm warn` messages and `npm audit` issues
