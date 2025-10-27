import fs from "node:fs";
import path from "node:path";
import * as calver from "calver";
import { Plugin } from "release-it";

/**
 * CalVerPlugin - a release-it plugin for managing version numbers using calver
 *
 * @see https://github.com/muratgozel/node-calver
 * @see https://github.com/release-it/release-it/blob/main/docs/plugins.md
 *
 */
export default class CalVerPlugin extends Plugin {
  static pkgPath = path.join(process.cwd(), "package.json");

  init() {
    const pkg = this._getPkgJson();
    const ctx = this.getContext();

    this.setContext({
      latestVersion: pkg.version,
      cycle: ctx.cycle ?? "month",
      delimiters: {
        date: ctx.delimiters?.date ?? "-",
        minor: ctx.delimiters?.minor ?? ".",
        prerelease: ctx.delimiters?.prerelease ?? "-",
      },
    });
  }

  getIncrementedVersion({ latestVersion, isPreRelease, preReleaseId }) {
    const { cycle, delimiters } = this.getContext();

    const nextCalVer = calver.cycle(calver.clean(latestVersion), { cycle: cycle });

    if (isPreRelease) {
      const tagPrefix = `${delimiters.prerelease}${preReleaseId}`;
      const dateChanged = calver.ot(latestVersion, nextCalVer, { cycle: cycle });

      // reset prerelease tag version if the date changed or the current version doesn't have the same passed prerelease id
      if (dateChanged || !latestVersion.includes(tagPrefix)) {
        return calver.suffix(nextCalVer, `${tagPrefix}.1`);
      }

      const nextTag = this._incrementPreReleaseTag(latestVersion, preReleaseId);

      return calver.suffix(nextCalVer, nextTag);
    }

    return nextCalVer;
  }

  getIncrementedVersionCI({ latestVersion, isPreRelease, preReleaseId }) {
    return this.getIncrementedVersion({ latestVersion, isPreRelease, preReleaseId });
  }

  bump(version) {
    const pkg = this._getPkgJson();
    pkg.version = version;
    fs.writeFileSync(CalVerPlugin.pkgPath, JSON.stringify(pkg, null, 2));
  }

  /**
   * incrementPreReleaseTag - increment the prerelease tag version
   *
   * @param latestVersion - latest version to increment
   * @param preReleaseId - prerelease id to increment
   */
  _incrementPreReleaseTag(latestVersion, preReleaseId) {
    const { delimiters } = this.getContext();

    const tagPrefix = `${delimiters.prerelease}${preReleaseId}`;

    const [_, tagVersion] = latestVersion.split(tagPrefix);

    const cleanTagVersion = tagVersion.replace(".", "");

    const nextTagVersion = String(Number(cleanTagVersion + 1));

    return `${tagPrefix}.${nextTagVersion}`;
  }

  /**
   * getPkgJson - get the contents of package.json
   */
  _getPkgJson() {
    try {
      const pkg = fs.readFileSync(CalVerPlugin.pkgPath, "utf8");
      return JSON.parse(pkg);
    } catch (error) {
      throw new Error(`Failed to parse package.json: ${error}`);
    }
  }
}
