export interface RoomRule {
  viTriDeXuat: string;
  huongDeXuat: string[];
  dieuKy: string[];
}

export interface FengShuiRoomRules {
  bep: RoomRule;
  phongTho: RoomRule;
  phongKhach: RoomRule;
  phongNgu: RoomRule;
  wc: RoomRule;
}

export function tinhQuyTacPhongThuyPhong(cungMenh: any, huongNha: string): FengShuiRoomRules {
  const isDongTu = cungMenh.menhQuai === 'Đông Tứ Mệnh';
  const huongTot = cungMenh.favorableDirections;
  const huongXau = cungMenh.unfavorableDirections;

  return {
    bep: {
      viTriDeXuat: "Đặt tại cung xấu (bếp tọa hung hướng cát)",
      huongDeXuat: huongTot,
      dieuKy: ["Đối diện cửa chính", "Đối diện cửa phòng ngủ", "Liền kề WC", "Dưới xà ngang", "Lưng bếp không có vách tựa"]
    },
    phongTho: {
      viTriDeXuat: "Tầng cao nhất, vị trí trang trọng",
      huongDeXuat: [huongTot[0], huongTot[2]], // Sinh Khí hoặc Diên Niên
      dieuKy: ["Dưới cầu thang", "Gần/đối diện nhà vệ sinh", "Đối diện trực xung cửa chính", "Gần bếp"]
    },
    phongKhach: {
      viTriDeXuat: "Gần cửa chính",
      huongDeXuat: huongTot,
      dieuKy: ["Đối diện cửa chính trực trục", "Không có vách tựa lưng sofa", "Dưới xà ngang"]
    },
    phongNgu: {
      viTriDeXuat: "Yên tĩnh, kín đáo",
      huongDeXuat: huongTot,
      dieuKy: ["Đối diện thẳng cửa phòng", "Dưới xà ngang", "Đối diện gương", "Đầu giường dưới cửa sổ"]
    },
    wc: {
      viTriDeXuat: "Cung xấu của nhà",
      huongDeXuat: huongXau,
      dieuKy: ["Trung tâm nhà", "Đối diện cửa chính", "Liền kề/đối diện bếp", "Liền kề/đối diện phòng thờ"]
    }
  };
}
