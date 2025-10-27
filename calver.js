const CALVER_RE_SYNTAX = /^[0-9]{4}(-[0-9]{1,2}(-[0-9]{1,2})?)?(\.[0-9]+)?$/;
const CALVER_SEARCH_RE_SYNTAX = /[0-9]{4}(-[0-9]{1,2}(-[0-9]{1,2})?)?(\.[0-9]+)?/;
const CALVER_CALENDAR_PORTION_SEPARATOR = ".";
const CALVER_MINOR_PORTION_SEPARATOR = ".";
const CALVER_NUMBER_OF_WEEKS_IN_A_YEAR = 54;
const CALVER_NUMBER_OF_MONTHS_IN_A_YEAR = 12;
const CALVER_NUMBER_OF_DAYS_IN_A_MONTH = 31;
export const CALVER_CYCLES = ["auto", "year", "month", "week", "day"];

export function clean(str) {
  const result = str.match(CALVER_SEARCH_RE_SYNTAX);

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
    next.minor = 0;
  } else if (
    cycle === "month" &&
    (version.month !== currentDate.month || version.year !== currentDate.year)
  ) {
    next.year = currentDate.year;
    next.month = currentDate.month;
    next.minor = 0;
  } else if (
    cycle === "week" &&
    (version.week !== currentDate.week || version.year !== currentDate.year)
  ) {
    next.year = currentDate.year;
    next.week = currentDate.week;
    next.minor = 0;
  } else if (
    cycle === "day" &&
    (version.day !== currentDate.day ||
      version.month !== currentDate.month ||
      version.year !== currentDate.year)
  ) {
    next.year = currentDate.year;
    next.month = currentDate.month;
    next.day = currentDate.day;
    next.minor = 0;
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
  try {
    parse(str, { cycle: settings.cycle });
    return str;
  } catch (e) {
    throw e;
  }
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

    // @ts-ignore
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

  // Split by separator to get all parts
  const allParts = str.slice(4).split(/[.-]/);

  // Determine which parts are date vs minor based on cycle and part count
  let dateParts = [str.slice(0, 4)]; // Start with year
  let minorPart = null;

  if (allParts.length > 0 && allParts[0] === "") {
    allParts.shift(); // Remove empty string if starts with separator
  }

  // Logic to determine date parts vs minor version
  if (settings.cycle === "auto") {
    // In auto mode, use heuristics:
    // - If we have 3+ parts, last one is minor if previous parts form valid date
    // - If we have 2 parts, check if it could be year.month, year.week, or year.minor
    if (allParts.length >= 3) {
      // Assume format like 2025.10.1.5 or 2025.10.1
      // Last part is minor if we have 4 parts total (year + 3)
      if (allParts.length === 4) {
        dateParts.push(...allParts.slice(0, 3));
        minorPart = allParts[3];
      } else {
        dateParts.push(...allParts);
      }
    } else {
      dateParts.push(...allParts);
    }
  } else if (settings.cycle === "year") {
    // Year cycle: only expects minor version after year
    if (allParts.length === 1) {
      minorPart = allParts[0];
    } else if (allParts.length > 1) {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (settings.cycle === "month" || settings.cycle === "week") {
    // Month/week cycle: expects year.month[.minor] or year.week[.minor]
    if (allParts.length === 1) {
      dateParts.push(allParts[0]);
    } else if (allParts.length === 2) {
      dateParts.push(allParts[0]);
      minorPart = allParts[1];
    } else {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (settings.cycle === "day") {
    // Day cycle: expects year.month.day[.minor]
    if (allParts.length === 2) {
      dateParts.push(...allParts);
    } else if (allParts.length === 3) {
      dateParts.push(allParts[0], allParts[1]);
      minorPart = allParts[2];
    } else if (allParts.length === 4) {
      dateParts.push(allParts[0], allParts[1], allParts[2]);
      minorPart = allParts[3];
    } else {
      throw new Error("Version and cycle mismatch.");
    }
  }

  // Parse minor version
  if (minorPart !== null) {
    result.minor = parseInt(minorPart, 10);
  }

  if (dateParts.length === 1) {
    if (!["auto", "year"].includes(settings.cycle)) {
      throw new Error("Version and cycle mismatch.");
    }
  } else if (dateParts.length === 2) {
    if (!["auto", "month", "week"].includes(settings.cycle)) {
      throw new Error("Version and cycle mismatch.");
    }

    const key = settings.cycle === "week" ? "week" : "month";
    const value = parseInt(dateParts[1], 10);

    if (key === "week" && value > CALVER_NUMBER_OF_WEEKS_IN_A_YEAR + 1) {
      throw new Error("The week " + value.toString() + " is not a valid week number for a year.");
    }

    if (key === "month" && value > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
      throw new Error("The month " + value.toString() + " is not a valid month number for a year.");
    }

    result[key] = value;
  } else if (dateParts.length === 3) {
    if (!["auto", "day"].includes(settings.cycle)) {
      throw new Error("Version and cycle mismatch.");
    }

    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);

    if (month > CALVER_NUMBER_OF_MONTHS_IN_A_YEAR) {
      throw new Error("The month " + month.toString() + " is not a valid month number for a year.");
    }

    if (day > CALVER_NUMBER_OF_DAYS_IN_A_MONTH) {
      throw new Error("The day " + day.toString() + " is not a valid day number for a month.");
    }

    result.month = month;
    result.day = day;
  } else {
    throw new Error("Invalid calver string: invalid date portion.");
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
