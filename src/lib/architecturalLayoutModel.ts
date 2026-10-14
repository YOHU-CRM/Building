import { computeSite } from './siteGeometry';
/**
 * Architectural Layout Model
 * Authoritative single source of truth for 2D Floor Plan rendering,
 * BOQ material takeoff counts (doors, windows, WC equipment), and room area balancing.
 */

export interface RoomLayoutItem {
  id: string;
  name: string;
  icon: string;
  areaM2: number;
  floor: number;
  description: string;
}

export interface ArchitecturalLayoutModel {
  widthM: number;
  lengthM: number;
  lotAreaM2: number;
  frontSetbackM: number;
  backSetbackM: number;
  houseLengthM: number;
  groundFloorArea: number;
  totalConstructionArea: number;
  floors: number;
  currentFloor: number;
  
  // Total Building Room Counts
  totalBedroomCount: number;
  totalWcCount: number;
  hasWorshipRoom: boolean;
  hasLivingRoom: boolean;
  hasKitchen: boolean;
  
  // Current Floor Specific Metrics & Rooms
  floorRooms: RoomLayoutItem[];
  allBuildingRooms: RoomLayoutItem[];
  
  // Areas for Current Floor
  livingArea: number;
  kitchenArea: number;
  bed1Area: number;
  bed2Area: number;
  bed3Area?: number;
  wcArea: number;
  worshipArea?: number;
  yardFrontArea: number;
  yardBackArea: number;
  
  // Area Balance for Current Floor
  usableRoomsArea: number;
  structureAndCorridorArea: number;
  balanceExplanation: string;
  
  // Count Metrics (Synced across 2D Plan and BOQ for the ENTIRE building)
  wcCount: number;
  bedroomCount: number;
  mainDoorCount: number;
  roomDoorCount: number;
  wcDoorCount: number;
  backDoorCount: number;
  windowCount: number;
  totalDoors: number;
  totalDoorAndWindowCount: number;
  totalDoorAndWindowAreaM2: number;
}

export interface LayoutModelInputParams {
  frontSetbackM?: number | string;
  backSetbackM?: number | string;
  widthM?: number;
  lengthM?: number;
  floors?: number;
  currentFloor?: number;
  groundFloorArea?: number;
  totalConstructionArea?: number;
  requestedBedrooms?: number;
  requestedBathrooms?: number;
  roomsConfig?: {
    bedroomCount?: number;
    bathroomCount?: number;
    livingRoom?: boolean;
    kitchen?: boolean;
    worshipRoom?: boolean;
    garden?: boolean;
    balcony?: boolean;
    garage?: boolean;
  };
  fengShuiAnalysis?: any;
}

/**
 * Determine the expert architectural recommendation for bedroom count
 * when the user has not explicitly provided one.
 */
export function getExpertRecommendedBedrooms(floors: number, groundAreaM2: number): number {
  const f = Math.max(1, floors);
  const area = groundAreaM2 > 0 ? groundAreaM2 : 80;
  
  if (f === 1) {
    if (area < 65) return 2;
    if (area <= 120) return 3;
    return 4;
  }
  if (f === 2) {
    if (area < 50) return 3;
    if (area <= 90) return 3;
    return 4;
  }
  if (f === 3) {
    if (area < 50) return 4;
    if (area <= 90) return 4;
    return 5;
  }
  // 4+ floors
  return Math.min(10, Math.max(4, f + 1));
}

/**
 * Determine the expert architectural recommendation for bathroom (WC) count
 */
export function getExpertRecommendedBathrooms(floors: number, bedrooms: number, groundAreaM2: number): number {
  const f = Math.max(1, floors);
  if (f === 1) {
    return groundAreaM2 > 100 || bedrooms >= 3 ? 2 : 1;
  }
  // Multi-floor: at least 1 WC per floor, or 1 WC per floor + 1 master ensuite
  return Math.max(2, Math.min(bedrooms, f + (bedrooms >= 4 ? 1 : 0)));
}

export function computeArchitecturalLayoutModel(params: LayoutModelInputParams): ArchitecturalLayoutModel {
  const widthM = params.widthM && params.widthM > 0 ? params.widthM : 10;
  const lengthM = params.lengthM && params.lengthM > 0 ? params.lengthM : 15;
  const floors = Math.max(1, params.floors || 1);
  const currentFloor = Math.max(1, Math.min(floors, params.currentFloor || 1));
  const lotAreaM2 = Math.round(widthM * lengthM);

  // Khoảng lùi: lấy theo khách nhập, nếu không có thì mặc định (dùng chung với dự toán — siteGeometry)
  const site = computeSite(`${widthM}x${lengthM}`, params.frontSetbackM, params.backSetbackM);
  const frontSetbackM = site.frontSetbackM;
  const backSetbackM = site.backSetbackM;
  const houseLengthM = Math.max(4, site.houseLengthM);

  const calculatedGroundArea = Math.round(widthM * houseLengthM);
  const groundFloorArea = (params.groundFloorArea && params.groundFloorArea > 0)
    ? Math.round(params.groundFloorArea)
    : calculatedGroundArea;

  const totalConstructionArea = (params.totalConstructionArea && params.totalConstructionArea > 0)
    ? Math.round(params.totalConstructionArea)
    : Math.round(groundFloorArea * floors);

  // 1. RESOLVE BEDROOM COUNT (Strictly from user input if given, else Expert Architecture Default)
  let totalBedroomCount: number;
  const rawBed = params.requestedBedrooms ?? params.roomsConfig?.bedroomCount;
  if (rawBed !== undefined && rawBed !== null && Number(rawBed) > 0) {
    totalBedroomCount = Math.max(1, Math.min(20, Math.round(Number(rawBed))));
  } else {
    totalBedroomCount = getExpertRecommendedBedrooms(floors, groundFloorArea);
  }

  // 2. RESOLVE BATHROOM COUNT
  let totalWcCount: number;
  const rawWc = params.requestedBathrooms ?? params.roomsConfig?.bathroomCount;
  if (rawWc !== undefined && rawWc !== null && Number(rawWc) > 0) {
    totalWcCount = Math.max(1, Math.min(15, Math.round(Number(rawWc))));
  } else {
    totalWcCount = getExpertRecommendedBathrooms(floors, totalBedroomCount, groundFloorArea);
  }

  // 3. WORSHIP ROOM / LIVING / KITCHEN CONFIG
  const hasWorshipRoom = params.roomsConfig?.worshipRoom !== false && (floors > 1 || totalBedroomCount >= 3 || groundFloorArea >= 90);
  const hasLivingRoom = params.roomsConfig?.livingRoom !== false;
  const hasKitchen = params.roomsConfig?.kitchen !== false;

  // 4. DISTRIBUTE BEDROOMS ACROSS FLOORS
  // For 1 floor: All bedrooms on floor 1.
  // For multi-floor:
  // Floor 1 has 1 Master Bedroom (or 0 if area < 45m2 and multi-floor), remaining bedrooms distributed evenly on upper floors.
  const floorBedroomsMap: Record<number, number> = {};
  if (floors === 1) {
    floorBedroomsMap[1] = totalBedroomCount;
  } else {
    const floor1Beds = groundFloorArea >= 45 && totalBedroomCount >= 3 ? 1 : (totalBedroomCount <= 2 ? 0 : 1);
    floorBedroomsMap[1] = floor1Beds;
    const remainingBeds = Math.max(0, totalBedroomCount - floor1Beds);
    const upperFloors = floors - 1;
    const basePerUpper = Math.floor(remainingBeds / upperFloors);
    let extra = remainingBeds % upperFloors;
    
    for (let f = 2; f <= floors; f++) {
      floorBedroomsMap[f] = basePerUpper + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
    }
  }

  // 5. DISTRIBUTE WCs ACROSS FLOORS
  const floorWcMap: Record<number, number> = {};
  if (floors === 1) {
    floorWcMap[1] = totalWcCount;
  } else {
    const baseWcPerFloor = Math.max(1, Math.floor(totalWcCount / floors));
    let extraWc = totalWcCount - (baseWcPerFloor * floors);
    for (let f = 1; f <= floors; f++) {
      floorWcMap[f] = baseWcPerFloor + (extraWc > 0 ? 1 : 0);
      if (extraWc > 0) extraWc--;
    }
  }

  // 6. BUILD ALL BUILDING ROOMS & CURRENT FLOOR ROOMS
  const allBuildingRooms: RoomLayoutItem[] = [];
  let bedCounter = 1;

  for (let f = 1; f <= floors; f++) {
    const fArea = groundFloorArea; // each floor gross footprint
    const numBeds = floorBedroomsMap[f] || 0;
    const numWcs = floorWcMap[f] || 1;

    if (f === 1) {
      // Floor 1 Rooms
      const livingShare = numBeds > 0 ? 0.28 : 0.40;
      const kitchenShare = numBeds > 0 ? 0.22 : 0.30;
      const lArea = Math.round(fArea * livingShare * 10) / 10;
      const kArea = Math.round(fArea * kitchenShare * 10) / 10;
      
      if (hasLivingRoom) {
        allBuildingRooms.push({
          id: 'living_f1',
          name: 'Phòng Khách (Minh Đường)',
          icon: '🛋️',
          areaM2: lArea,
          floor: 1,
          description: 'Không gian mở đón sinh khí Bát Trạch, kết nối sảnh chính'
        });
      }
      if (hasKitchen) {
        allBuildingRooms.push({
          id: 'kitchen_f1',
          name: 'Bếp & Phòng Ăn',
          icon: '🍳',
          areaM2: kArea,
          floor: 1,
          description: 'Bố trí nguyên tắc Tọa Hung Hướng Cát, thoát mùi ra sân sau'
        });
      }

      // Bedrooms on floor 1
      for (let b = 0; b < numBeds; b++) {
        const isMaster = bedCounter === 1;
        const bArea = Math.round((fArea * (isMaster ? 0.20 : 0.14) / (numBeds > 1 ? (numBeds * 0.75) : 1)) * 10) / 10;
        allBuildingRooms.push({
          id: `bed_${bedCounter}_f1`,
          name: isMaster ? `Phòng Ngủ ${bedCounter} (Master)` : `Phòng Ngủ ${bedCounter}`,
          icon: '🛏️',
          areaM2: bArea,
          floor: 1,
          description: isMaster ? 'Không gian Master tĩnh tại, đón sáng gió tự nhiên' : 'Không gian nghỉ ngơi yên tĩnh, thoáng mát'
        });
        bedCounter++;
      }

      // WC on floor 1
      const wcAreaF1 = Math.round(fArea * 0.04 * numWcs * 10) / 10;
      allBuildingRooms.push({
        id: 'wc_f1',
        name: numWcs === 1 ? 'Phòng WC Tầng 1' : `${numWcs} Phòng WC Tầng 1`,
        icon: '🚿',
        areaM2: wcAreaF1,
        floor: 1,
        description: `Bố trí thiết bị hiện đại, chống trơn trượt (${numWcs} phòng)`
      });

    } else {
      // Upper Floors (f >= 2)
      // If top floor and has worship room:
      const isTopFloor = f === floors;
      if (isTopFloor && hasWorshipRoom) {
        const wArea = Math.round(fArea * 0.14 * 10) / 10;
        allBuildingRooms.push({
          id: `worship_f${f}`,
          name: 'Phòng Thờ Gia Tiên',
          icon: '🕯️',
          areaM2: wArea,
          floor: f,
          description: 'Không gian tôn nghiêm, đặt tại vị trí tọa cát hướng cát cung Sinh Khí'
        });
      }

      // Sinh hoạt chung / Sảnh tầng
      const commonArea = Math.round(fArea * 0.16 * 10) / 10;
      allBuildingRooms.push({
        id: `common_f${f}`,
        name: `Phòng Sinh Hoạt Chung Tầng ${f}`,
        icon: '☕',
        areaM2: commonArea,
        floor: f,
        description: 'Không gian gắn kết gia đình, đón gió ban công'
      });

      // Bedrooms on this floor
      for (let b = 0; b < numBeds; b++) {
        const isMaster = bedCounter === 1;
        const bedShare = (1 - (isTopFloor && hasWorshipRoom ? 0.30 : 0.20) - 0.08) / Math.max(1, numBeds);
        const bArea = Math.round(fArea * bedShare * 10) / 10;
        allBuildingRooms.push({
          id: `bed_${bedCounter}_f${f}`,
          name: isMaster ? `Phòng Ngủ ${bedCounter} (Master T${f})` : `Phòng Ngủ ${bedCounter} (Tầng ${f})`,
          icon: '🛏️',
          areaM2: bArea,
          floor: f,
          description: 'Không gian tĩnh dưỡng, đầy đủ ánh sáng tự nhiên và luồng khí tươi'
        });
        bedCounter++;
      }

      // WC on this floor
      const wcAreaF = Math.round(fArea * 0.045 * numWcs * 10) / 10;
      allBuildingRooms.push({
        id: `wc_f${f}`,
        name: numWcs === 1 ? `Phòng WC Tầng ${f}` : `${numWcs} Phòng WC Tầng ${f}`,
        icon: '🚿',
        areaM2: wcAreaF,
        floor: f,
        description: `Bố trí thiết bị Inax/Toto hiện đại, chống trơn trượt (${numWcs} phòng)`
      });
    }
  }

  // Filter rooms for current active floor
  const floorRooms = allBuildingRooms.filter(r => r.floor === currentFloor);

  // Areas for current floor
  const livingItem = floorRooms.find(r => r.id.startsWith('living'));
  const kitchenItem = floorRooms.find(r => r.id.startsWith('kitchen'));
  const bedItems = floorRooms.filter(r => r.id.startsWith('bed'));
  const wcItem = floorRooms.find(r => r.id.startsWith('wc'));
  const worshipItem = floorRooms.find(r => r.id.startsWith('worship'));

  const livingArea = livingItem ? livingItem.areaM2 : (currentFloor > 1 ? Math.round(groundFloorArea * 0.16 * 10) / 10 : 0);
  const kitchenArea = kitchenItem ? kitchenItem.areaM2 : 0;
  const bed1Area = bedItems[0] ? bedItems[0].areaM2 : (floorBedroomsMap[currentFloor] > 0 ? 15.5 : 0);
  const bed2Area = bedItems[1] ? bedItems[1].areaM2 : 0;
  const bed3Area = bedItems[2] ? bedItems[2].areaM2 : undefined;
  const wcArea = wcItem ? wcItem.areaM2 : Math.round(groundFloorArea * 0.04 * 10) / 10;
  const worshipArea = worshipItem ? worshipItem.areaM2 : undefined;

  const yardFrontArea = Math.round(widthM * frontSetbackM);
  const yardBackArea = Math.round(widthM * backSetbackM);

  const usableRoomsArea = Math.round(floorRooms.reduce((sum, r) => sum + r.areaM2, 0) * 10) / 10;
  const structureAndCorridorArea = Math.max(1, Math.round((groundFloorArea - usableRoomsArea) * 10) / 10);

  const roomNamesStr = floorRooms.map(r => `${r.name}: ${r.areaM2}m²`).join(', ');
  const balanceExplanation = `Mặt bằng Tầng ${currentFloor}/${floors} (Tổng ${totalBedroomCount} phòng ngủ toàn nhà): Diện tích thông thủy các phòng ${usableRoomsArea} m² (${roomNamesStr}) + Hệ tường bao (220mm), tường ngăn (110mm), kết cấu & hành lang giao thông: ${structureAndCorridorArea} m² = Tổng diện tích sàn tầng ${currentFloor}: ${groundFloorArea} m².`;

  // 7. SYNCHRONIZED METRICS FOR BOQ & PLANS ACROSS ENTIRE BUILDING
  const bedroomCount = totalBedroomCount;
  const wcCount = totalWcCount;
  const mainDoorCount = 1; // 1 main 4-panel / 2-panel door at entrance
  const roomDoorCount = totalBedroomCount + (hasWorshipRoom ? 1 : 0); // Each bedroom + worship room has 1 standard room door
  const wcDoorCount = totalWcCount; // Each WC has 1 door
  const backDoorCount = floors; // 1 back yard door on floor 1 + 1 balcony door per upper floor
  
  // Windows: Living room (1-2) + 1 per bedroom + 1 kitchen + 1 worship + stair skylight
  const windowCount = Math.max(3, 1 + totalBedroomCount + 1 + (hasWorshipRoom ? 1 : 0) + (floors > 1 ? floors - 1 : 0));
  
  const totalDoors = mainDoorCount + roomDoorCount + wcDoorCount + backDoorCount;
  const totalDoorAndWindowCount = totalDoors + windowCount;

  // Approximate door and window total area in m²:
  // Main door: ~5.0 m², Room doors: ~1.8 m² each, WC doors: ~1.4 m² each, Back doors: ~1.8 m² each, Windows: ~2.0 m² each
  const totalDoorAndWindowAreaM2 = Math.round((
    (mainDoorCount * 5.0) +
    (roomDoorCount * 1.8) +
    (wcDoorCount * 1.4) +
    (backDoorCount * 1.8) +
    (windowCount * 2.0)
  ) * 10) / 10;

  return {
    widthM,
    lengthM,
    lotAreaM2,
    frontSetbackM,
    backSetbackM,
    houseLengthM,
    groundFloorArea,
    totalConstructionArea,
    floors,
    currentFloor,
    totalBedroomCount,
    totalWcCount,
    hasWorshipRoom,
    hasLivingRoom,
    hasKitchen,
    floorRooms,
    allBuildingRooms,
    livingArea,
    kitchenArea,
    bed1Area,
    bed2Area,
    bed3Area,
    wcArea,
    worshipArea,
    yardFrontArea,
    yardBackArea,
    usableRoomsArea,
    structureAndCorridorArea,
    balanceExplanation,
    wcCount,
    bedroomCount,
    mainDoorCount,
    roomDoorCount,
    wcDoorCount,
    backDoorCount,
    windowCount,
    totalDoors,
    totalDoorAndWindowCount,
    totalDoorAndWindowAreaM2
  };
}
