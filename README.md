# Techmate Care – Ứng dụng chăm sóc người cao tuổi (MVP)

Ứng dụng web React + Vite giúp người chăm sóc quản lý lịch trình, thuốc, tác vụ hằng ngày, thông báo, dinh dưỡng và hồ sơ của người cao tuổi. Dữ liệu demo được lưu bằng `localStorage`, nên vẫn còn sau khi tải lại trang.

## Chạy dự án

Yêu cầu: **Node.js 18+** (tải tại https://nodejs.org).

1. Giải nén file ZIP.
2. Mở VS Code → **File → Open Folder…** → chọn thư mục `techmate-care`.
3. Mở Terminal trong VS Code (**Terminal → New Terminal** hoặc `` Ctrl + ` ``) và chạy:

```bash
npm install
npm run dev
```

4. Trình duyệt sẽ tự mở `http://localhost:5173` (nếu không, mở địa chỉ hiện ra trong Terminal).

Các lệnh khác:

```bash
npm run build     # build bản production vào thư mục dist/
npm run preview   # chạy thử bản build
```

> Xem trên điện thoại: chạy `npm run dev -- --host`, rồi mở địa chỉ "Network" (cùng mạng Wi-Fi), hoặc dùng chế độ giả lập thiết bị trong DevTools (F12).

## 5 mục chính

| Mục | Chức năng |
| --- | --- |
| **Tổng quan** | Ảnh đại diện, họ tên, tuổi, đồng hồ ngày giờ thời gian thực, nhiệm vụ tiếp theo (có đếm ngược, nút Bắt đầu / Hoàn thành) và các lịch trình sắp tới. |
| **Lịch trình & Quản lý** | **A.** Danh sách lịch trình theo thời gian, lọc theo ngày và trạng thái, đổi trạng thái trực tiếp. **B.** Thêm / sửa / xoá thuốc và tác vụ hằng ngày, lọc việc cần làm, có tuỳ chọn lặp lại 3/7/14 ngày. **C.** Báo cáo nhanh tự cập nhật (tỉ lệ hoàn thành, số lượng theo trạng thái, tuân thủ uống thuốc, mục bỏ lỡ). |
| **Thông báo** | Tự tạo thông báo khi đến giờ, khi hoàn thành, khi bỏ lỡ, nhắc lịch tái khám; đánh dấu đã đọc / chưa đọc, lọc, xoá, lưu lịch sử. |
| **Dinh dưỡng** | Nhập bệnh nền, khẩu vị, thực phẩm cần tránh, ghi chú; thực đơn mẫu theo ngày (Thứ 2 → Chủ nhật) và theo bữa (sáng, trưa, phụ, tối) có thêm / sửa / xoá. |
| **Hồ sơ** | Sửa ảnh đại diện (tải ảnh lên), họ tên, ngày sinh, giới tính, người chăm sóc & SĐT, thông tin liên hệ, ghi chú chăm sóc. Có nút khôi phục dữ liệu mẫu. |

## Logic đồng bộ

- Thuốc và tác vụ được lưu chung trong **một danh sách `items`**, mỗi mục có **một trường `status` duy nhất**: `todo`, `doing`, `done`, `missed`.
  - Ở danh sách lịch trình hiển thị: Chưa thực hiện / Đang thực hiện / Đã hoàn thành / Bỏ lỡ.
  - Ở khu vực quản lý hiển thị: Cần làm / Đang làm / Đã xong (/ Bỏ lỡ).
  - Vì dùng chung một dữ liệu nên đổi ở đâu thì nơi khác, báo cáo và trang Tổng quan đều cập nhật ngay.
- Mục có **ngày + giờ** sẽ tự xuất hiện trong danh sách lịch trình; mục không đặt giờ chỉ nằm trong khu vực quản lý.
- **Bộ hẹn giờ** chạy mỗi 20 giây khi ứng dụng đang mở:
  - Đến giờ (trong vòng 60 phút) mà chưa xong → thông báo "Đã đến giờ uống thuốc / tập thể dục / …" kèm toast.
  - Quá giờ 2 tiếng mà vẫn "Chưa thực hiện" → tự chuyển "Bỏ lỡ" và báo.
  - Lịch "Tái khám" vào hôm nay hoặc ngày mai → thông báo nhắc nhở.
  - Mỗi thông báo tự động chỉ tạo một lần (đổi giờ thì sẽ được báo lại theo giờ mới).
- Hồ sơ người cao tuổi dùng chung cho sidebar, trang Tổng quan và trang Hồ sơ.

## Cấu trúc thư mục

```
techmate-care/
├── index.html
├── package.json
├── vite.config.js
├── public/favicon.svg
└── src/
    ├── main.jsx              # Điểm khởi động, Router, font Be Vietnam Pro
    ├── App.jsx               # Khai báo các route
    ├── assets/avatar-default.svg
    ├── store/
    │   ├── AppContext.jsx    # Dữ liệu dùng chung, localStorage, bộ hẹn giờ thông báo
    │   ├── seed.js           # Dữ liệu mẫu ban đầu
    │   └── utils.js          # Ngày giờ, trạng thái, hằng số
    ├── components/
    │   ├── Layout.jsx        # Sidebar (máy tính), thanh điều hướng dưới (điện thoại)
    │   └── ui.jsx            # Modal, badge, bộ lọc, tag input, toast…
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── Schedule.jsx
    │   ├── Notifications.jsx
    │   ├── Nutrition.jsx
    │   └── Profile.jsx
    └── styles/global.css     # Toàn bộ giao diện & responsive
```

## Công nghệ

React 18 · Vite 5 · React Router 6 · Lucide React · CSS thuần · Font Be Vietnam Pro (đóng gói sẵn qua `@fontsource`, không cần internet khi chạy).

## Lưu ý

- Dữ liệu chỉ lưu trên trình duyệt của máy đang dùng. Xoá dữ liệu trình duyệt sẽ mất dữ liệu; dùng **Hồ sơ → Khôi phục dữ liệu mẫu** để bắt đầu lại.
- Thông báo chỉ được tạo khi ứng dụng đang mở.
- Thực đơn chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng của chuyên gia y tế.
