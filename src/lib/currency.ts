export function formatCurrency(amount: number | string | undefined, lang: string = 'vi'): string {
  if (amount === undefined || amount === null || amount === '') return lang === 'vi' ? '0 đ' : '$0';
  const num = Number(amount);
  if (isNaN(num)) return lang === 'vi' ? '0 đ' : '$0';
  
  if (lang === 'vi') {
    return num.toLocaleString('vi-VN') + ' đ';
  } else {
    const usd = Math.ceil(num / 25000);
    return '$' + usd.toLocaleString('en-US');
  }
}

export function formatCurrencyNoSymbol(amount: number | string | undefined, lang: string = 'vi'): string {
  if (amount === undefined || amount === null || amount === '') return '0';
  const num = Number(amount);
  if (isNaN(num)) return '0';
  
  if (lang === 'vi') {
    return num.toLocaleString('vi-VN');
  } else {
    const usd = Math.ceil(num / 25000);
    return usd.toLocaleString('en-US');
  }
}

export function formatCurrencyWithUnit(amount: number | string | undefined, unit: string, lang: string = 'vi'): string {
  if (amount === undefined || amount === null || amount === '') return lang === 'vi' ? `0 đ/${unit}` : `$0/${unit}`;
  const num = Number(amount);
  if (isNaN(num)) return lang === 'vi' ? `0 đ/${unit}` : `$0/${unit}`;
  
  if (lang === 'vi') {
    return num.toLocaleString('vi-VN') + ' đ/' + unit;
  } else {
    const usd = Math.ceil(num / 25000);
    return '$' + usd.toLocaleString('en-US') + '/' + unit;
  }
}
