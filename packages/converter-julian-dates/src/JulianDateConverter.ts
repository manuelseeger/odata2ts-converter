import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export const julianDateToGregorianDateConverter: ValueConverter<Date, Date> = {
  id: "julianDateToGregorianDateConverter",
  from: "Date",
  to: "Date",

  // Julian Date to Gregorian Date
  convertFrom: function (value: ParamValueModel<Date>): ParamValueModel<Date> {
    // if date after 1582-10-15 don't convert
    if (value && value.getTime() > -12219292800000) {
      return value;
    }
    return value;
  },

  // Gregorian Date to Julian Date
  convertTo: function (value: ParamValueModel<Date>): ParamValueModel<Date> {
    if (!value) {
      return value;
    }
    // if date after 1582-10-15 don't convert
    if (value.getTime() > -12219292800000) {
      return value;
    }    
    return value;
  },
};

function dateToJulianNumber0(d: Date): number {
    var year=d.getFullYear();
    var month=d.getMonth()+1;
    var day=d.getDate();
    var a = Math.floor((14-month)/12);
    var y = Math.floor(year+4800-a);
    var m = month+12*a-3;
    var JDN = day + Math.floor((153*m+2)/5)+(365*y)+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
    return JDN;
 }
 
 function julianIntToDate0(JD: number): Date{
 
    var y = 4716;
    var v = 3;
    var j = 1401;
    var u =  5;
    var m =  2;
    var s =  153;
    var n = 12;
    var w =  2;
    var r =  4;
    var B =  274277;
    var p =  1461;
    var C =  -38;
    var f = JD + j + Math.floor((Math.floor((4 * JD + B) / 146097) * 3) / 4) + C;
    var e = r * f + v;
    var g = Math.floor((e % p) / r);
    var h = u * g + w;
    var D = Math.floor((h % s) / u) + 1;
    var M = ((Math.floor(h / s) + m) % n) + 1;
    var Y = Math.floor(e / p) - y + Math.floor((n + m - M) / n) ;
    return new Date(Y,M-1,D);
 }
 
 //Testing
 var jd=dateToJulianNumber0(new Date(2013,11,31)); //Month is 0-based for javascript
 var gd=julianIntToDate0(jd); 
 console.log(jd);
 console.log(gd.toString());