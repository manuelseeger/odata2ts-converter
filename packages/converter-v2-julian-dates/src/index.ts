import { ConverterPackage } from "@odata2ts/converter-api";

import { v2JulianDateToGregorianDateConverter } from "./JulianDateConverter";

const pkg: ConverterPackage = {
  id: "JulianDates",
  converters: [v2JulianDateToGregorianDateConverter],
};

export default pkg;
export { v2JulianDateToGregorianDateConverter };
