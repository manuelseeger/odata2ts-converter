import { v2JulianDateToGregorianDateConverter } from "../src";
import { execCommonConverterTests } from "./CommonTests";

describe("DateTimeOffsetToDateConverter Test", () => {
  const cases = [
    ["/Date(253402214400000)/", "9999-12-31T00:00:00.000Z"], // 9999-12-31T00:00:00.000Z
    ["/Date(716860800000)/", "1992-09-19T00:00:00.000Z"], // 1992-09-19T00:00:00.000Z
    ["/Date(-62135769600000)/", "0001-01-01T00:00:00.000Z"], // 0000-12-30T00:00:00.000Z
    ["/Date(-62135683200000)/", "0001-01-02T00:00:00.000Z"], // 0000-12-31T00:00:00.000Z
    ["/Date(-62135596800000)/", "0001-01-03T00:00:00.000Z"], // 0001-01-01T00:00:00.000Z
    ["/Date(-12222230400000)/", "1582-09-01T00:00:00.000Z"], // 1582-09-11T00:00:00.000Z
    ["/Date(-37632988800000)/", "0777-06-13T00:00:00.000Z"], // 0777-06-17T00:00:00.000Z
    ["/Date(-12219292800000)/", "1582-10-15T00:00:00.000Z"], // 1582-10-15T00:00:00.000Z
    ["/Date(-12219465600000)/", "1582-10-03T00:00:00.000Z"], // 1582-10-13T00:00:00.000Z
    ["/Date(-12218515200000)/", "1582-10-24T00:00:00.000Z"], // 1582-10-24T00:00:00.000Z
    ["/Date(-12218860800000)/", "1582-10-20T00:00:00.000Z"], // 1582-10-20T00:00:00.000Z
    ["/Date(-12219379200000)/", "1582-10-04T00:00:00.000Z"], // 1582-10-14T00:00:00.000Z
  ];

  /*
  −200	March 3	February 28	
  1100	February 29	March 7	
  1500	February 29	March 10
  100	March 1	February 28
*/
  const julianOnlyDates = [
    ["1100-02-29T00:00:00.000Z", "/Date(-27448934400000)/"], // 1100-03-07T00:00:00.000Z
  ];

  const TO_TEST = v2JulianDateToGregorianDateConverter;

  execCommonConverterTests(TO_TEST);

  test("conversionFrom", () => {
    cases.forEach(([input, expected]) => {
      expect(TO_TEST.convertFrom(input)).toBe(expected);
    });
  });

  test("conversionTo", () => {
    cases.forEach(([expected, input]) => {
      expect(TO_TEST.convertTo(input)).toBe(expected);
    });
  });

  test("converionTo with julian only date", () => {
    julianOnlyDates.forEach(([expected, input]) => {
      expect(TO_TEST.convertTo(input)).toBe(expected);
    });
  });
});
