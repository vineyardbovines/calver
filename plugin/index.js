import fs from "node:fs";
import path from "node:path";
import { Plugin } from "release-it";
import * as calver from "../calver.js";

const DEFAULT_CYCLE = "month";
const DELIMITER = ".";
const PRERELEASE_DELIMITER = "-";

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
      cycle: ctx.cycle ?? DEFAULT_CYCLE,
    });
  }

  getInitialOptions(options, pluginName) {
    return Object.assign({}, options[pluginName], {
      npmPublish: options.npm?.publish,
    });
  }

  getIncrementedVersion({ latestVersion, isPreRelease, preReleaseId }) {
    const { cycle } = this.getContext();
    console.log("clean", calver.clean(latestVersion));
    console.log("cycle", cycle);

    const nextCalVer = calver.cycle(calver.clean(latestVersion), { cycle });
    console.log("nextCalVer", nextCalVer);

    if (isPreRelease) {
      const tagPrefix = `${PRERELEASE_DELIMITER}${preReleaseId}`;
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
    const tagPrefix = `${PRERELEASE_DELIMITER}${preReleaseId}`;

    const [_, tagVersion] = latestVersion.split(tagPrefix);

    const cleanTagVersion = tagVersion.replace(DELIMITER, "");

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
