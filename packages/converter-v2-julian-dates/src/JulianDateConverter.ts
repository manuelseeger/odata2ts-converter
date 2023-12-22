import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import {
  DATE_TIME_V2_REGEXP,
  ISO_OFFSET_REGEXP,
  formatIsoOffset,
  padZerosLeft,
} from "./DateTimeToDateTimeOffsetConverter";

const GREY_ZONE_MAX_TIMESTAMP = -12218515200000; // 1582-10-24T00:00:00.000Z
const GREY_ZONE_MIN_TIMESTAMP = -12219292800000; // 1582-10-15T00:00:00.000Z
const MIN_TIMESTAMP = -77945675648000;
interface JulianToGregorianDateMapRow {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number | null;
  [index: number]: number | null;
}

// [J-year, J-JS-month, J-day, G-JS-month, G-day, offset]
const JULIAN_TO_GREGORIAN_DATE_MAP: JulianToGregorianDateMapRow[] = [
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

function findOffset(year: number, month: number, day: number, calendar: 0 | 2 = 0): JulianToGregorianDateMapRow | null {
  let left: number = 0;
  let right: number = JULIAN_TO_GREGORIAN_DATE_MAP.length - 1;
  let closestRow: JulianToGregorianDateMapRow | null = null;

  while (left <= right) {
    const mid: number = Math.floor((left + right) / 2);
    const candidate = JULIAN_TO_GREGORIAN_DATE_MAP[mid];
    const midYear = candidate[0];
    const midMonth = candidate[1 + calendar] as number;
    const midDay = candidate[2 + calendar] as number;

    if (midYear === year && midMonth === month && midDay === day) {
      closestRow = candidate;
      break;
    }

    if (
      midYear < year ||
      (midYear === year && midMonth < month) ||
      (midYear === year && midMonth === month && midDay < day)
    ) {
      closestRow = candidate;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return closestRow ? closestRow : null;
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

    const timestamp = matched[1];

    let timestamp_number = Number(timestamp);

    if (timestamp_number < MIN_TIMESTAMP) {
      throw new Error("Cannot meaningfully convert dates before BC 500-02-05");
    }

    if (timestamp_number < GREY_ZONE_MAX_TIMESTAMP) {
      if (timestamp_number >= GREY_ZONE_MIN_TIMESTAMP) {
        console.warn(
          "Converter cannot know if the date is in the Julian or Gregorian calendar " +
            "for dates between 1582-10-15 and 1582-10-24. Assuming Gregorian calendar."
        );
      } else {
        timestamp_number = convertInternal(timestamp_number, -1);
      }
    }

    const sign = matched[3];
    const offsetInMin = matched[4];

    const iso = new Date(timestamp_number).toISOString();
    const offset = sign && offsetInMin ? formatIsoOffset(sign, offsetInMin) : "";

    return offset ? iso.substring(0, iso.length - 1) + offset : iso;
  },

  // Gregorian Date to Julian Date
  convertTo: function (value: ParamValueModel<string>): ParamValueModel<string> {
    if (!value) {
      return value;
    }

    const gregorianValue = new Date(value);
    let timestamp = gregorianValue.getTime();

    // match iso date string
    const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):?(\d{2})?\.?(\d{3})?Z$/;
    const matchedIso = value.match(ISO_DATE_REGEX);
    if (!matchedIso || matchedIso.length < 8) {
      return undefined;
    }

    const offsetRecord = findOffset(Number(matchedIso[1]), Number(matchedIso[2]), Number(matchedIso[3]), 2);

    if (offsetRecord && offsetRecord[5] === null) {
      const gregorianValue = new Date(offsetRecord[0], offsetRecord[3], offsetRecord[4]);
    }

    if (timestamp < MIN_TIMESTAMP) {
      throw new Error("Cannot meaningfully convert dates before BC 500-02-05");
    }

    if (timestamp < GREY_ZONE_MAX_TIMESTAMP) {
      if (timestamp >= GREY_ZONE_MIN_TIMESTAMP) {
        console.warn(
          "Converter cannot know if the date is in the Julian or Gregorian calendar " +
            "for dates between 1582-10-15 and 1582-10-24. Assuming Gregorian calendar."
        );
      } else {
        timestamp = convertInternal(timestamp, 1);
      }
    }

    // handle offset
    const matched = value.match(ISO_OFFSET_REGEXP);
    if (matched && matched.length === 4) {
      const minutes = Number(matched[2]) * 60 + Number(matched[3]);
      const offset = matched[1] + minutes;
      return formatDateTimeV2(timestamp, offset);
    }

    return formatDateTimeV2(timestamp);
  },
};

function formatDateTimeV2(timestamp: number, offset?: string) {
  return `/Date(${timestamp}${offset || ""})/`;
}

function convertInternal(timestamp: number, direction: 1 | -1 = 1): number {
  const t = new Date(timestamp);

  const offsetRecord = findOffset(t.getFullYear(), t.getMonth() + 1, t.getDate());

  if (offsetRecord === null) {
    throw new Error(`Can't find ${t.getFullYear()} ${t.getMonth() + 1} ${t.getDate()} in conversion table`);
  }

  let t_1 = new Date(t);

  if (offsetRecord[5] === null) {
    const moveIndex = direction > 0 ? 0 : 2;
    t_1.setMonth(offsetRecord[1 + moveIndex] as number);
    t_1.setDate(offsetRecord[2 + moveIndex] as number);
  } else {
    const offset = (offsetRecord[5] as number) * direction;
    t_1.setDate(t_1.getDate() + offset);
  }

  return t_1.getTime();
}

//console.log(v2JulianDateToGregorianDateConverter.convertFrom("/Date(-12218515200000)/"));
//console.log(v2JulianDateToGregorianDateConverter.convertTo("0777-06-13T00:00:00.000Z"));
console.log(v2JulianDateToGregorianDateConverter.convertTo("1100-02-29T00:00:00.000Z"));

-37632988800000;
