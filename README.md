# @vineyardbovines/calver

Calendar Versioning (CalVer) plugin for [release-it](https://github.com/release-it/release-it) and template for [auto-changelog](https://github.com/release-it/auto-changelog). Utilizes [node-calver](https://github.com/muratgozel/node-calver) for version calculation.

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

Available plugin options for version customization:

```
// release cadence
"cycle": "year" | "month" | "week" | "day"

// delimiters for version parts
"delimiters": {
  "date": "-" | "." | "_" | ""
  "minor": "." | "_" | ""
  "prerelease": "-" | "." | "_" | ""
}
```

The default delimiters are:
- date: "-"
- minor: "."
- prerelease: "-"

and the default cycle is `month`. Example output: `2025.10-1`. See [node-calver](https://github.com/muratgozel/node-calver) for examples of cycle output.

The plugin also supports prerelease tags and will automatically increment the tag version if you've set `prerelease: true` in your release-it config.

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
