function toUTCDate(date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

export default class DateUtil {
  static getMaxDate(chart) {
    var date = toUTCDate(new Date());

    if (
      (chart === 'melon' && date.getDay() < 1) ||
      (chart === 'oricon' && date.getDay() < 2) ||
      (chart === 'francais' && date.getDay() < 2) ||
      (chart === 'billboard' && date.getDay() < 3) ||
      (chart === 'deutsche' && date.getDay() < 3) ||
      (chart === 'gaon' && date.getDay() < 4)
    )
      date.setDate(date.getDate() - 7);

    if (chart === 'uk' && date.getDay() === 6) date.setDate(date.getDate() + 7);

    date.setDate(date.getDate() - date.getDay() - 1);

    return date;
  }

  static getMinDate(chart) {
    if (chart === 'gaon') {
      return new Date(Date.UTC(2010, 0, 2)); // Jan 2nd, 2010
    } else {
      return new Date(Date.UTC(2000, 0, 1)); // Jan 1st, 2000
    }
  }

  static toSaturday(date, diff) {
    var dateA = date.split('-').map(s => parseInt(s, 10));
    var offset = 6;

    if (diff) offset += diff;

    date = new Date(Date.UTC(dateA[0], dateA[1] - 1, dateA[2]));
    date = new Date(
      Date.UTC(dateA[0], dateA[1] - 1, dateA[2] + offset - date.getDay())
    );
    return date.toISOString().substring(0, 10);
  }

  static getYear(date) {
    return parseInt(date.substring(0, 4), 10);
  }

  static getMonth(date) {
    return parseInt(date.substring(5, 7), 10);
  }
}
