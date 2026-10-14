import React, { useState, useEffect, useRef } from 'react';
import { Box, Play, X, Eye, Filter, ChevronDown, ChevronUp, Video, Sparkles, RefreshCw, Layers } from 'lucide-react';
import * as THREE from 'three';
import { getDesignSamples } from '../lib/designSamples';

interface DesignTemplateGalleryProps {
  theme: 'light' | 'dark';
  lang: 'vi' | 'en' | 'lo' | 'zh';
  fengShuiElement?: string; // Kim, Mộc, Thủy, Hỏa, Thổ
  floors?: number;
  dimensions?: string;
}

interface TemplateItem {
  id: string;
  name?: string;
  roomType?: string;
  constructionType?: string;
  style: string;
  element?: string;
  imageUrl: string;
  youtubeId?: string;
  videoUrl?: string;
  title?: string;
  note?: string;
  prompt?: string;
}

export default function DesignTemplateGallery({
  theme,
  lang,
  fengShuiElement = 'Mộc',
  floors = 2,
  dimensions = '10 x 15 m'
}: DesignTemplateGalleryProps) {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRoom, setSelectedRoom] = useState<string>("Tất cả");
  const [selectedStyle, setSelectedStyle] = useState<string>("Tất cả");
  const [selectedElement, setSelectedElement] = useState<string>("Tất cả");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);
  const [show3DModel, setShow3DModel] = useState<boolean>(true);

  // Three.js Canvas Ref for 3D House Model
  const mountRef = useRef<HTMLDivElement>(null);

  // Fetch templates from Firestore
  useEffect(() => {
    getDesignSamples()
      .then(data => {
        setTemplates(data as unknown as TemplateItem[]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching templates:", err);
        setLoading(false);
      });
  }, []);

  // Helper to format Google Drive URL or standard image URL
  const formatImageUrl = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
    if (url.includes("drive.google.com") && url.includes("id=")) {
      return url;
    }
    return url;
  };

  // Helper to extract clean YouTube Video ID or null if missing/invalid
  const extractYoutubeId = (urlOrId?: string): string | null => {
    if (!urlOrId) return null;
    const str = String(urlOrId).trim();
    if (!str || str === 'dQw4w9WgXcQ') return null;
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = str.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return str;
    }
    return null;
  };

  // Translation dictionaries for data items
  const ROOM_TRANSLATIONS: Record<string, Record<string, string>> = {
    "Phòng khách": { vi: "Phòng khách", en: "Living Room", lo: "ຫ້ອງຮັບແຂກ", zh: "客厅" },
    "Phòng bếp": { vi: "Phòng bếp", en: "Kitchen", lo: "ຫ້ອງຄົວ", zh: "厨房" },
    "Phòng ngủ": { vi: "Phòng ngủ", en: "Bedroom", lo: "ຫ້ອງນອນ", zh: "卧室" },
    "Phòng tắm": { vi: "Phòng tắm", en: "Bathroom", lo: "ຫ້ອງນ້ຳ", zh: "浴室" },
    "Hồ cá Koi": { vi: "Hồ cá Koi", en: "Koi Pond", lo: "ໜອງປາຄຣາບ", zh: "锦鲤池" },
    "Sân vườn": { vi: "Sân vườn", en: "Garden / Yard", lo: "ສວນ", zh: "庭院花园" },
    "Cầu thang": { vi: "Cầu thang", en: "Staircase", lo: "ຂັ້ນໄດ", zh: "楼梯" }
  };

  const STYLE_TRANSLATIONS: Record<string, Record<string, string>> = {
    "Tân cổ điển": { vi: "Tân cổ điển", en: "Neoclassical", lo: "ແບບຄລາສສິກໃໝ່", zh: "新古典" },
    "Hiện đại": { vi: "Hiện đại", en: "Modern", lo: "ແບບທັນສະໄໝ", zh: "现代" },
    "Tối giản": { vi: "Tối giản", en: "Minimalist", lo: "ແບບລຽບງ່າຍ", zh: "极简" },
    "Indochine": { vi: "Đông Dương (Indochine)", en: "Indochine", lo: "ອິນໂດຈີນ", zh: "印度支那" },
    "Truyền thống": { vi: "Truyền thống", en: "Traditional", lo: "ແບບດັ້ງເດີມ", zh: "传统" },
    "Tropical": { vi: "Nhiệt đới (Tropical)", en: "Tropical", lo: "ເຂດຮ້ອນ", zh: "热带风格" },
    "Luxury": { vi: "Sang trọng (Luxury)", en: "Luxury", lo: "ຫຼູຫຼາ", zh: "奢华" },
    "Nhật Bản": { vi: "Nhật Bản (Japandi)", en: "Japanese / Japandi", lo: "ແບບຍີ່ປຸ່ນ", zh: "日式极简" },
    "Bắc Âu": { vi: "Bắc Âu (Scandinavian)", en: "Scandinavian", lo: "ແບບນອກດິກ", zh: "北欧风" }
  };

  const ELEMENT_TRANSLATIONS: Record<string, Record<string, string>> = {
    "Kim": { vi: "Kim", en: "Metal", lo: "ທາດເຫຼັກ", zh: "金" },
    "Mộc": { vi: "Mộc", en: "Wood", lo: "ທາດໄມ້", zh: "木" },
    "Thủy": { vi: "Thủy", en: "Water", lo: "ທາດນ້ຳ", zh: "水" },
    "Hỏa": { vi: "Hỏa", en: "Fire", lo: "ທາດໄຟ", zh: "火" },
    "Thổ": { vi: "Thổ", en: "Earth", lo: "ທາດດິນ", zh: "土" }
  };

  const translateRoom = (room: string) => ROOM_TRANSLATIONS[room]?.[lang] || room;
  const translateStyle = (style: string) => STYLE_TRANSLATIONS[style]?.[lang] || style;
  const translateElement = (el: string) => ELEMENT_TRANSLATIONS[el]?.[lang] || el;

  const translateTitle = (title: string) => {
    if (title === 'Phòng khách Tân Cổ Điển') {
      if (lang === 'zh') return '新古典风格客厅';
      if (lang === 'en') return 'Neoclassical Living Room';
      if (lang === 'lo') return 'ຫ້ອງຮັບແຂກແບບຄລາສສິກໃໝ່';
    }
    if (title === 'Phòng ngủ Hiện Đại') {
      if (lang === 'zh') return '现代温馨主卧室';
      if (lang === 'en') return 'Modern Cozy Bedroom';
      if (lang === 'lo') return 'ຫ້ອງນອນແບບທັນສະໄໝ';
    }
    if (title === 'Phòng bếp Tối Giản') {
      if (lang === 'zh') return '极简实用整体厨房';
      if (lang === 'en') return 'Minimalist Functional Kitchen';
      if (lang === 'lo') return 'ຫ້ອງຄົວແບບລຽບງ່າຍ';
    }
    return title;
  };

  const translateNote = (note: string, prompt: string) => {
    const text = note || prompt || "";
    if (!text) return '';
    if (text.toLowerCase().includes('phòng khách') || text.toLowerCase().includes('tân cổ điển')) {
      if (lang === 'zh') return '轻奢优雅，雕花精致，完美契合木命主人的风水气场。';
      if (lang === 'en') return 'Elegant neoclassical layout, perfectly harmonious with Wood element feng shui.';
      if (lang === 'lo') return 'ການອອກແບບຫຼູຫຼາ ສະຫງ່າງາມ ເໝາະສົມກັບຮວງຈຸ້ຍທາດໄມ້.';
    }
    if (text.toLowerCase().includes('phòng ngủ') || text.toLowerCase().includes('hiện đại')) {
      if (lang === 'zh') return '光线柔和，色调温馨，营造宁静深度的舒适睡眠空间。';
      if (lang === 'en') return 'Warm lighting and cozy palette, creating a restful sleeping atmosphere.';
      if (lang === 'lo') return 'ແສງສະຫວ່າງອົບອຸ່ນ ໃຫ້ຄວາມຮູ້ສຶກສະບາຍໃນການນອນ.';
    }
    if (text.toLowerCase().includes('bếp') || text.toLowerCase().includes('tối giản')) {
      if (lang === 'zh') return '动线流畅，收纳充足，兼具现代美感与日常实用性。';
      if (lang === 'en') return 'Seamless workflow and ample storage, balancing modern aesthetics and daily utility.';
      if (lang === 'lo') return 'ການຈັດວາງເປັນລະບຽບ ສະດວກສະບາຍຕໍ່ການໃຊ້ງານ.';
    }
    return text;
  };

  // Translations
  const t = {
    vi: {
      title: "D. Thư Viện Mẫu Thiết Kế & Video Minh Họa (Google Sheet)",
      subtitle: "Khám phá không gian phòng ốc, sân vườn 3D & video YouTube trực quan được đồng bộ từ tab 'Mau_Thiet_Ke'",
      toggleOpen: "Thu gọn",
      toggleClose: "Mở rộng thư viện",
      filterRoom: "Loại phòng:",
      filterStyle: "Phong cách:",
      filterElement: "Mệnh ngũ hành:",
      allOption: "Tất cả",
      watchVideo: "Xem video",
      updatingVideo: "Đang cập nhật video",
      yourElementBtn: (el: string) => `✨ Mệnh ${el} của bạn`,
      elementBadge: (el: string) => `Mệnh ${el}`,
      styleLabel: "Phong cách:",
      countUnit: "mẫu thiết kế",
      sourceBadge: "Đồng bộ Google Drive & YouTube",
      zoomTooltip: "Phóng to ảnh",
      model3DTitle: "Mô Hình 3D Ngôi Nhà Trực Quan (Three.js)",
      model3DSub: "Mô phỏng khối tích cấu trúc dựa trên số tầng và diện tích đất của bạn",
      toggle3Don: "Tắt mô hình 3D",
      toggle3Doff: "Bật mô hình 3D",
      noResult: "Không tìm thấy mẫu thiết kế phù hợp với bộ lọc hiện tại.",
      loadingText: "Đang tải dữ liệu từ Google Sheet (Mau_Thiet_Ke)...",
      floorsUnit: "tầng",
      canvas3DRotate: "Mô hình 3D Three.js · Xoay 360°",
      youtubeModalTitle: "YouTube Minh Họa Kỹ Thuật & Không Gian 3D"
    },
    en: {
      title: "D. Design Template Gallery & Video Showcase (Google Sheet)",
      subtitle: "Explore room interiors, 3D gardens & YouTube videos synced from 'Mau_Thiet_Ke' tab",
      toggleOpen: "Collapse",
      toggleClose: "Expand Gallery",
      filterRoom: "Room Type:",
      filterStyle: "Style:",
      filterElement: "Element:",
      allOption: "All",
      watchVideo: "Watch Video",
      updatingVideo: "Video updating",
      yourElementBtn: (el: string) => `✨ Your ${el} Element`,
      elementBadge: (el: string) => `Element: ${el}`,
      styleLabel: "Style:",
      countUnit: "templates",
      sourceBadge: "Google Drive & YouTube Embedded",
      zoomTooltip: "Zoom image",
      model3DTitle: "Interactive 3D House Model (Three.js)",
      model3DSub: "Structural massing simulation based on your floor count and land dimensions",
      toggle3Don: "Hide 3D Model",
      toggle3Doff: "Show 3D Model",
      noResult: "No templates found matching your current filter.",
      loadingText: "Loading templates from Google Sheet...",
      floorsUnit: "floors",
      canvas3DRotate: "Three.js 3D Model Canvas · Rotate 360°",
      youtubeModalTitle: "YouTube Video Showcase & 3D Spatial Demo"
    },
    lo: {
      title: "D. ຫໍສະໝຸດແບບອອກແບບ ແລະ ວິດີໂອສາທິດ (Google Sheet)",
      subtitle: "ສຳຫຼວດຫ້ອງຕ່າງໆ, ສວນ 3D ແລະ ວິດີໂອ YouTube ທີ່ຊິ້ງຈາກແຖບ 'Mau_Thiet_Ke'",
      toggleOpen: "ຫຍໍ້ລົງ",
      toggleClose: "ຂະຫຍາຍຫໍສະໝຸດ",
      filterRoom: "ປະເພດຫ້ອງ:",
      filterStyle: "ຮູບແບບ:",
      filterElement: "ທາດຮວງຈຸ້ຍ:",
      allOption: "ທັງໝົດ",
      watchVideo: "ເບິ່ງວິດີໂອ",
      updatingVideo: "ກຳລັງອັບເດດວິດີໂອ",
      yourElementBtn: (el: string) => `✨ ທາດ ${el} ຂອງທ່ານ`,
      elementBadge: (el: string) => `ທາດ ${el}`,
      styleLabel: "ຮູບແບບ:",
      countUnit: "ແບບອອກແບບ",
      sourceBadge: "ເຊື່ອມຕໍ່ Google Drive & YouTube",
      zoomTooltip: "ຂະຫຍາຍຮູບ",
      model3DTitle: "ໂມເດວເຮືອນ 3D ຕົວຈິງ (Three.js)",
      model3DSub: "ຈຳລອງໂຄງສ້າງຕາມຈຳນວນຊັ້ນ ແລະ ເນື້ອທີ່ດິນຂອງທ່ານ",
      toggle3Don: "ປິດໂມເດວ 3D",
      toggle3Doff: "ເປີດໂມເດວ 3D",
      noResult: "ບໍ່ພົບແບບອອກແບບທີ່ກົງກັບຕົວກອງປັດຈຸບັນ.",
      loadingText: "ກຳລັງໂຫຼດຂໍ້ມູນ...",
      floorsUnit: "ຊັ້ນ",
      canvas3DRotate: "ໂມເດວ 3D Three.js · ໝູນໄດ້ 360°",
      youtubeModalTitle: "ວິດີໂອ YouTube ສາທິດເຕັກນິກ ແລະ ພື້ນທີ່ 3D"
    },
    zh: {
      title: "D. 设计图库样板间与视频展示 (Google Sheet)",
      subtitle: "探索从 'Mau_Thiet_Ke' 表格同步的房间内景、3D庭院及视频展示",
      toggleOpen: "收起",
      toggleClose: "展开图库",
      filterRoom: "空间类型：",
      filterStyle: "设计风格：",
      filterElement: "五行命理：",
      allOption: "全部",
      watchVideo: "观看视频",
      updatingVideo: "视频更新中",
      yourElementBtn: (el: string) => `✨ 您的 ${el} 命理`,
      elementBadge: (el: string) => `${el} 命`,
      styleLabel: "设计风格：",
      countUnit: "个样板间",
      sourceBadge: "云端直链与 YouTube 视频内嵌",
      zoomTooltip: "放大查看",
      model3DTitle: "交互式3D房屋结构模型 (Three.js)",
      model3DSub: "基于您输入的楼层数与占地面积生成的直观立体体量模拟",
      toggle3Don: "关闭3D模型",
      toggle3Doff: "开启3D模型",
      noResult: "未找到符合当前筛选条件的样板间。",
      loadingText: "正在从Google表格同步数据...",
      floorsUnit: "层",
      canvas3DRotate: "Three.js 3D 交互模型 · 360° 旋转",
      youtubeModalTitle: "YouTube 样板间展示与 3D 空间演示"
    }
  }[lang] || {
    title: "D. Design Template Gallery",
    subtitle: "Explore room interiors, 3D models & video showcases",
    toggleOpen: "Collapse",
    toggleClose: "Expand",
    filterRoom: "Room:",
    filterStyle: "Style:",
    filterElement: "Element:",
    allOption: "All",
    watchVideo: "Watch Video",
    updatingVideo: "Video updating",
    yourElementBtn: (el: string) => `✨ Element: ${el}`,
    elementBadge: (el: string) => `Element: ${el}`,
    styleLabel: "Style:",
    countUnit: "templates",
    sourceBadge: "Google Drive & YouTube Embedded",
    zoomTooltip: "Zoom image",
    model3DTitle: "3D House Model",
    model3DSub: "3D Model simulation",
    toggle3Don: "Hide 3D",
    toggle3Doff: "Show 3D",
    noResult: "No templates found.",
    loadingText: "Loading...",
    floorsUnit: "floors",
    canvas3DRotate: "Three.js 3D Canvas",
    youtubeModalTitle: "YouTube Video Showcase"
  };

  // Three.js 3D house builder
  useEffect(() => {
    if (!show3DModel || !mountRef.current) return;

    const currentMount = mountRef.current;
    const width = currentMount.clientWidth;
    const height = 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0b0f19 : 0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 9, 14);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0xef4444, 0x94a3b8);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const houseGroup = new THREE.Group();
    const floorHeight = 1.5;
    const houseWidth = 4.2;
    const houseDepth = 3.2;

    for (let i = 0; i < floors; i++) {
      const geometry = new THREE.BoxGeometry(houseWidth, floorHeight, houseDepth);
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xe2e8f0 : 0xcbd5e1,
        roughness: 0.3,
        metalness: 0.1
      });
      const floorMesh = new THREE.Mesh(geometry, material);
      floorMesh.position.y = i * floorHeight + floorHeight / 2;
      floorMesh.castShadow = true;
      floorMesh.receiveShadow = true;
      houseGroup.add(floorMesh);
    }

    const roofGeo = new THREE.ConeGeometry(houseWidth * 0.85, 1.6, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = floors * floorHeight + 0.8;
    roofMesh.rotation.y = Math.PI / 4;
    houseGroup.add(roofMesh);

    scene.add(houseGroup);

    let animationFrameId: number;
    let angle = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      angle += 0.005;
      houseGroup.rotation.y = angle;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [show3DModel, floors, isDark]);

  // Filter templates
  const filteredTemplates = templates.filter(item => {
    if (selectedRoom !== "Tất cả") {
      const itemRoom = item.roomType || (item as any).constructionType;
      if (itemRoom !== selectedRoom) return false;
    }
    if (selectedStyle !== "Tất cả" && item.style !== selectedStyle) return false;
    if (selectedElement !== "Tất cả") {
      const itemElement = item.element || fengShuiElement;
      if (itemElement !== selectedElement) return false;
    }
    return true;
  });

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border transition-all my-6 ${
      isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      {/* Header & Collapsible Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/20 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-purple-600/15 text-purple-600 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            SECTION D · GOOGLE SHEET (Mau_Thiet_Ke) & THREE.JS
          </div>
          <h3 className={`text-lg sm:text-xl font-black uppercase tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {t.title}
          </h3>
          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>{t.toggleOpen}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>{t.toggleClose}</span>
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 3D HOUSE MODEL VIEWER SECTION */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#121829]/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className={`text-sm font-extrabold uppercase ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {t.model3DTitle}
                  </h4>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t.model3DSub} ({floors} {t.floorsUnit}, {dimensions})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow3DModel(!show3DModel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  show3DModel ? 'bg-red-600 text-white border-red-600' : 'bg-slate-700 text-white border-slate-600'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{show3DModel ? t.toggle3Don : t.toggle3Doff}</span>
              </button>
            </div>

            {show3DModel && (
              <div 
                ref={mountRef} 
                className="w-full h-[260px] rounded-xl overflow-hidden shadow-inner border border-slate-700/30 relative bg-slate-900"
              >
                <div className="absolute bottom-2 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-mono pointer-events-none flex items-center gap-1">
                  <Layers className="w-3 h-3 text-red-400" /> {t.canvas3DRotate}
                </div>
              </div>
            )}
          </div>

          {/* FILTERS BAR */}
          <div className={`p-4 rounded-2xl border flex flex-wrap gap-4 items-center justify-between ${
            isDark ? 'bg-[#121829]/30 border-slate-800' : 'bg-slate-100/80 border-slate-200'
          }`}>
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-red-600" />
              
              {/* Room type filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">{t.filterRoom}</span>
                <select 
                  value={selectedRoom} 
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className={`text-xs p-1.5 rounded-lg border font-semibold outline-none cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Tất cả">{t.allOption}</option>
                  <option value="Phòng khách">{translateRoom("Phòng khách")}</option>
                  <option value="Phòng bếp">{translateRoom("Phòng bếp")}</option>
                  <option value="Phòng ngủ">{translateRoom("Phòng ngủ")}</option>
                  <option value="Phòng tắm">{translateRoom("Phòng tắm")}</option>
                  <option value="Hồ cá Koi">{translateRoom("Hồ cá Koi")}</option>
                  <option value="Sân vườn">{translateRoom("Sân vườn")}</option>
                  <option value="Cầu thang">{translateRoom("Cầu thang")}</option>
                </select>
              </div>

              {/* Element filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">{t.filterElement}</span>
                <select 
                  value={selectedElement} 
                  onChange={(e) => setSelectedElement(e.target.value)}
                  className={`text-xs p-1.5 rounded-lg border font-semibold outline-none cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Tất cả">{t.allOption}</option>
                  <option value="Kim">{translateElement("Kim")}</option>
                  <option value="Mộc">{translateElement("Mộc")}</option>
                  <option value="Thủy">{translateElement("Thủy")}</option>
                  <option value="Hỏa">{translateElement("Hỏa")}</option>
                  <option value="Thổ">{translateElement("Thổ")}</option>
                </select>
              </div>

              {/* Quick match element button */}
              <button
                type="button"
                onClick={() => setSelectedElement(fengShuiElement)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                  selectedElement === fengShuiElement 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' 
                    : isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span>{t.yourElementBtn(translateElement(fengShuiElement))}</span>
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-red-600">
              {filteredTemplates.length} {t.countUnit}
            </div>
          </div>

          {/* TEMPLATES GRID */}
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400 font-mono animate-pulse">
              {t.loadingText}
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((item) => {
                const itemVideoId = extractYoutubeId(item.youtubeId || item.videoUrl);
                const hasVideo = Boolean(itemVideoId);
                return (
                  <div 
                    key={item.id}
                    className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg ${
                      isDark ? 'bg-[#121829] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Image container with Google Drive direct embedding support */}
                    <div className="relative aspect-video overflow-hidden bg-slate-900 group">
                      <img 
                        src={formatImageUrl(item.imageUrl)} 
                        alt={item.title || item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                          {translateRoom(item.roomType || (item as any).constructionType || "Phòng khách")}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30">
                          {t.elementBadge(translateElement(item.element || fengShuiElement))}
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                        <button
                          type="button"
                          onClick={() => setActiveImageZoom(formatImageUrl(item.imageUrl))}
                          className="p-2.5 bg-white/90 hover:bg-white rounded-full text-slate-900 shadow-md cursor-pointer transition"
                          title={t.zoomTooltip}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasVideo && (
                          <button
                            type="button"
                            onClick={() => setActiveVideoId(itemVideoId)}
                            className="p-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-md cursor-pointer transition flex items-center gap-1 px-3.5 text-xs font-bold"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{t.watchVideo}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1">
                          {t.styleLabel} {translateStyle(item.style)}
                        </div>
                        <h4 className={`text-sm font-extrabold line-clamp-2 mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {translateTitle(item.title || item.name || "")}
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {translateNote(item.note || "", item.prompt || "")}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">{t.sourceBadge}</span>
                        {hasVideo ? (
                          <button
                            type="button"
                            onClick={() => setActiveVideoId(itemVideoId)}
                            className="text-xs font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>▶ {t.watchVideo}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 italic">
                            <Video className="w-3.5 h-3.5 opacity-50" />
                            <span>{t.updatingVideo}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-slate-500 font-mono">
              {t.noResult}
            </div>
          )}

        </div>
      )}

      {/* YOUTUBE LIGHTBOX MODAL */}
      {activeVideoId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between p-3.5 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-red-500" />
                {t.youtubeModalTitle}
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoId(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="YouTube video player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM LIGHTBOX MODAL */}
      {activeImageZoom && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveImageZoom(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/70 hover:bg-red-600 rounded-full text-white cursor-pointer transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeImageZoom} 
              alt="Zoomed view" 
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
