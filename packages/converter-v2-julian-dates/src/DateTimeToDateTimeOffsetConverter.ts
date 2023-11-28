import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

export function padZerosLeft(input: number) {
  return input < 10 ? `0${input}` : input;
}

export function formatIsoOffset(sign: string, offsetInMin: string) {
  const offset = Number(offsetInMin);
  const timeString = `${padZerosLeft(Math.floor(offset / 60))}:${padZerosLeft(offset % 60)}`;
  return offset ? sign + timeString : "";
}

export function formatDateTimeV2(iso8601: string, offset?: string) {
  return `/Date(${new Date(iso8601).getTime()}${offset || ""})/`;
}

export const DATE_TIME_V2_REGEXP = /\/Date\(([+-]?\d+)(([+-])(\d+))?\)\//;
export const ISO_OFFSET_REGEXP = /([+-])(\d{2}):(\d{2})/;
