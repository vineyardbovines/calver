# @vineyardbovines/calver

Calendar Versioning (CalVer) plugin for [release-it](https://github.com/release-it/release-it) and template for [auto-changelog](https://github.com/release-it/auto-changelog). Uses a fork of [node-calver](https://github.com/muratgozel/node-calver) that modifies the version calculation to expect a format NPM will accept.

## Usage

```bash
# with package manager of choice
bun add -D @vineyardbovines/release-it-calver
# install peers
bun add -D release-it auto-changelog
```

### release-it

In your release-it configuration:

```json
// .release-it.json
{
  "plugins": {
    "@vineyardbovines/calver": {
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

Available plugin options for version customization:

**The format of version is always separated by `.` (dot)**. This is so that NPM will accept the version; versions split with other delimiters like `-` are invalid. The exception is prereleases, which are separated by `-` (dash).

The plugin will automatically increment the tag version if you've set `prerelease: true` in your release-it config.

**If the date has changed between releases**, the version will get reset to the next appropraite calver version, and minor/prerelease tags will be reset to `1`.

### auto-changelog

In your auto-changelog configuration, you'll have to copy/paste `changelog-template.hbs` into your project and then update your auto-changelog config:

```json
// .auto-changelog
{
  "template": "./<path>/<to>/changelog-template.hbs",
  // important so auto-changelog recognizes calver tags
  "tagPattern": "^\\d{4}\\.\\d{1,2}\\.\\d+(-[a-zA-Z0-9.-]+)?$",

  // other recommended options
  "package": "./package.json",
  "unreleased": true,
  "commitLimit": false,
  "ignoreCommitPattern": "^release:",
  "sortCommits": "date-desc",
}
```
