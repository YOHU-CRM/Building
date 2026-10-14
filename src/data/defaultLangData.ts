import { UserInfo, ConstructionInfo, DetailItems } from "../types";

export interface DefaultLangData {
  userInfo: Partial<UserInfo>;
  constructionInfo: Partial<ConstructionInfo>;
  detailItems: Partial<DetailItems>;
}

export function getDefaultsForLang(l: 'vi' | 'en' | 'lo' | 'zh'): DefaultLangData {
  if (l === 'en') {
    return {
      userInfo: {
        name: "Nguyen Van A",
        address: "Tan Pho Hien Villa, Hung Yen",
        desiredDirection: "Đông Nam",
        purpose: "Build a family holiday villa"
      },
      constructionInfo: {
        overallDescription: "Want to build a 2-story house, tiled roof, area 10x15m, budget around 2 billion...",
        constructionType: "Nhà mái ngói"
      },
      detailItems: {
        foundation: "Reinforced concrete pile foundation 300x300, anchor pressed 15m deep",
        wall: "Solid brick wall 220 thick with external thermal insulation, mortar grade M75",
        columns: "Hoa Phat steel diameter 20 cast sturdy load-bearing frame",
        beam: "Concrete grade PCB40 foundation beam 300x500 supporting the floor slab",
        frame: "High vibration resistance frame, Vietnam construction standard",
        ceiling: "Vinh Tuong moisture-resistant plaster ceiling, aesthetic tiered design",
        cementType: "Premium Hoang Thach cement grade PCB40 with high bending resistance",
        mainDoor: "Solid Go Do wood main door engraved with traditional four-season pattern",
        roomDoor: "Light color wood-plastic composite water-resistant door with walnut grain",
        window: "Imported Xingfa Guangdong aluminum glass window in dark grey",
        roof: "Traditional red Prime glazed roof tile, galvanized lightning protection system",
        tiles: "Luxurious anti-scratch Prime Granite tiles, stone pattern 80x80",
        electricsWater: "Tran Phu fire-resistant electrical conduit, Tien Phong heat-resistant water pipe",
        kitchenAppliances: "Granite kitchen countertop, Russian oak wood kitchen cabinets",
      }
    };
  }
  if (l === 'lo') {
    return {
      userInfo: {
        name: "ຫງວຽນ ວັນ ເອ",
        address: "ວິນລ່າ ເຕິນ ໂພ ຮຽນ, ຮຶງ ອຽນ",
        desiredDirection: "Đông Nam",
        purpose: "ປຸກສ້າງວິນລ່າພັກຜ່ອນຄອບຄົວ"
      },
      constructionInfo: {
        overallDescription: "ຕ້ອງການປຸກເຮືອນ 2 ຊັ້ນ, ມຸງກະເບື້ອງ, ເນື້ອທີ່ 10x15 ແມັດ, ງົບປະມານປະມານ 2 ຕື້...",
        constructionType: "Nhà mái ngói"
      },
      detailItems: {
        foundation: "ຮາກຖານເສົາເຂັມເບຕົງເສີມເຫຼັກ 300x300, ອັດແໜ້ນເລິກ 15 ແມັດ",
        wall: "ຝາກໍ່ດິນຈີ່ໜາ 220 ຫຸ້ມກັນຄວາມຮ້ອນດ້ານນອກ, ປູນກໍ່ M75",
        columns: "ເຫຼັກຮວ່າຟາດ ຟີ 20 ຫຼໍ່ໂຄງຮັບແຮງຢ່າງໝັ້ນຄົງ",
        beam: "ຄານຮາກຖານເບຕົງ PCB40 ໜາ 300x500 ຮອງຮັບພື້ນຊັ້ນ",
        frame: "ໂຄງສ້າງທົນທານຕໍ່ການສັ່ນສະເທືອນສູງ ມາດຕະຖານຫວຽດນາມ",
        ceiling: "ເພດານຍິບຊຳ ວິ້ງເຕືອງ ກັນຊຶມ ຫຼິ້ນລະດັບສວຍງາມ",
        cementType: "ຊີມັງ ຮ່ວາງແທັກ ລະດັບສູງ PCB40 ທົນທານຕໍ່ການດັດແກ້",
        mainDoor: "ປະຕູໄມ້ ກໍດໍ ແຜ່ນໃຫຍ່ ແກະສະຫຼັກລວດລາຍມຸງຄຸນ",
        roomDoor: "ປະຕູໄມ້ອຸດສາຫະກຳກັນນ້ຳ ສີອ່ອນລາຍໄມ້ວອນນັດ",
        window: "ປະຕູປ່ອງຢ້ຽມອາລູມີນຽມ ຊິງຟາ ກວາງຕຸ້ງ ສີເທົາເຂັ້ມ",
        roof: "ກະເບື້ອງ Prime ເຄືອບສີແດງດັ້ງເດີມ ພ້ອມລະບົບກັນຟ້າຜ່າ",
        tiles: "ກະເບື້ອງ Granite Prime ລາຍຫີນຫຼູຫຼາ ກັນຮອຍຂີດຂ່ວນ 80x80",
        electricsWater: "ສາຍໄຟກັນໄຟໄໝ້ ເຕິນຝູ, ທໍ່ນ້ຳທົນຄວາມຮ້ອນ ຕຽນຟອງ",
        kitchenAppliances: "ໜ້າຄົວຫີນ Granite, ຕູ້ຄົວໄມ້ໂອກລັດເຊຍ",
      }
    };
  }
  if (l === 'zh') {
    return {
      userInfo: {
        name: "阮文A",
        address: "兴安省新铺宪别墅区",
        desiredDirection: "Đông Nam",
        purpose: "建造家庭度假别墅"
      },
      constructionInfo: {
        overallDescription: "想建一栋2层别墅，瓦顶，面积10x15米，预算约20亿越南盾...",
        constructionType: "Nhà mái ngói"
      },
      detailItems: {
        foundation: "300x300钢筋混凝土桩基，锚压深15米",
        wall: "220厚多孔红砖墙配外墙保温，砂浆标号M75",
        columns: "和发牌直径20毫米钢筋现场浇筑",
        beam: "PCB40混凝土基础梁300x500承载楼板",
        frame: "高抗震钢筋混凝土框架结构，符合越南建设标准",
        ceiling: "永祥牌防潮石膏板吊顶，艺术二级吊顶",
        cementType: "黄石牌高标号PCB40抗折水泥",
        mainDoor: "缅甸花梨木原木整雕四季平安玄关大门",
        roomDoor: "浅色胡桃木纹防水木塑套门",
        window: "广东凤铝/兴发断桥铝灰色双层中空玻璃窗",
        roof: "红领牌传统红釉瓦面，防雷接地系统",
        tiles: "派丽牌80x80防刮仿石纹全抛釉大理石瓷砖",
        electricsWater: "陈富牌阻燃电线，前锋牌耐热冷热水管",
        kitchenAppliances: "黑金沙大理石台面，俄罗斯橡木整体橱柜",
      }
    };
  }
  return {
    userInfo: {
      name: "Nguyễn Văn A",
      address: "Biệt thự Tân Phố Hiến, Hưng Yên",
      desiredDirection: "Đông Nam",
      purpose: "Xây biệt thự nghỉ dưỡng gia đình"
    },
    constructionInfo: {
      overallDescription: "Muốn xây nhà 2 tầng, mái ngói, diện tích 10x15m, ngân sách khoảng 2 tỷ...",
      constructionType: "Nhà mái ngói"
    },
    detailItems: {
      foundation: "Móng cọc bê tông cốt thép 300x300, ép neo sâu 15m",
      wall: "Tường gạch đặc xây dày 220 bọc ngoài cách nhiệt, mác vữa M75",
      columns: "Thép Hòa Phát phi 20 đúc khung chịu lực vững vàng",
      beam: "Dầm móng bê tông PCB40 dày 300x500 nâng đỡ tầng móng sàn",
      frame: "Khung cốt chịu rung động cường độ cao tiêu chuẩn Việt Nam",
      ceiling: "Trần thạch cao Vĩnh Tường chống ẩm giật cấp thẩm mỹ",
      cementType: "Xi măng Hoàng Thạch cao cấp mác PCB40 chịu uốn",
      mainDoor: "Cửa gỗ Gõ Đỏ nguyên tấm đục khắc tứ quý hợp phong thủy",
      roomDoor: "Cửa gỗ công nghiệp chống nước màu sáng vân gỗ óc chó",
      window: "Cửa nhôm kính Xingfa Quảng Đông nhập khẩu màu ghi xám",
      roof: "Ngói lợp Prime tráng men màu đỏ truyền thống hệ kẽm chống sét",
      tiles: "Gạch Granite Prime giả đá sang trọng chống xước 80x80",
      electricsWater: "Đường điện ống luồn chống cháy Trần Phú, nước ống chịu nhiệt Tiền Phong",
      kitchenAppliances: "Mặt bếp đá Granite kim sa, tủ bếp gỗ sồi Nga",
    }
  };
}
