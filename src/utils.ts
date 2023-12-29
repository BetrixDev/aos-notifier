import date from "date-and-time";
import { DayOfWeek, parseConfig } from "./configuration-parser.js";

export function shouldAlarmSound() {
  const config = parseConfig();

  const currentTimeMillis = Date.now();
  const hoursRange = config.hours_of_operation[getCurrentDayOfTheWeek()];
  const timestamps = getTimestamps(hoursRange);

  if (timestamps.startTime.getMilliseconds() > currentTimeMillis) {
    // Store hasn't opened yet today
    return false;
  }

  if (timestamps.endTime.getMilliseconds() < currentTimeMillis) {
    // Store is already closed today
    return false;
  }

  return true;
}

interface Timestamps {
  startTime: Date;
  endTime: Date;
}

function getTimestamps(timeString: string): Timestamps {
  const now = new Date();
  const currentTime = date.format(now, "YYYY-MM-DD");

  // Splitting the time string into start and end times
  const [startTimeStr, endTimeStr] = timeString.split("-");

  if (startTimeStr === undefined || endTimeStr === undefined) {
    throw new Error("Config malformed");
  }

  // Parsing the start and end times with AM/PM format
  const startTime = date.parse(
    currentTime + " " + startTimeStr.trim(),
    "YYYY-MM-DD h:mma"
  )!;
  const endTime = date.parse(
    currentTime + " " + endTimeStr.trim(),
    "YYYY-MM-DD h:mma"
  )!;

  return { startTime, endTime };
}

function getCurrentDayOfTheWeek(): DayOfWeek {
  return date.format(new Date(), "dddd").toLowerCase() as DayOfWeek;
}
