import { addDays, todayStr, toDateTime, uid } from './utils';

/**
 * Dữ liệu mẫu được tạo tương đối theo "hôm nay" để người dùng mở app là trải nghiệm được ngay.
 * Các mục đã qua giờ được đặt sẵn trạng thái hợp lý (đã xong / bỏ lỡ).
 */
export function createSeed() {
  const t = todayStr();
  const now = new Date();
  const past = (date, time) => toDateTime(date, time) < now;
  const autoStatus = (date, time, fallbackPast = 'done') =>
    past(date, time) ? fallbackPast : 'todo';

  const med = (name, dosage, timing, date, time, note = '', status) => ({
    id: uid(),
    type: 'medicine',
    name,
    dosage,
    timing,
    date,
    time,
    note,
    status: status || autoStatus(date, time),
    createdAt: new Date().toISOString(),
  });

  const task = (title, category, date, time, note = '', status) => ({
    id: uid(),
    type: 'task',
    title,
    category,
    date,
    time,
    note,
    status: status || autoStatus(date, time),
    createdAt: new Date().toISOString(),
  });

  const t1 = addDays(t, 1);
  const t2 = addDays(t, 2);
  const t4 = addDays(t, 4);
  const y = addDays(t, -1);

  const items = [
    // Hôm qua
    med('Amlodipine 5mg', '1 viên', 'Sau ăn', y, '07:30', 'Thuốc huyết áp', 'done'),
    task('Đi bộ nhẹ trong công viên', 'exercise', y, '16:30', '20 phút', 'missed'),
    med('Metformin 500mg', '1 viên', 'Sau ăn', y, '19:00', 'Thuốc tiểu đường', 'done'),

    // Hôm nay
    task('Đo huyết áp buổi sáng', 'other', t, '06:30', 'Ghi lại chỉ số vào sổ'),
    med('Amlodipine 5mg', '1 viên', 'Sau ăn', t, '07:30', 'Thuốc huyết áp'),
    task('Tập dưỡng sinh', 'exercise', t, '09:00', '15 phút, động tác nhẹ nhàng'),
    med('Metformin 500mg', '1 viên', 'Sau ăn', t, '12:00', 'Thuốc tiểu đường'),
    task('Nghỉ trưa', 'rest', t, '13:00', 'Ngủ trưa 45 – 60 phút'),
    task('Đi bộ nhẹ quanh nhà', 'exercise', t, '16:30', '20 phút, có người đi cùng'),
    med('Metformin 500mg', '1 viên', 'Sau ăn', t, '19:00', 'Thuốc tiểu đường'),
    med('Canxi + Vitamin D3', '1 viên', 'Trước khi ngủ', t, '21:00', ''),
    task('Uống một cốc sữa ấm', 'meal', t, '', 'Không cố định giờ'),

    // Sắp tới
    med('Amlodipine 5mg', '1 viên', 'Sau ăn', t1, '07:30', 'Thuốc huyết áp'),
    task('Tập dưỡng sinh', 'exercise', t1, '09:00', ''),
    task('Tái khám tim mạch – BV Đa khoa', 'checkup', t2, '08:30', 'Mang theo sổ khám và kết quả xét nghiệm cũ'),
    task('Xét nghiệm đường huyết', 'checkup', t4, '07:00', 'Nhịn ăn sáng trước khi đi'),
  ];

  const ago = (mins) => new Date(Date.now() - mins * 60000).toISOString();

  const notifications = [
    { id: uid(), kind: 'system', message: 'Chào mừng bạn đến với Techmate Care! Dữ liệu mẫu đã sẵn sàng.', createdAt: ago(2), read: false },
    { id: uid(), kind: 'checkup', message: 'Nhắc nhở: Lịch tái khám tim mạch vào 08:30 sau 2 ngày nữa.', createdAt: ago(30), read: false },
    { id: uid(), kind: 'done', message: 'Đã hoàn thành: Uống thuốc Metformin 500mg (hôm qua 19:00).', createdAt: ago(60 * 17), read: true },
    { id: uid(), kind: 'missed', message: 'Bỏ lỡ: Đi bộ nhẹ trong công viên (hôm qua 16:30).', createdAt: ago(60 * 19), read: true },
    { id: uid(), kind: 'medicine', message: 'Đã đến giờ uống thuốc: Amlodipine 5mg – 1 viên.', createdAt: ago(60 * 28), read: true },
  ];

  const D = (day, meal, name, desc) => ({ id: uid(), day, meal, name, desc });
  const menu = [
    D('Thứ 2', 'breakfast', 'Cháo yến mạch thịt bằm', 'Yến mạch nấu mềm với thịt nạc, ít muối.'),
    D('Thứ 2', 'lunch', 'Cơm gạo lứt, cá hấp gừng', 'Cá diêu hồng hấp, rau cải luộc, canh bí.'),
    D('Thứ 2', 'snack', 'Sữa chua không đường', '1 hộp, ăn kèm vài lát chuối.'),
    D('Thứ 2', 'dinner', 'Canh rau ngót thịt nạc', 'Ăn kèm đậu phụ sốt cà chua, nửa bát cơm.'),
    D('Thứ 3', 'breakfast', 'Phở gà ít bánh', 'Nước dùng thanh, nhiều rau thơm.'),
    D('Thứ 3', 'lunch', 'Cơm, ức gà luộc', 'Bông cải xanh luộc, canh mồng tơi.'),
    D('Thứ 3', 'snack', 'Táo / lê', '1 quả vừa, cắt miếng nhỏ.'),
    D('Thứ 3', 'dinner', 'Súp bí đỏ', 'Bí đỏ nấu với tôm băm, dễ tiêu hoá.'),
    D('Thứ 4', 'breakfast', 'Bánh mì nguyên cám + trứng luộc', '1 lát bánh mì, 1 quả trứng, 1 ly sữa hạt.'),
    D('Thứ 4', 'lunch', 'Bún cá rô đồng', 'Ít bún, nhiều rau, nước dùng nhạt.'),
    D('Thứ 4', 'dinner', 'Cơm, đậu hũ non hấp', 'Kèm rau muống luộc và canh cải.'),
    D('Thứ 5', 'breakfast', 'Cháo đậu xanh', 'Nấu nhừ, không thêm đường.'),
    D('Thứ 5', 'lunch', 'Cơm, cá thu sốt cà', 'Rau dền luộc, canh chua nhẹ.'),
    D('Thứ 5', 'dinner', 'Miến gà', 'Miến dong, thịt gà xé, nấm hương.'),
    D('Thứ 6', 'breakfast', 'Khoai lang luộc + sữa đậu nành', 'Sữa đậu nành không đường.'),
    D('Thứ 6', 'lunch', 'Cơm, thịt heo nạc rim', 'Rim nhạt, kèm su su xào.'),
    D('Thứ 6', 'dinner', 'Canh cua rau đay', 'Ăn kèm cà pháo ít muối.'),
    D('Thứ 7', 'breakfast', 'Bún bò nhạt', 'Không dùng nhiều sa tế, chọn thịt nạc.'),
    D('Thứ 7', 'lunch', 'Cơm, tôm rang thịt', 'Rau cải ngọt luộc.'),
    D('Thứ 7', 'dinner', 'Cháo cá hồi', 'Cá hồi nấu với cháo trắng, hành lá.'),
    D('Chủ nhật', 'breakfast', 'Xôi đậu đen ít', 'Một phần nhỏ, kèm trà gừng ấm.'),
    D('Chủ nhật', 'lunch', 'Lẩu nấm chay nhẹ', 'Nhiều loại nấm, đậu phụ, rau xanh.'),
    D('Chủ nhật', 'dinner', 'Cơm, gà hấp lá chanh', 'Canh bầu nấu tôm.'),
  ];

  return {
    version: 1,
    profile: {
      name: 'Nguyễn Thị Hoa',
      dob: '1948-03-12',
      gender: 'Nữ',
      avatar: '',
      caregiverName: 'Trần Minh Anh',
      caregiverPhone: '0912 345 678',
      contact: 'Số 12 Ngõ 45, Phường Láng Thượng, Hà Nội',
      careNotes: 'Huyết áp cao, tiểu đường type 2. Đi lại chậm, cần người hỗ trợ khi lên xuống cầu thang. Dị ứng hải sản có vỏ.',
    },
    items,
    notifications,
    diet: {
      conditions: ['Tăng huyết áp', 'Tiểu đường type 2'],
      preferences: ['Đồ mềm, dễ nhai', 'Thích canh rau', 'Món hấp, luộc'],
      avoid: ['Hải sản có vỏ (dị ứng)', 'Đồ quá mặn', 'Đồ ngọt, nước có ga'],
      notes: 'Chia nhỏ bữa ăn, ăn chậm. Uống đủ 1.5 lít nước/ngày. Hạn chế muối dưới 5g/ngày.',
    },
    menu,
    // Khoá chống tạo trùng thông báo tự động
    notifiedKeys: {},
  };
}
