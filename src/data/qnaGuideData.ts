export const qnaGuideData: Record<string, {
  title: string;
  subtitle: string;
  categories: {
    icon: string;
    label: string;
    items: string[];
  }[];
}> = {
  vi: {
    title: "💡 Hướng dẫn & Gợi ý chủ đề hỏi chuyên sâu",
    subtitle: "Nhấp chuột vào để xem các chủ đề bạn có thể trao đổi với Chuyên gia AI",
    categories: [
      {
        icon: "🧭",
        label: "Phong Thủy Cát Lộc",
        items: [
          "Sinh năm [Năm sinh] động thổ khởi công tháng mấy tốt lành?",
          "Cách hóa giải hướng nhà [Tây Nam/Đông Bắc...] nếu không hợp tuổi?",
          "Vị trí phòng thờ, bếp lò, giường ngủ đặt cung nào để đón tài vận?"
        ]
      },
      {
        icon: "🧱",
        label: "Dự Toán & Vật Tư",
        items: [
          "Bảng tính khối lượng định mức thép, gạch, xi măng cho nhà 100m2?",
          "Đơn giá vật liệu xây dựng phần thô và hoàn thiện trọn gói năm nay?",
          "Phương pháp quản lý ngân sách tránh phát sinh chi phí khi xây nhà?"
        ]
      },
      {
        icon: "🏗️",
        label: "Kỹ Thuật Kết Cấu & MEP",
        items: [
          "Nhà 1 tầng có nhất thiết chống thấm sàn WC không và giải pháp chống thấm chân tường?",
          "Tư vấn thang thông minh âm trần điều khiển từ xa cho nhà 1 tầng mái ngói/mái tôn?",
          "Bố trí gác kỹ thuật trên trần cho bồn nước, lọc nước tổng, máy lọc khí ERV và điều hòa?",
          "Nên chọn móng cọc ly tâm hay móng băng cho nền đất yếu?",
          "Ưu nhược điểm của mác bê tông PCB40 so với PCB30?"
        ]
      },
      {
        icon: "📅",
        label: "Tiến Độ & Thi Công",
        items: [
          "Thời gian thi công nhà [2 tầng / 3 tầng] trung bình khoảng mấy tháng?",
          "Quy trình nghiệm thu cốt thép móng và dầm sàn tiêu chuẩn kỹ thuật?",
          "Cần lưu ý những mốc quan trọng nào trong 5 giai đoạn thi công?"
        ]
      }
    ]
  },
  en: {
    title: "💡 AI Assistant Guidance & Suggested Topics",
    subtitle: "Click to explore professional topics you can ask the AI Expert",
    categories: [
      {
        icon: "🧭",
        label: "Feng Shui Harmony",
        items: [
          "Which month is auspicious for groundbreaking based on my birth year?",
          "How can I resolve or mitigate an unfavorable West home orientation?",
          "What are the best placements for a kitchen stove and altar for wealth?"
        ]
      },
      {
        icon: "🧱",
        label: "Budgets & Materials",
        items: [
          "What is the estimated budget for a 2-story house of 120m2?",
          "What is the current unit rate for rough structure vs. premium finishes?",
          "What are the best material choices for walls to optimize construction costs?"
        ]
      },
      {
        icon: "🏗️",
        label: "Structural Technicalities",
        items: [
          "Should I choose pile foundation or strip foundation for soft soil?",
          "What are the actual technical advantages of PCB40 grade cement?",
          "What are the standard waterproofing methods for roof slabs and balconies?"
        ]
      },
      {
        icon: "📅",
        label: "Timeline & Inspection",
        items: [
          "How many months does it take to complete a 3-story residential villa?",
          "What are the key checklists when inspecting concrete formwork?",
          "Which construction phases require direct engineer supervision?"
        ]
      }
    ]
  },
  lo: {
    title: "💡 ຄຳແນະນຳ & ຫົວຂໍ້ແນະນຳໃນການຖາມ",
    subtitle: "ກົດທີ່ນີ້ເພື່ອເບິ່ງຫົວຂໍ້ທີ່ທ່ານສາມາດປຶກສາກັບຜູ້ຊ່ຽວຊານ AI",
    categories: [
      {
        icon: "🧭",
        label: "ຮວງຈຸ້ຍສິຣິມຸງຄຸນ",
        items: [
          "ປີເກີດ [ລະບຸປີເກີດ] ເລີ່ມກໍ່ສ້າງເດືອນໃດຈຶ່ງຈະດີແລະເປັນມຸງຄຸນ?",
          "ວິທີແກ້ໄຂທິດທາງເຮືອນ [ທິດຕາເວັນຕົກສ່ຽງໃຕ້/ເໜືອ...] ທີ່ບໍ່ຖືກກັບອາຍຸ?",
          "ຕຳແໜ່ງການວາງຫ້ອງບູຊາ, ເຕົາໄຟ, ຕຽງນອນ ຄວນວາງຈຸດໃດເພື່ອຮັບໂຊກ?"
        ]
      },
      {
        icon: "🧱",
        label: "ການຄາດຄະເນ & ວັດສະດຸ",
        items: [
          "ງົບປະມານການກໍ່ສ້າງເຮືອນ 2 ຊັ້ນ ເນື້ອທີ່ 100 ຕາແມັດ ປະມານເທົ່າໃດ?",
          "ລາຄາວັດສະດຸກໍ່ສ້າງໂຄງຮ່າງ ແລະ ວັດສະດຸຕົບແຕ່ງໃນປີນີ້ເປັນແນວໃດ?",
          "ວິທີການວາງແຜນງົບປະມານເພື່ອບໍ່ໃຫ້ມີຄ່າໃຊ້ຈ່າຍບານປາຍເວລາປຸກເຮືອນ?"
        ]
      },
      {
        icon: "🏗️",
        label: "ເຕັກນິກໂຄງສ້າງ",
        items: [
          "ຄວນເລືອກຮາກຖານເສົາເຂັມ ຫຼື ຮາກຖານແຜ ສຳລັບດິນອ່ອນ?",
          "ຂໍ້ດີແລະຂໍ້ເສຍຂອງຊີມັງ PCB40 ທຽບກັບ PCB30 ມີຫຍັງແດ່?",
          "ວິທີການປ້ອງກັນການຊຶມນ້ຳຂອງຫ້ອງນ້ຳ ແລະ ດາດຟ້າເຮືອນ?"
        ]
      },
      {
        icon: "📅",
        label: "ກຳນົດເວລາ & ການກວດສອບ",
        items: [
          "ໄລຍະເວລາໃນການກໍ່ສ້າງເຮືອນ 2 ຊັ້ນ ໂດຍສະເລ່ຍແມ່ນຈັກເດືອນ?",
          "ຂັ້ນຕອນການກວດສອບໂຄງເຫຼັກເສົາແລະຄານ ຕາມມາດຕະຖານເຕັກນິກ?",
          "ມີຈຸດສຳຄັນໃດແດ່ທີ່ຕ້ອງເອົາໃຈໃສ່ໃນ 5 ໄລຍະຂອງການກໍ່ສ້າງ?"
        ]
      }
    ]
  },
  zh: {
    title: "💡 问答指导与建议咨询主题",
    subtitle: "点击此处查看您可以与 AI 专家探讨的专业建筑风水课题",
    categories: [
      {
        icon: "🧭",
        label: "周易风水命理",
        items: [
          "业主生于[出生年份]年，在今年几月份动土开工最吉利？",
          "如果房屋朝向[西南/东北...]与家主八字不合，如何化解煞气？",
          "佛堂神位、厨房炉灶、主卧床头应安置在何种吉星方位以聚气纳财？"
        ]
      },
      {
        icon: "🧱",
        label: "造价预算与建材",
        items: [
          "一栋占地100平米的2层住宅，砖、沙、石、钢材的物料消耗预算？",
          "目前本地毛坯主体结构与全包精装的均价单价水平是多少？",
          "如何进行合理的建筑预算规划，以彻底规避工程中途超支？"
        ]
      },
      {
        icon: "🏗️",
        label: "建筑结构技术",
        items: [
          "软土地基上建房，应当优选预制管桩基础还是条形基础？",
          "高抗折PCB40级水泥相较于普通级有哪些核心技术优势？",
          "屋面、阳台及卫生间湿区的专业防渗、防水涂料施工工艺流程？"
        ]
      },
      {
        icon: "📅",
        label: "工期进度与节点验收",
        items: [
          "通常建造一栋[2层/3层]砖混或框架结构的住宅需要几个月工期？",
          "梁板与基础钢筋绑扎完成后，有哪些核心的验收核对指标？",
          "在房屋施工的5个核心阶段中，业主需要亲自把关的重点节点？"
        ]
      }
    ]
  }
};
