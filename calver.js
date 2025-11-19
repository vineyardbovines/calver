const CALVER_RE_SYNTAX = /^[0-9]{4}([.-][0-9]{1,2}([.-][0-9]{1,2})?)?([.-][0-9]+)?$/;
const CALVER_SEARCH_RE_SYNTAX = /[0-9]{4}([.-][0-9]{1,2}([.-][0-9]{1,2})?)?([.-][0-9]+)?/;
const CALVER_CALENDAR_PORTION_SEPARATOR = ".";
const CALVER_MINOR_PORTION_SEPARATOR = ".";
const CALVER_NUMBER_OF_WEEKS_IN_A_YEAR = 54;
const CALVER_NUMBER_OF_MONTHS_IN_A_YEAR = 12;
const CALVER_NUMBER_OF_DAYS_IN_A_MONTH = 31;
export const CALVER_CYCLES = ["auto", "year", "month", "week", "day"];

export function clean(str) {
  const result = str.match(CALVER_SEARCH_RE_SYNTAX);
  console.log("result", str);

  if (!result) {
    throw new Error("Failed to clean the text that was supposed to contain a calver version.");
  }

  return result[0];
}

export function suffix(str, suffix) {
  return str + (suffix ?? "");
}

export function prefix(str, prefix = "v") {
  return (prefix ?? "") + str;
}

export function initial(settings) {
  if (!isCycleValid(settings.cycle, false)) {
    throw new Error("Invalid release cycle");
  }

  const cycle = settings.cycle;
  const currentDate = getCurrentDate();
  const result = {
    year: currentDate.year,
    minor: 0,
  };

  if (cycle === "month") result.month = currentDate.month;
  if (cycle === "week") result.week = currentDate.week;
  if (cycle === "day") {
    result.month = currentDate.month;
    result.day = currentDate.day;
  }

  return toCalVerString(result);
}

export function nt(newer, older, settings = { cycle: "auto" }) {
  const n = parse(newer, { cycle: settings.cycle });
  const o = parse(older, { cycle: settings.cycle });

  if (settings.cycle === "week") {
    if (typeof n.week !== "number") n.week = 0;
    if (typeof o.week !== "number") o.week = 0;

    return (n.year >= o.year && n.week > o.week) || n.year > o.year;
  }

  const versionDateNative = new Date(
    n.year,
    typeof n.month === "number" ? n.month - 1 : 0,
    n.day ?? 0
  );
  const currentDateNative = new Date(
    o.year,
    typeof o.month === "number" ? o.month - 1 : 0,
    o.day ?? 0
  );
  return versionDateNative.getTime() > currentDateNative.getTime();
}

export function ot(older, newer, settings = { cycle: "auto" }) {
  return nt(newer, older, settings);
}

export function cycle(str, settings = { cycle: "auto" }) {
  const version = parse(str, settings);
  const cycle = settings.cycle !== "auto" ? settings.cycle : findCycle(version);
  const currentDate = getCurrentDate();
  const next = Object.assign({}, version);
  const isFuture = newerThan(version, currentDate);

  if (isFuture) {
    next.minor += 1;
  } else if (cycle === "year" && version.year !== currentDate.year) {
    next.year = currentDate.year;
    next.minor = 1;
  } else if (
    cycle === "month" &&
    (version.month !== currentDate.month || version.year !== currentDate.year)
  ) {
    next.year = currentDate.year;
    next.month = currentDate.month;
    next.minor = 1;
  } else if (
    cycle === "week" &&
    (version.week !== currentDate.week || version.year !== currentDate.year)
  ) {
    next.year = currentDate.year;
    next.week = currentDate.week;
    next.minor = 1;
  } else if (
    cycle === "day" &&
    (version.day !== currentDate.day ||
      version.month !== currentDate.month ||
      version.year !== currentDate.year)
  ) {
    next.year = currentDate.year;
    next.month = currentDate.month;
    next.day = currentDate.day;
    next.minor = 1;
  } else {
    next.minor += 1;
  }

  return toCalVerString(next);

  function newerThan(version, currentDate) {
    if (typeof version.week === "number") {
      return (
        (version.year >= currentDate.year && version.week > currentDate.week) ||
        version.year > currentDate.year
      );
    }

    const versionDateNative = new Date(
      version.year,
      typeof version.month === "number" ? version.month - 1 : 0,
      version.day ?? 0
    );
    const currentDateNative = new Date(currentDate.year, currentDate.month - 1, currentDate.day);
    return versionDateNative.getTime() > currentDateNative.getTime();
  }

  function findCycle(v) {
    if (typeof v.day === "number") return "day";
    else if (typeof v.week === "number") return "week";
    else if (typeof v.month === "number") return "month";
    else return "year";
  }
}

export function valid(str, settings = { cycle: "auto" }) {
  parse(str, { cycle: settings.cycle });
  return str;
}

function getCurrentDate() {
  const date = new Date(Date.now());

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    week: getUtcWeek(date),
    day: date.getUTCDate(),
  };

  function getUtcWeek(date) {
    const _date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = _date.getUTCDay() || 7;

    _date.setUTCDate(_date.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(_date.getUTCFullYear(), 0, 1));

    // @ts-expect-error
    return Math.ceil(((_date - yearStart) / 86400000 + 1) / 7);
  }
}

export function parse(str, settings = { cycle: "auto" }) {
  if (!CALVER_RE_SYNTAX.test(str)) {
    throw new Error("Invalid calver string: standard regex check failed");
  }

  const result = {
    year: parseInt(str.slice(0, 4), 10),
    minor: 0,
  };

  // Get everything after the year
  const afterYear = str.slice(4);
  if (!afterYear) {
    // Just a year
    if (!["auto", "year"].includes(settings.cycle)) {
      throw new Error("Version and cycle mismatch.");
    }
    return result;
  }

  // Split by separator and filter empty strings
  const parts = afterYear.split(/[.-]/).filter((p) => p !== "");

  if (parts.length === 0) {
    if (!["auto", "year"].includes(settings.cycle)) {
      throw new Error("Version and cycle mismatch.");
    }
    return result;
  }

  // Determine parsing based on cycle
  if (settings.cycle === "year") {
    // year cycle: year.minor
    if (parts.length === 1) {
      result.minor = parseInt(parts[0], 10);
    } else {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (settings.cycle === "month") {
    // month cycle: year.month or year.month.minor
    if (parts.length === 1) {
      result.month = parseInt(parts[0], 10);
      if (result.month > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        throw new Error(
          `The month ${result.month.toString()} is not a valid month number for a year.`
        );
      }
    } else if (parts.length === 2) {
      result.month = parseInt(parts[0], 10);
      result.minor = parseInt(parts[1], 10);
      if (result.month > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        throw new Error(
          `The month ${result.month.toString()} is not a valid month number for a year.`
        );
      }
    } else {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (settings.cycle === "week") {
    // week cycle: year.week or year.week.minor
    if (parts.length === 1) {
      result.week = parseInt(parts[0], 10);
      if (result.week > CALVER_NUMBER_OF_WEEKS_IN_A_YEAR + 1) {
        throw new Error(
          `The week ${result.week.toString()} is not a valid week number for a year.`
        );
      }
    } else if (parts.length === 2) {
      result.week = parseInt(parts[0], 10);
      result.minor = parseInt(parts[1], 10);
      if (result.week > CALVER_NUMBER_OF_WEEKS_IN_A_YEAR + 1) {
        throw new Error(
          `The week ${result.week.toString()} is not a valid week number for a year.`
        );
      }
    } else {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (settings.cycle === "day") {
    // day cycle: year.month.day or year.month.day.minor
    if (parts.length === 2) {
      result.month = parseInt(parts[0], 10);
      result.day = parseInt(parts[1], 10);
      if (result.month > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        throw new Error(
          `The month ${result.month.toString()} is not a valid month number for a year.`
        );
      }
      if (result.day > CALVER_NUMBER_OF_DAYS_IN_A_MONTH) {
        throw new Error(`The day ${result.day.toString()} is not a valid day number for a month.`);
      }
    } else if (parts.length === 3) {
      result.month = parseInt(parts[0], 10);
      result.day = parseInt(parts[1], 10);
      result.minor = parseInt(parts[2], 10);
      if (result.month > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        throw new Error(
          `The month ${result.month.toString()} is not a valid month number for a year.`
        );
      }
      if (result.day > CALVER_NUMBER_OF_DAYS_IN_A_MONTH) {
        throw new Error(`The day ${result.day.toString()} is not a valid day number for a month.`);
      }
    } else {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (settings.cycle === "auto") {
    // Auto mode: infer from structure
    if (parts.length === 1) {
      // Could be year.minor or year.month/week
      const value = parseInt(parts[0], 10);
      if (value <= CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        // Ambiguous: could be month or minor
        // Default to month for values 1-12
        result.month = value;
      } else if (value <= CALVER_NUMBER_OF_WEEKS_IN_A_YEAR) {
        // Likely a week number
        result.week = value;
      } else {
        // Must be a minor version
        result.minor = value;
      }
    } else if (parts.length === 2) {
      const first = parseInt(parts[0], 10);
      const second = parseInt(parts[1], 10);

      if (
        first <= CALVER_NUMBER_OF_MONTHS_IN_A_YEAR &&
        second <= CALVER_NUMBER_OF_DAYS_IN_A_MONTH
      ) {
        // year.month.day format
        result.month = first;
        result.day = second;
      } else if (first <= CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        // year.month.minor format
        result.month = first;
        result.minor = second;
      } else if (first <= CALVER_NUMBER_OF_WEEKS_IN_A_YEAR) {
        // year.week.minor format
        result.week = first;
        result.minor = second;
      } else {
        throw new Error("Invalid calver string: invalid date portion.");
      }
    } else if (parts.length === 3) {
      // year.month.day.minor
      result.month = parseInt(parts[0], 10);
      result.day = parseInt(parts[1], 10);
      result.minor = parseInt(parts[2], 10);

      if (result.month > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
        throw new Error(
          `The month ${result.month.toString()} is not a valid month number for a year.`
        );
      }
      if (result.day > CALVER_NUMBER_OF_DAYS_IN_A_MONTH) {
        throw new Error(`The day ${result.day.toString()} is not a valid day number for a month.`);
      }
    } else {
      throw new Error("Invalid calver string: invalid date portion.");
    }
  }

  return result;
}

export function toCalVerString(obj) {
  let result = "";

  result += obj.year.toString(10);
  if (typeof obj.month === "number")
    result += CALVER_CALENDAR_PORTION_SEPARATOR + obj.month.toString(10);
  if (typeof obj.week === "number")
    result += CALVER_CALENDAR_PORTION_SEPARATOR + obj.week.toString(10);
  if (typeof obj.day === "number")
    result += CALVER_CALENDAR_PORTION_SEPARATOR + obj.day.toString(10);
  if (obj.minor > 0) result += CALVER_MINOR_PORTION_SEPARATOR + obj.minor.toString(10);

  return result;
}

export function isCycleValid(str, allowAuto = true) {
  return CALVER_CYCLES.includes(str) && (allowAuto ? true : str !== "auto");
}
