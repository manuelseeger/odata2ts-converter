import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import {
  DATE_TIME_V2_REGEXP,
  ISO_OFFSET_REGEXP,
  formatDateTimeV2,
  formatIsoOffset,
  padZerosLeft,
} from "./DateTimeToDateTimeOffsetConverter";

const CALENDAR_SWITCH_TIMESTAMP = -12216614400000;

// format: [J-year, J-JS-month, J-day, G-JS-month, G-day, offset]
const JULIAN_TO_GREGORIAN_DATE_MAP = [
  [-500, 2, 5, 1, 28, null],
  [-500, 2, 6, 2, 1, -5],
  [-300, 2, 3, 1, 27, -5],
  [-300, 2, 4, 1, 28, null],
  [-300, 2, 5, 2, 1, -4],
  [-200, 2, 2, 1, 27, -4],
  [-200, 2, 3, 1, 28, null],
  [-200, 2, 4, 2, 1, -3],
  [-100, 2, 1, 1, 27, -3],
  [-100, 2, 2, 1, 28, null],
  [-100, 2, 3, 2, 1, -2],
  [100, 1, 29, 1, 27, -2],
  [100, 2, 1, 1, 28, null],
  [100, 2, 2, 2, 1, -1],
  [200, 1, 28, 1, 27, -1],
  [200, 1, 29, 1, 28, null],
  [200, 2, 1, 2, 1, 0],
  [300, 1, 28, 1, 28, 0],
  [300, 1, 29, 2, 1, null],
  [300, 2, 1, 2, 2, 1],
  [500, 1, 28, 2, 1, 1],
  [500, 1, 29, 2, 2, null],
  [500, 2, 1, 2, 3, 2],
  [600, 1, 28, 2, 2, 2],
  [600, 1, 29, 2, 3, null],
  [600, 2, 1, 2, 4, 3],
  [700, 1, 28, 2, 3, 3],
  [700, 1, 29, 2, 4, null],
  [700, 2, 1, 2, 5, 4],
  [900, 1, 28, 2, 4, 4],
  [900, 1, 29, 2, 5, null],
  [900, 2, 1, 2, 6, 5],
  [1000, 1, 28, 2, 5, 5],
  [1000, 1, 29, 2, 6, null],
  [1000, 2, 1, 2, 7, 6],
  [1100, 1, 28, 2, 6, 6],
  [1100, 1, 29, 2, 7, null],
  [1100, 2, 1, 2, 8, 7],
  [1300, 1, 28, 2, 7, 7],
  [1300, 1, 29, 2, 8, null],
  [1300, 2, 1, 2, 9, 8],
  [1400, 1, 28, 2, 8, 8],
  [1400, 1, 29, 2, 9, null],
  [1400, 2, 1, 2, 10, 9],
  [1500, 1, 28, 2, 9, 9],
  [1500, 1, 29, 2, 10, null],
  [1500, 2, 1, 2, 11, 10],
  [1582, 9, 4, 9, 14, 10],
  [1582, 9, 5, 9, 15, 10],
  [1582, 9, 6, 9, 16, 10],
  [1700, 1, 18, 1, 28, 10],
  [1700, 1, 19, 2, 1, 11],
  [1700, 1, 28, 2, 10, 11],
  [1700, 1, 29, 2, 11, 11],
  [1700, 2, 1, 2, 12, 11],
  [1800, 1, 17, 1, 28, 11],
  [1800, 1, 18, 2, 1, 12],
  [1800, 1, 28, 2, 11, 12],
  [1800, 1, 29, 2, 12, 12],
  [1800, 2, 1, 2, 13, 12],
  [1900, 1, 16, 1, 28, 12],
  [1900, 1, 17, 2, 1, 13],
  [1900, 1, 28, 2, 12, 13],
  [1900, 1, 29, 2, 13, 13],
  [1900, 2, 1, 2, 14, 13],
  [2100, 1, 15, 1, 28, 13],
  [2100, 1, 16, 2, 1, 14],
  [2100, 1, 28, 2, 13, 14],
  [2100, 1, 29, 2, 14, 14],
];

function findOffset(year: number, month: number, day: number): number | null {
  let left: number = 0;
  let right: number = JULIAN_TO_GREGORIAN_DATE_MAP.length - 1;
  let closestRow: number[] | null = null;

  while (left <= right) {
    const mid: number = Math.floor((left + right) / 2);
    const [midYear, midMonth, midDay] = JULIAN_TO_GREGORIAN_DATE_MAP[mid] as number[];

    if (midYear === year && midMonth === month && midDay === day) {
      closestRow = JULIAN_TO_GREGORIAN_DATE_MAP[mid] as number[];
      break;
    }

    if (
      midYear < year ||
      (midYear === year && midMonth < month) ||
      (midYear === year && midMonth === month && midDay < day)
    ) {
      closestRow = JULIAN_TO_GREGORIAN_DATE_MAP[mid] as number[];
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return closestRow ? closestRow[5] : null;
}

export const v2JulianDateToGregorianDateConverter: ValueConverter<string, string> = {
  id: "v2JulianDateToGregorianDateConverter",
  from: ODataTypesV2.DateTime,
  to: ODataTypesV4.DateTimeOffset,

  // Julian Date to Gregorian Date
  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<string> {
    if (typeof value !== "string") {
      return value;
    }

    // offset in minutes might be specified as suffix of the timestamp,e.g. "+90"
    const matched = value.match(DATE_TIME_V2_REGEXP);
    if (!matched || matched.length < 5) {
      return undefined;
    }

    let timestamp = matched[1];

    if (Number(timestamp) < CALENDAR_SWITCH_TIMESTAMP) {
      timestamp = convertInternal(timestamp);
    }

    const sign = matched[3];
    const offsetInMin = matched[4];

    const iso = new Date(Number(timestamp)).toISOString();
    const offset = sign && offsetInMin ? formatIsoOffset(sign, offsetInMin) : "";

    return offset ? iso.substring(0, iso.length - 1) + offset : iso;
  },

  // Gregorian Date to Julian Date
  convertTo: function (value: ParamValueModel<string>): ParamValueModel<string> {
    if (!value) {
      return value;
    }

    // handle offset
    const matched = value.match(ISO_OFFSET_REGEXP);
    if (matched && matched.length === 4) {
      const isoString = value.replace(ISO_OFFSET_REGEXP, "Z");

      const minutes = Number(matched[2]) * 60 + Number(matched[3]);
      const offset = matched[1] + minutes;
      return formatDateTimeV2(isoString, offset);
    }

    return formatDateTimeV2(value);
  },
};

function convertInternal(timestamp: string, direction: 1 | -1 = 1): string {
  const t500 = new Date(Number(timestamp));

  let offset = findOffset(t500.getFullYear(), t500.getMonth() + 1, t500.getDate());

  if (offset === null) {
    throw new Error(
      `${t500.getFullYear()} ${t500.getMonth() + 1} ${t500.getDate()} does not exist on the Gregorian calendar.`
    );
  }

  offset = offset * direction;

  let t500_1 = new Date(t500);
  t500_1.setDate(t500_1.getDate() + offset);
  return t500_1.getTime().toString();
}
