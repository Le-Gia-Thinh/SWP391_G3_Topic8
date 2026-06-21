/**
 * aiAllocationService.js
 * 
 * Dịch vụ AI (Heuristic Recommendation Engine) để tối ưu hóa việc phân bổ chỗ đỗ xe.
 * Mục tiêu: Giảm thời gian tìm kiếm của tài xế và Tăng tỷ lệ sử dụng của bãi đỗ xe.
 */

export function recommendOptimalSlot(slots) {
  const availableSlots = slots.filter((s) => s.DisplayStatus === 'available');
  if (availableSlots.length === 0) return null;

  // 1. Tính toán tỷ lệ lấp đầy của từng Khu vực (Zone)
  const zoneStats = {};
  slots.forEach((s) => {
    if (!zoneStats[s.ZoneID]) {
      zoneStats[s.ZoneID] = { total: 0, occupied: 0 };
    }
    zoneStats[s.ZoneID].total++;
    if (s.DisplayStatus === 'occupied') {
      zoneStats[s.ZoneID].occupied++;
    }
  });

  // Trọng số (Weights) của các yếu tố AI
  const wFloor = 50;       // Ưu tiên tầng thấp (Giảm thời gian tìm kiếm)
  const wZoneUtil = 30;    // Ưu tiên Khu vực đã có xe (Tối ưu hóa Gom cụm - Clustering để tăng tỷ lệ sử dụng)
  const wProximity = 20;   // Ưu tiên Vị trí gần cửa (Dựa trên SlotID nhỏ)

  // Tìm Min/Max để Normalize điểm số (đưa về thang 0-1)
  const minFloor = Math.min(...availableSlots.map((s) => s.FloorID));
  const maxFloor = Math.max(...availableSlots.map((s) => s.FloorID));

  const minSlotId = Math.min(...availableSlots.map((s) => s.SlotID));
  const maxSlotId = Math.max(...availableSlots.map((s) => s.SlotID));

  let bestSlot = null;
  let highestScore = -Infinity;

  for (const slot of availableSlots) {
    // 1. Điểm Tầng (Floor Score) - Tầng càng thấp điểm càng cao
    let floorScore = 1;
    if (maxFloor > minFloor) {
      floorScore = 1 - (slot.FloorID - minFloor) / (maxFloor - minFloor);
    }
    slot._floorScore = floorScore;

    // 2. Điểm Sử dụng Khu vực (Zone Utilization Score) - Càng đông xe càng ưu tiên xếp vào để lấp đầy
    const stats = zoneStats[slot.ZoneID];
    const utilizationRate = stats.total > 0 ? stats.occupied / stats.total : 0;
    const zoneScore = utilizationRate;
    slot._zoneScore = zoneScore;

    // 3. Điểm Gần cửa (Proximity Score) - SlotID càng nhỏ (tạo trước) mặc định càng gần cửa
    let proxScore = 1;
    if (maxSlotId > minSlotId) {
      proxScore = 1 - (slot.SlotID - minSlotId) / (maxSlotId - minSlotId);
    }
    slot._proxScore = proxScore;

    // Tổng điểm
    const totalScore = (wFloor * floorScore) + (wZoneUtil * zoneScore) + (wProximity * proxScore);

    // Gán thêm điểm vào object để trace
    slot.AIScore = totalScore;

    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestSlot = slot;
    }
  }

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

  return bestSlot;
}
