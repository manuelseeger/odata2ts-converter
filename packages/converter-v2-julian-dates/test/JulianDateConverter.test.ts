import { v2JulianDateToGregorianDateConverter } from "../src";
import { execCommonConverterTests } from "./CommonTests";

describe("DateTimeOffsetToDateConverter Test", () => {
  const FROM_STRING = "2022-12-31T23:59:59.000Z";
  const FROM_STRING2 = "2022-12-31T23:59:59Z";

  const TO_TEST = v2JulianDateToGregorianDateConverter;

  execCommonConverterTests(TO_TEST);

  test("conversion", () => {
    const candidate = TO_TEST.convertFrom(FROM_STRING);
    const candidate2 = TO_TEST.convertFrom(FROM_STRING2);

    const cases = [
      ["/Date(253402214400000)/", "9999-12-31T00:00:00.000Z"], // 9999 - 12 - 31T00:00:00.000Z
      ["/Date(716860800000)/", "1992-09-19T00:00:00.000Z"], // 1992 -09 - 19T00:00:00.000Z
      ["/Date(-62135769600000)/", "0001-01-01T00:00:00.000Z"], // 0000 - 12 - 30T00:00:00.000Z
      ["/Date(-62135683200000)/", "0001-01-02T00:00:00.000Z"], // 0000 - 12 - 31T00:00:00.000Z
      ["/Date(-62135596800000)/", "0001-01-03T00:00:00.000Z"], // 0001 - 01 - 01T00:00:00.000Z
      ["/Date(-12222230400000)/", "1582-09-01T00:00:00.000Z"], // 1582 - 09 - 11T00:00:00.000Z
      ["/Date(-37632988800000)/", "0777-06-13T00:00:00.000Z"], // 0777-06-17T00:00:00.000Z
      ["/Date(-12219292800000)/", "1582-10-05T00:00:00.000Z"], // 1582-10-15T00:00:00.000Z
      ["/Date(-12219465600000)/", "1582-10-03T00:00:00.000Z"], // 1582-10-13T00:00:00.000Z
      ["/Date(-12218515200000)/", "1582-10-14T00:00:00.000Z"], // 1582-10-24T00:00:00.000Z,
      ["/Date(-12219292800000)/", "1582-10-15T00:00:00.000Z"], // 1582-10-15T00:00:00.000Z
    ];

    cases.forEach(([input, expected]) => {
      expect(TO_TEST.convertFrom(input)).toBe(expected);
    });
  });
});
