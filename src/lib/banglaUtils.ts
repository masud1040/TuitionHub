const banglaDigits: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaNumber(num: number | string): string {
  return num.toString().split('').map(digit => banglaDigits[digit] || digit).join('');
}

export function fromBanglaNumber(banglaStr: string): string {
  const reverseMap: { [key: string]: string } = Object.fromEntries(
    Object.entries(banglaDigits).map(([en, bn]) => [bn, en])
  );
  return banglaStr.split('').map(digit => reverseMap[digit] || digit).join('');
}
