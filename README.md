# GreenFarmer Backend

> Nền tảng dịch vụ API cho hệ thống Thương mại Điện tử Nông sản & Truy xuất Nguồn gốc Canh tác.

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## Tổng quan

GreenFarmer Backend cung cấp hệ thống RESTful API phục vụ chuỗi cung ứng nông nghiệp số khép kín từ Nông trại đến Bàn ăn (Farm-to-Table). Hệ thống đảm bảo tính toàn vẹn của dữ liệu truy xuất nguồn gốc nông sản bằng mã QR/Barcode kết hợp nhật ký canh tác theo thời gian thực, đồng thời tích hợp đa cổng thanh toán điện tử cho giao dịch thương mại.

## Tính năng chính

### Quản trị & Phân quyền (RBAC)
- Xác thực tập trung dựa trên JWT (JSON Web Tokens) và mã hóa mật khẩu Bcrypt.
- Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control) cho 3 nhóm người dùng: `Admin`, `Seller`, `Buyer`.

### Quản lý Nông trại & Truy xuất Nguồn gốc
- Số hóa hồ sơ trang trại: vị trí địa lý (tọa độ GPS), diện tích, phương pháp canh tác.
- Quản lý vòng đời lô hàng (Batch): liên kết chặt chẽ với chuỗi nhật ký canh tác (Cultivation Logs).
- Sinh mã định danh Barcode/QR Code phục vụ in tem nhãn và quét camera đối chiếu thực địa.
- Đánh giá cấp độ tin cậy (`trust_level`: Low, Medium, High) thông qua quy trình kiểm duyệt của Quản trị viên.

### Đa Cổng Thanh toán (Multi-Payment Gateways)
- **VNPay Sandbox:** Thanh toán qua ATM nội địa, thẻ quốc tế và VNPAY-QR với chữ ký số SHA-512.
- **MoMo Sandbox:** Tích hợp API v2 (phương thức `captureWallet`) sử dụng thuật toán HMAC-SHA256.
- **ZaloPay Sandbox:** Tích hợp OpenAPI v2 với cơ chế xác thực `mac` và callback tự động.
- **COD:** Thanh toán tiền mặt khi giao nhận hàng.

### Quản lý Đơn hàng & Đánh giá
- Quy trình máy trạng thái đơn hàng (Order State Machine): `Pending` → `Confirmed` → `Shipping` → `Completed`.
- Vòng lặp phản hồi (Feedback Loop): Cho phép người mua đánh giá chất lượng (1-5 sao và nhận xét) sau khi hoàn tất đơn hàng.

## Kiến trúc Công nghệ

| Thành phần | Công nghệ / Thư viện | Mục đích sử dụng |
| :--- | :--- | :--- |
| Framework | NestJS 11 | Kiến trúc Controller - Service - Repository phân tầng |
| Ngôn ngữ | TypeScript | Kiểm soát kiểu dữ liệu tĩnh, Clean Code |
| Cơ sở dữ liệu | MySQL 8.0 | Lưu trữ quan hệ (13 thực thể chuẩn hóa 3NF) |
| ORM | TypeORM 1.1 | Quản lý schema, quan hệ và truy vấn dữ liệu |
| Xác thực | Passport, JWT | Quản lý phiên làm việc không trạng thái (Stateless) |
| Lưu trữ tệp | Cloudinary CDN | Lưu trữ và phân phối hình ảnh nông sản, nhật ký |

## Cấu trúc Thư mục

```text
src/
├── auth/           # Xác thực, JWT strategy, Guards và Decorators
├── batch/          # Quản lý lô hàng nông sản và nhật ký canh tác
├── category/       # Phân loại danh mục nông sản
├── farm/           # Quản lý hồ sơ nông trại và vùng trồng
├── order/          # Xử lý giỏ hàng và trạng thái đơn hàng
├── payment/        # Dịch vụ tích hợp VNPay, MoMo, ZaloPay
├── products/       # Danh mục sản phẩm và bảng giá
├── reviews/        # Đánh giá và xếp hạng chất lượng sản phẩm
├── upload/         # Tải lên tệp đa phương tiện qua Cloudinary
├── users/          # Quản trị tài khoản người dùng
├── app.module.ts   # Module gốc cấu hình hệ thống
└── main.ts         # Điểm khởi chạy ứng dụng
```

## Cài đặt & Khởi chạy

### Yêu cầu hệ thống
- Node.js >= 20.x (Khuyến nghị Node.js v22.x)
- MySQL Server >= 8.0

### Các bước triển khai

1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo tệp `.env` tại thư mục gốc từ mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Cập nhật các thông số kết nối trong `.env`:**
   ```env
   PORT=3000

   # MySQL Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_password
   DB_DATABASE=GreenFarm

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key

   # Payment Gateways (Sandbox)
   VNP_TMN_CODE=your_vnp_tmn_code
   VNP_HASH_SECRET=your_vnp_hash_secret
   MOMO_PARTNER_CODE=MOMO
   ZALOPAY_APP_ID=2553
   ```

4. **Khởi chạy máy chủ:**
   ```bash
   # Môi trường phát triển
   npm run start:dev

   # Biên dịch Production
   npm run build
   ```

   Máy chủ mặc định khởi chạy tại: `http://localhost:3000`

## Thông tin Dự án

- **Tác giả:** Lê Tuấn Khải
- **Đơn vị đào tạo:** Lớp 23KIT - Trường CNTT & TT Việt - Hàn (VKU) - Đại học Đà Nẵng
- **Đơn vị thực tập:** FPT Software DaNang
- **Đề tài:** GreenFarmer - Hệ thống Thương mại Điện tử Nông sản & Truy xuất Nguồn gốc Canh tác
