export const CALVER_CYCLES: readonly ["auto", "year", "month", "week", "day"];

export type CalverCycle = typeof CALVER_CYCLES[number];

export interface CalverSettings {
  cycle: CalverCycle;
}

export interface CalverVersion {
  year: number;
  month?: number;
  week?: number;
  day?: number;
  minor: number;
}

/**
 * Extracts and returns the first valid calver version string from the input text
 * @param str - String containing a calver version
 * @returns The cleaned calver version string
 * @throws Error if no valid calver version is found
 */
export function clean(str: string): string;

/**
 * Appends a suffix to a version string
 * @param str - The version string
 * @param suffix - Optional suffix to append
 * @returns The version string with suffix appended
 */
export function suffix(str: string, suffix?: string): string;

/**
 * Prepends a prefix to a version string
 * @param str - The version string
 * @param prefix - Prefix to prepend (defaults to "v")
 * @returns The version string with prefix prepended
 */
export function prefix(str: string, prefix?: string): string;

/**
 * Generates the initial version string for the given release cycle
 * @param settings - Settings containing the release cycle
 * @returns The initial version string
 * @throws Error if the release cycle is invalid
 */
export function initial(settings: CalverSettings): string;

/**
 * Checks if the first version is newer than the second version
 * @param newer - The potentially newer version string
 * @param older - The potentially older version string
 * @param settings - Optional settings (defaults to auto cycle)
 * @returns True if newer is newer than older
 */
export function nt(newer: string, older: string, settings?: CalverSettings): boolean;

/**
 * Checks if the first version is older than the second version
 * @param older - The potentially older version string
 * @param newer - The potentially newer version string
 * @param settings - Optional settings (defaults to auto cycle)
 * @returns True if older is older than newer
 */
export function ot(older: string, newer: string, settings?: CalverSettings): boolean;

/**
 * Generates the next version string based on the current version and date
 * @param str - The current version string
 * @param settings - Optional settings (defaults to auto cycle)
 * @returns The next version string
 */
export function cycle(str: string, settings?: CalverSettings): string;

/**
 * Validates a calver version string
 * @param str - The version string to validate
 * @param settings - Optional settings (defaults to auto cycle)
 * @returns The validated version string
 * @throws Error if the version string is invalid
 */
export function valid(str: string, settings?: CalverSettings): string;

/**
 * Parses a calver version string into its component parts
 * @param str - The version string to parse
 * @param settings - Optional settings (defaults to auto cycle)
 * @returns The parsed version object
 * @throws Error if the version string is invalid or doesn't match the specified cycle
 */
export function parse(str: string, settings?: CalverSettings): CalverVersion;

/**
 * Converts a CalverVersion object to a string representation
 * @param obj - The version object to convert
 * @returns The version string (e.g., "2024-10-27.5")
 */
export function toCalVerString(obj: CalverVersion): string;

/**
 * Checks if a cycle string is valid
 * @param str - The cycle string to validate
 * @param allowAuto - Whether to allow "auto" as a valid cycle (defaults to true)
 * @returns True if the cycle is valid
 */
export function isCycleValid(str: string, allowAuto?: boolean): boolean;
