# @vineyardbovines/calver

Calendar Versioning (CalVer) plugin for [release-it](https://github.com/release-it/release-it) and template for [auto-changelog](https://github.com/release-it/auto-changelog). Uses a fork of [node-calver](https://github.com/muratgozel/node-calver) that modifies the version calculation to expect a format NPM will accept.

## Usage

This package has 3 functionalities: release-it plugin, auto-changelog template, and a fork of [node-calver](https://github.com/muratgozel/node-calver) that modifies the version calculation to expect a format NPM will accept.

```bash
# with package manager of choice
npm add -D @vineyardbovines/calver
# install peers
npm add -D release-it auto-changelog
```

### calver

To use just the fork of node-calver, you can import the `calver` module and use the functions directly.

```js
import { clean, suffix, prefix, initial, nt, ot, cycle, valid, toCalVerString } from "@vineyardbovines/calver/calver";
```

### release-it

In your release-it configuration:

```json
// .release-it.json
{
  "plugins": {
    "@vineyardbovines/calver/plugin": {
      "cycle": "month"
    }
  }
}
```

If publishing to NPM:

```json
{
  "npm": {
    "publish": true,
    "ignoreVersion": true
  }
}
```

For full-fledged usage reference, look at this repo's own [release-it config](./.release-it.json).

**The format of version is always separated by `.` (dot)**. This is so that NPM will accept the version; versions split with other delimiters like `-` are invalid. The exception is prereleases, which are separated by `-` (dash).

The plugin will automatically increment the tag version if you've set `prerelease: true` in your release-it config.

**If the date has changed between releases**, the version will get reset to the next appropraite calver version, and minor/prerelease tags will be reset to `1`.

### auto-changelog

In your auto-changelog configuration, you can reference the template from this package by using the raw github URL. You'll also want to set the `tagPattern` to recognize calver tags.

```json
// .auto-changelog
{
  "template": "https://raw.githubusercontent.com/vineyardbovines/calver/refs/heads/main/template/changelog-template.hbs",
  // important so auto-changelog recognizes calver tags
  "tagPattern": "^\\d{4}\\.\\d{1,2}\\.\\d+(-[a-zA-Z0-9.-]+)?$",
  // sort in the date descending order
  "sortCommits": "date-desc",

  // other recommended options
  "package": "./package.json",
  "unreleased": true,
  "commitLimit": false,
  "ignoreCommitPattern": "^release:",
}
```
