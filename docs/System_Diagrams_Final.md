# TÀI LIỆU THIẾT KẾ HỆ THỐNG - PARKING MANAGEMENT (SWP391)

Tài liệu này tổng hợp toàn bộ các sơ đồ hệ thống cốt lõi nhất (Screen Flow và State Chart) đã được chuẩn hóa theo đúng cấu trúc mã nguồn và chuẩn UML.

---

## PHẦN 1: SCREEN FLOW (LUỒNG MÀN HÌNH)

### 1. Luồng Driver Booking (Tài xế Đặt chỗ)
*Mô tả: Sử dụng cơ chế Single Page Application để chọn thông tin, cập nhật sơ đồ Slot theo thời gian thực và tích hợp AI gợi ý.*

```mermaid
graph TD
    classDef screen fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1,font-weight:bold;
    classDef popup fill:#FFF9C4,stroke:#F57F17,stroke-width:2px,color:#E65100,font-weight:bold,stroke-dasharray: 5 5;
    classDef component fill:#F5F5F5,stroke:#9E9E9E,stroke-width:1px,color:#424242,font-style:italic;

    Home[Màn hình: Driver Home]:::screen
    Form[Màn hình Single Page: Driver Booking]:::screen
    
    Fetch[Logic ngầm: API Fetch Slot Real-time]:::component
    MapDisplay[Giao diện Sơ đồ đỗ xe<br/>nằm ngay dưới Form]:::component
    
    Confirm[Màn hình: Booking Confirmation]:::screen

    Home -->|Bấm 'Đặt chỗ'| Form
    
    Form -->|Dropdown Chọn Xe đã lưu<br/>HOẶC Nhập biển số tay| Form
    Form -->|Thay đổi Ngày/Giờ/Thời lượng/Xe| API[Logic ngầm: API Fetch Slot Real-time]:::component
    API -->|Có slot trống| Map[Giao diện Sơ đồ đỗ xe<br/>nằm ngay dưới Form]:::screen
    API -->|Lỗi / Không có slot| Full[Popup: Lỗi Thời gian / Bãi Full]:::popup
    
    Full -.->|Đóng, Sửa lại form| Form
    
    %% Tương tác Bản đồ
    Filter[Bộ lọc: Chọn Tầng & Khu vực]:::component -.-> Map
    
    Auto{Bật tính năng<br/>'Auto-select' ?}:::component
    Map --> Auto
    Auto -->|Bật| AI[Hệ thống tự động bắt Slot tốt nhất]:::component
    Auto -->|Tắt| Manual[Khách tự bấm vào ô Slot trống trên bản đồ]:::component
    
    AI --> Submit[Bấm 'Tiến hành Đặt chỗ']
    Manual --> Submit
    
    %% Đặt chỗ
    Submit --> Validate[Validate cuối cùng & Gọi API]:::component
    
    %% Nhánh thành công
    Validate -->|Thành công| Confirm[Màn hình: Booking Confirmation]:::screen
    
    %% Nhánh thất bại
    Validate -.->|Thất bại (Slot bị người khác đặt trước)| RefreshAPI[Cập nhật lại Sơ đồ Real-time]:::component
    RefreshAPI -.-> API
    
    Confirm -->|Bấm 'Về Trang chủ'| Home
```

### 2. Luồng Staff Check-in (Xử lý Vãng lai & Đặt trước)
*Mô tả: Tích hợp 2 luồng Walk-in và Booking trên cùng một Dashboard. Cho phép xử lý linh hoạt các ca khách hàng đến quá sớm hoặc quá trễ.*

```mermaid
graph TD
    classDef screen fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1,font-weight:bold;
    classDef popup fill:#FFF9C4,stroke:#F57F17,stroke-width:2px,color:#E65100,font-weight:bold,stroke-dasharray: 5 5;
    classDef component fill:#F5F5F5,stroke:#9E9E9E,stroke-width:1px,color:#424242,font-style:italic;

    D[Staff Dashboard]:::screen --> C[Menu Check-in]:::screen

    %% ==========================
    %% NHÁNH WALK-IN
    %% ==========================
    WI_Input[Màn hình: Nhập Thông tin xe]:::screen
    WI_Err[Popup: Lỗi Xe đang trong bãi]:::popup
    WI_Map[Màn hình: Dẫn đường & Sơ đồ]:::screen
    Success[Màn hình: Check-in Thành Công]:::screen

    C -->|Chọn tab 'Khách Vãng Lai'| WI_Input
    WI_Input -->|Hệ thống check biển số| WI_Err
    WI_Err -.->|Đóng| WI_Input
    WI_Input -->|Hợp lệ| WI_Map
    WI_Map -->|Tự Chọn Slot / AI 1-Click| Success

    %% ==========================
    %% NHÁNH BOOKING
    %% ==========================
    BK_List[Màn hình: Bảng Danh sách Booking Queue]:::screen
    BK_List_Tabs[Giao diện: 4 Tab trạng thái<br/>Reserved, Completed, Cancelled, Expired]:::component
    BK_Detail[Màn hình: Chi tiết Đặt chỗ & Validation]:::screen
    
    UI_Expired[Banner Đỏ: Trễ > 60p<br/>Khóa Check-in]:::component
    UI_Countdown[Banner Cam: Sớm > 60p<br/>Khóa Check-in]:::component
    UI_Valid[Banner Xanh/Cam: Hợp lệ<br/>Hiện ô Nhập Biển số]:::component
    
    Override[Popup: Chuyển sang Vãng lai]:::popup

    C -->|Chọn tab 'Khách Đặt Trước'| BK_List
    BK_List --> BK_List_Tabs
    BK_List_Tabs -->|Lọc theo Ngày/SĐT/Mã vé<br/>Bấm 'Nhận xe' trên lưới| BK_Detail
    
    %% Phân nhánh thời gian
    BK_Detail -->|Đến Trễ > 60p| UI_Expired
    BK_Detail -->|Đến Sớm > 60p| UI_Countdown
    BK_Detail -->|Đến Đúng giờ / Trễ nhẹ / Sớm có phí| UI_Valid
    
    %% Tương tác UI
    UI_Countdown -->|Bấm 'Chuyển sang vãng lai'| Override
    Override -->|Mở Sơ đồ Slot Vãng lai| Success
    Override -.->|Hủy bỏ| BK_Detail
    
    UI_Valid -->|Staff tick 'Xác thực biển số' & Bấm Check-in| Success
    Success -->|Về Trang chủ| D
```

### 3. Luồng Staff Check-out & Thanh toán
*Mô tả: Tích hợp logic phân tích tính phí tự động (Fee Breakdown), kiểm tra miễn phí đến sớm và Polling mã QR tự động.*

```mermaid
graph TD
    classDef screen fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1,font-weight:bold;
    classDef popup fill:#FFF9C4,stroke:#F57F17,stroke-width:2px,color:#E65100,font-weight:bold,stroke-dasharray: 5 5;
    classDef component fill:#F5F5F5,stroke:#9E9E9E,stroke-width:1px,color:#424242,font-style:italic;

    D[Màn hình: Staff Dashboard]:::screen
    List[Màn hình: Active Sessions]:::screen
    FeeModal[Popup: Fee Breakdown]:::popup
    Pay[Màn hình: Staff Payment Confirm]:::screen
    Success[Màn hình: Trả xe Thành công]:::screen

    D -->|Bấm 'Trả xe'| List
    List -->|Tìm kiếm & Lọc xe| List
    List -->|Bấm Icon Xem phí| FeeModal
    FeeModal -->|Tính phí Theo Block giờ / Qua đêm| FeeModal
    FeeModal -.->|Tắt| List
    List -->|Bấm 'Thanh toán & Trả xe'| Pay
    
    %% Màn hình Thanh toán
    EarlyCheck{Logic: Trả xe<br/>sớm hơn giờ Book?}:::component
    Pay --> EarlyCheck
    EarlyCheck -->|Có| AlertEarly[Cảnh báo: Miễn phụ phí đến sớm]:::component
    EarlyCheck -->|Không| ValidatePlate
    AlertEarly --> ValidatePlate
    
    ValidatePlate[Bắt buộc tick:<br/>'Xác nhận Biển số khớp']:::component
    
    %% Nút Recheck
    Recheck[Nút: Làm mới Trạng thái<br/>(Gọi API kiểm tra lại)]:::component
    Pay -.->|Phòng hờ lỗi mạng| Recheck
    Recheck -.-> LogicPay
    
    ValidatePlate --> LogicPay{Trạng thái Tiền?}:::component
    
    LogicPay -->|Đã trả đủ / Prepaid| SurchargeCheck{Có lố giờ không?}:::component
    SurchargeCheck -->|Không| PaidAction[Bấm 'Xác nhận Kết thúc']
    SurchargeCheck -->|Có| SurchargeAlert[Cảnh báo: Thu thêm Phụ phí bằng Tiền mặt]:::component
    SurchargeAlert --> PaidAction
    PaidAction --> Success
    
    LogicPay -->|Chưa thanh toán (Có phí)| PaySelect[Chọn Tiền mặt / QR PayOS]:::component
    PaySelect -->|Tiền mặt| Cash[Bấm 'Đã thu tiền mặt']
    Cash --> Success
    
    PaySelect -->|QR Code| QRModal[Popup: QR Tự động Polling]:::popup
    QRModal -->|Khách quét & Chuyển khoản xong| Success
    QRModal -.->|Giao dịch Hủy/Lỗi/Hết hạn| PaySelect
    
    Success -->|Về Trang chủ| D
```

---

## PHẦN 2: STATE CHART (BIỂU ĐỒ TRẠNG THÁI)

### 1. Vòng đời Đặt chỗ (Reservation Lifecycle)
*Mô tả: Một vé đặt chỗ có điểm bắt đầu và kết thúc rõ ràng khi hoàn thành nhiệm vụ hoặc bị quá hạn.*

```mermaid
stateDiagram-v2
    [*] --> Reserved : Tài xế tạo Đặt chỗ thành công
    
    Reserved --> Completed : Staff Check-in thành công\n(Khách đến đúng giờ)
    Reserved --> Cancelled : Tài xế tự hủy vé\nHOẶC Staff hủy để chuyển sang Vãng lai
    Reserved --> Expired : Hệ thống quét (CronJob)\nKhách trễ > 60 phút (No-show)
    
    Completed --> [*]
    Cancelled --> [*]
    Expired --> [*]
```

### 2. Vòng đời Phiên đỗ xe (Parking Session Lifecycle)
*Mô tả: Thể hiện chính xác 4 trạng thái lưu trữ trong Database (Bảng ParkingSessions - cột SessionStatus). Trạng thái thanh toán được tách biệt quản lý ở bảng Payments.*

```mermaid
stateDiagram-v2
    direction TB
    
    [*] --> Active : Khách Check-in (Tạo Phiên)
    
    Active --> Overdue : Đỗ quá giới hạn thời gian\n(Hệ thống tự động quét)
    Active --> Lost : Báo mất vé / Mất xe
    
    Active --> Completed : Staff Check-out thành công
    Overdue --> Completed : Staff Check-out (Xử lý phạt/phụ phí)
    Lost --> Completed : Tìm thấy & Xử lý xong
    
    Completed --> [*]
```

### 3. Vòng đời Vị trí đỗ (Slot Status Lifecycle)
*Mô tả: Slot là đối tượng vật lý/cố định, bao gồm đủ 5 trạng thái theo chuẩn CSDL: Available, Occupied, Reserved, Maintenance, Blocked. Đây là một Cỗ máy trạng thái vòng lặp (Cyclic State Machine) không có điểm kết thúc (No End State).*

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Available
    
    %% Nhánh nghiệp vụ đỗ xe (Parking)
    Available --> Reserved : Đặt chỗ
    Reserved --> Available : Hủy / Hết hạn
    
    Available --> Occupied : Check-in (Vãng lai)
    Reserved --> Occupied : Check-in (Booking)
    
    Occupied --> Available : Check-out (Rời bãi)
    
    %% Nhánh nghiệp vụ quản lý (Admin)
    Available --> Maintenance : Khóa bảo trì
    Maintenance --> Available : Mở bảo trì
    
    Available --> Blocked : Khóa nội bộ
    Blocked --> Available : Mở khóa
```

---
*Created by Antigravity AI - System Documentation Module*
