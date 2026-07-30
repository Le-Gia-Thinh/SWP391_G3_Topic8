/**
 * FILE: aiAllocationService.js
 * MÔ TẢ: Dịch vụ AI phân bổ ô đỗ xe thông minh (Heuristic Recommendation Engine).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Đánh giá và chấm điểm tất cả các ô đỗ trống (`available`) dựa trên mô hình Heuristic 3 thành phần:
 *    - Điểm Tầng (`wFloor = 50%`): Ưu tiên tầng thấp để giảm thời gian di chuyển của tài xế.
 *    - Điểm Gom cụm Khu vực (`wZoneUtil = 30%`): Ưu tiên lấp đầy khu vực đã có xe trước (Clustering) giúp tối ưu vận hành bãi đỗ.
 *    - Điểm Khoảng cách gần cửa (`wProximity = 20%`): Ưu tiên ô đỗ gần thang máy/cổng ra vào.
 * 2. Chuẩn hóa dữ liệu Min-Max (Min-Max Normalization) để đưa tất cả chỉ số về thang điểm `[0, 1]` trước khi nhân trọng số.
 * 3. Sinh chuỗi giải thích tự nhiên (`AIReason`) trình bày lý do tại sao AI lại chọn ô đỗ đó cho người dùng.
 * 
 * @module aiAllocationService
 */

/**
 * HÀM NỔI BẬT: recommendOptimalSlot
 * TÁC DỤNG: Nhận vào danh sách ô đỗ xe và tính toán tìm ra 1 ô đỗ xe tối ưu nhất cho tài xế.
 * 
 * @param {Array<Object>} slots - Danh sách đối tượng ô đỗ xe lấy từ Database SQL
 * @returns {Object|null} Ô đỗ xe được đánh giá điểm AI cao nhất kèm thuộc tính `AIReason` và `AIScore`
 */
export function recommendOptimalSlot(slots) {
  // Lọc chỉ lấy các ô đỗ đang có trạng thái sẵn sàng cho đỗ (`available`) bằng hàm `Array.prototype.filter`
  const availableSlots = slots.filter((s) => s.DisplayStatus === 'available');
  // Nếu không còn ô đỗ nào trống ➔ Trả về null ngay lập tức (Early Return)
  if (availableSlots.length === 0) return null;

  // 1. Thống kê tỷ lệ lấp đầy xe của từng Khu vực (Zone Utilization Stats)
  const zoneStats = {};
  slots.forEach((s) => {
    // Khởi tạo đối tượng theo dõi cho ZoneID nếu chưa tồn tại
    if (!zoneStats[s.ZoneID]) {
      zoneStats[s.ZoneID] = { total: 0, occupied: 0 };
    }
    zoneStats[s.ZoneID].total++; // Đếm tổng số ô đỗ trong khu vực
    if (s.DisplayStatus === 'occupied') {
      zoneStats[s.ZoneID].occupied++; // Đếm số ô đã có xe đỗ
    }
  });

  // Cấu hình Trọng số (Weights) của các yếu tố thuật toán Heuristic:
  const wFloor = 50;       // Trọng số Tầng (50%): Giúp xe đỗ ở các tầng thấp gần mặt đất nhất
  const wZoneUtil = 30;    // Trọng số Tỷ lệ lấp đầy Zone (30%): Kỹ thuật Gom cụm (Clustering) tối ưu không gian bãi
  const wProximity = 20;   // Trọng số Khoảng cách (20%): Ưu tiên ô đỗ gần thang máy / lối ra vào

  // THUẬT NGỮ TOÁN HỌC: Min-Max Normalization (Chuẩn hóa phạm vi)
  // Tìm giá trị Tầng nhỏ nhất (minFloor) và lớn nhất (maxFloor)
  const minFloor = Math.min(...availableSlots.map((s) => s.FloorID));
  const maxFloor = Math.max(...availableSlots.map((s) => s.FloorID));

  // Tìm ID ô đỗ nhỏ nhất (minSlotId) và lớn nhất (maxSlotId) để ước tính vị trí gần cửa
  const minSlotId = Math.min(...availableSlots.map((s) => s.SlotID));
  const maxSlotId = Math.max(...availableSlots.map((s) => s.SlotID));

  let bestSlot = null;
  let highestScore = -Infinity; // Khởi tạo điểm cao nhất ban đầu là Âm vô cực

  // Duyệt qua từng ô đỗ trống để tính tổng điểm AI (AI Multi-Factor Scoring Loop)
  for (const slot of availableSlots) {
    // A. ĐIỂM TẦNG (Floor Score): Tầng càng thấp (nhỏ) ➔ Điểm càng tiệm cận 1.0
    let floorScore = 1;
    if (maxFloor > minFloor) {
      // Công thức đảo ngược Normalization: 1 - (FloorID - min) / (max - min)
      floorScore = 1 - (slot.FloorID - minFloor) / (maxFloor - minFloor);
    }
    slot._floorScore = floorScore;

    // B. ĐIỂM GOM CỤM KHU VỰC (Zone Utilization Score): Khu vực càng đông xe ➔ Điểm càng cao để tập trung xe vào 1 khu
    const stats = zoneStats[slot.ZoneID];
    const utilizationRate = stats.total > 0 ? stats.occupied / stats.total : 0;
    const zoneScore = utilizationRate;
    slot._zoneScore = zoneScore;

    // C. ĐIỂM GẦN CỬA VÀ THANG MÁY (Proximity & Elevator Score):
    let proxScore = 1;
    if (slot.DistanceToGate !== undefined && slot.DistanceToGate !== null) {
      proxScore = Math.max(0, 1 - (slot.DistanceToGate / 100.0));
    } else if (maxSlotId > minSlotId) {
      proxScore = 1 - (slot.SlotID - minSlotId) / (maxSlotId - minSlotId);
    }
    if (slot.NearElevator) proxScore += 0.2;
    slot._proxScore = Math.min(1, proxScore);

    // TÍNH TỔNG ĐIỂM (Weighted Sum Calculation):
    const priorityMultiplier = (slot.PriorityScore ?? 100) / 100.0;
    const totalScore = ((wFloor * floorScore) + (wZoneUtil * zoneScore) + (wProximity * slot._proxScore)) * priorityMultiplier;

    // Lưu điểm AI vào đối tượng ô đỗ xe
    slot.AIScore = totalScore;

    // Cập nhật ô đỗ có điểm cao nhất
    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestSlot = slot;
    }
  }

  // TẠO CHUỖI GIẢI THÍCH TỰ NHIÊN (Natural Language AI Explanation Generator):
  if (bestSlot) {
    let reasons = [];
    if (bestSlot._floorScore > 0.7) reasons.push("nằm ở tầng thấp tiện di chuyển");
    if (bestSlot._zoneScore > 0.5) reasons.push("giúp gom cụm tối ưu luồng xe");
    if (bestSlot._proxScore > 0.7) reasons.push("vị trí gần cửa ra vào/thang máy");

    if (reasons.length > 0) {
      bestSlot.AIReason = "Vị trí được AI đề xuất vì " + reasons.join(" và ") + ".";
    } else {
      bestSlot.AIReason = "Vị trí có tổng điểm đánh giá tối ưu nhất hiện tại.";
    }
  }

  // Trả về đối tượng ô đỗ xe tốt nhất tìm được
  return bestSlot;
}

