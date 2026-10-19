export interface UserInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string; // YYYY-MM-DD
  birthHour?: string; // HH:MM
  gender: 'nam' | 'nu';
  desiredDirection: string;
  purpose: string;
  constructionYear?: number; // Năm âm lịch dự kiến khởi công
}

export interface FengShuiAnalysis {
  element: string; // Mệnh ngũ hành (e.g., Thiên Thượng Hỏa (Lửa trên trời))
  cungPhi: string; // Cung phi (e.g., Chấn Mộc (Đông Tứ Mệnh))
  favorableDirections: string[]; // Các hướng hợp tuổi
  unfavorableDirections?: string[]; // Các hướng kỵ
  favorableColors: string[]; // Màu sắc phong thủy hợp
  unfavorableColors?: string[]; // Màu sắc phong thủy kỵ
  luckyColors?: string[]; // Alias hỗ trợ tương thích
  favorableGroundbreakingDates: string[]; // Ngày động thổ thích hợp
  deepAnalysis: string; // Phân tích chuyên sâu phong thủy thực tế sách cổ
  deepAnalysisCore?: string; // bản hiển thị trên giao diện (không lặp các khung riêng)
  canChi?: string; // Ví dụ: Kỷ Mùi
  advice2026?: string; // Lời khuyên động thổ 2026
  luckyNumbers?: number[];
  isLocal?: boolean; // Flag to identify if the analysis was generated locally
  targetYear?: number; // Năm khởi công dùng để xét hạn
  borrowAgeCandidates?: number[]; // Năm sinh có thể mượn tuổi
  borrowAgeDetails?: { year: number; canChi: string; why: string }[];
  auspiciousDays?: { solar: string; weekday: string; lunar: string; dayCanChi: string; than: string; hours: string[]; note: string }[];
  spouseAdvice?: string[];
  menhQuaiExplain?: string;
  directionVerdict?: {
    direction: string;
    star: string;
    isGood: boolean;
    level: string;
    summary: string;
    remedy: string[];
  };
}

export interface ConstructionInfo {
  overallDescription: string;
  constructionType: string; // Loại công trình dropdown
  totalBudget: number;
  budgetUnit: 'VND' | 'USD';
  standard: 'vietnam' | 'international' | 'other';
  otherStandardRequirement?: string;
  dimensions: string; // e.g. "8x15" or "120m2"
  floors: number;
  calculationMethod?: 'coefficient' | 'direct_floor';
  loai_ket_cau_chinh?: string;
  so_mat_tien?: number;
  thep_hop_cot?: string;
  loai_mai?: string;
  loai_san?: string;
  loai_vach?: string;
  loai_tran?: string;
  province?: string;            // Tỉnh/thành (34 tỉnh mới)
  soilType?: string;            // tot | yeu | cat | chua_biet
  frontSetbackM?: number | string; // Khoảng lùi trước (m) — trống = tự động
  backSetbackM?: number | string;  // Khoảng lùi sau (m)
  // PA1 Traditional Reinforced Concrete fields
  mac_be_tong?: string;
  mac_thep?: string;
  loai_gach?: string;
  bien_phap_cop_pha?: string;
  // PA3 EPS Monolithic Lightweight Concrete fields
  ty_trong_eps?: string;
  do_day_vach_eps?: string;
  rooms: {
    livingRoom: boolean;
    bedroomCount: number;
    kitchen: boolean;
    kitchenType: 'open' | 'closed';
    worshipRoom: boolean;
    workRoom: boolean;
    bathroomCount: number;
    dryingYard: boolean;
    parkingType: 'garage' | 'yard' | 'none';
    garden: boolean;
    fishPond: boolean;
    swimmingPool: boolean;
    entertainmentRoom: boolean;
    othersCount: string;
  };
  referenceImages: string[]; // Array of base64 or relative image URLs
}

export interface UserInfoExtended extends UserInfo {
  birthYear?: number;           // Lấy từ birthDate — dùng để tính mệnh
  spouseBirthYear?: number;     // Năm sinh vợ/chồng — gói 299K+
  spouseGender?: 'nam' | 'nu';
}

export interface ConstructionInfoExtended extends ConstructionInfo {
  province?: string;            // Tỉnh/thành phố — map ra vùng miền
  region?: string;              // Vùng miền — tự map từ province
  soilType?: 'tot' | 'yeu' | 'cat' | 'set' | 'chua_biet';
  architectureStyle?: 'hien_dai' | 'tan_co_dien' | 'tropical' | 'truyen_thong' | 'toi_gian' | 'khac';
}

export interface OnboardingData {
  birthYear: number;
  gender: 'nam' | 'nu';
  province: string;
  soilType: string;
  architectureStyle: string;
  completedAt: string;
}

export interface DetailItems {
  foundation: string; // móng
  wall: string; // tường
  columns: string; // cột
  beam: string; // dầm
  frame: string; // khung
  ceiling: string; // trần
  cementType: string; // xi măng
  mainDoor: string; // cửa chính
  roomDoor: string; // cửa phòng
  window: string; // cửa sổ
  roof: string; // mái
  tiles: string; // gạch ốp lát
  electricsWater: string; // điện nước
  kitchenAppliances: string; // thiết bị bếp
  interior: string; // nội thất
  exterior: string; // ngoại thất
  landscape: string; // tiểu cảnh
  fence: string; // hàng rào
  pool: string; // hồ bơi
  otherRequests: string; // yêu cầu khác
}

export interface QuestionAnswer {
  id: string;
  question: string;
  answer?: string;
  createdAt: string;
  image?: string;
}

export interface AICostEstimationUnit {
  no: number;
  category: string;
  material: string;
  labor: string;
  unitPrice: string;
  total: string;
}

export interface AIResultReport {
  budgetTable: AICostEstimationUnit[];
  estimatedDuration: string;
  structuralAnalysis: {
    foundation: string;
    columns: string;
    frame: string;
    roof: string;
    beam: string;
    waterproofing: string;
  };
  expertNote: string;
  threeOptions: {
    economy: { title: string; desc: string; estimatedPrice: string };
    standard: { title: string; desc: string; estimatedPrice: string };
    premium: { title: string; desc: string; estimatedPrice: string };
  };
  customConceptImageUrl?: string;
}

export interface CustomerLead {
  id: string;
  userInfo: UserInfo;
  fengShuiAnalysis?: FengShuiAnalysis;
  constructionInfo: ConstructionInfo;
  detailItems?: DetailItems;
  aiResult?: AIResultReport;
  status: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost'; // Trạng thái chăm sóc KH
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalAnalyses: number;
  estimatedRevenue: {
    vnd: number;
    usd: number;
  };
  leadsByStatus: {
    new: number;
    contacted: number;
    negotiating: number;
    won: number;
    lost: number;
  };
  leadsHistory: Array<{
    id: string;
    name: string;
    phone: string;
    constructionType: string;
    totalBudget: string;
    createdAt: string;
    status: string;
  }>;
}
