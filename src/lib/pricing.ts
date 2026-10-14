export const DON_GIA_M2 = {
  'Bê tông cốt thép truyền thống': { gia: 22000, san: 1500000 },
  'Khung thép tiền chế + Cemboard': { gia: 15000, san: 1200000 },
  'Nhà xưởng công nghiệp (Zamil Steel/PEB)': { gia: 7500, san: 2000000 },
};

export const tinhGiaGoiThietKe = (dienTich: number, loaiKetCau: string, soTang: number) => {
  // Map input types to supported types
  let mappedType = loaiKetCau;
  if (loaiKetCau.toLowerCase().includes('xưởng')) {
      mappedType = 'Nhà xưởng công nghiệp (Zamil Steel/PEB)';
  } else if (loaiKetCau.toLowerCase().includes('thép')) {
      mappedType = 'Khung thép tiền chế + Cemboard';
  } else {
      // Default to BTCT
      mappedType = 'Bê tông cốt thép truyền thống';
  }

  const config = (DON_GIA_M2 as any)[mappedType] || DON_GIA_M2['Bê tông cốt thép truyền thống'];
  const totalArea = dienTich * soTang;
  const calculatedPrice = totalArea * config.gia;
  const finalPrice = Math.max(calculatedPrice, config.san);
  return Math.ceil(finalPrice / 10000) * 10000;
};
