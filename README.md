# 🌾 GreenFarmer Backend - Nền tảng TMĐT Nông sản & Truy xuất nguồn gốc

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/VNPay-005BAA?style=for-the-badge&logo=vnpay&logoColor=white" alt="VNPay" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

---

## 📖 Giới thiệu dự án

**GreenFarmer Backend** là hệ thống máy chủ dịch vụ (RESTful API) được xây dựng trên nền tảng **NestJS** kết hợp **TypeScript** và cơ sở dữ liệu quan hệ **MySQL**. Dự án phục vụ nền tảng kết nối trực tiếp giữa **Nông trại (Seller)** và **Người tiêu dùng (Buyer)**, đồng thời cung cấp công cụ cho **Quản trị viên (Admin)** quản lý, kiểm duyệt chất lượng nông sản.

Điểm nổi bật của hệ thống là khả năng **truy xuất nguồn gốc chuỗi cung ứng nông sản** (Farm-to-Table) qua mã QR Code/Barcode, tích hợp cổng thanh toán trực tuyến **VNPay Sandbox**, và quản trị quy trình canh tác minh bạch.

---

## 🚀 Tính năng cốt lõi (Core Modules)

| Phân hệ (Module) | Mô tả chức năng | Công nghệ / Ghi chú |
| :--- | :--- | :--- |
| **Authentication (`auth`)** | Đăng ký, đăng nhập, bảo vệ API với JWT Guard, phân quyền 3 vai trò: `Admin`, `Seller`, `Buyer`. | JWT, Bcrypt |
| **Trang trại (`farms`)** | Quản lý thông tin hồ sơ nông trại, chủ sở hữu, tọa độ địa lý, diện tích canh tác, cấp độ tin cậy (`trust_level`). | TypeORM / MySQL |
| **Lô hàng & QR (`batches`)** | Quản lý lô nông sản, tạo mã barcode/QR tự động, quản lý nhật ký canh tác từng giai đoạn và kiểm duyệt lô hàng. | QR Code Generator |
| **Sản phẩm (`products`)** | Đăng bán nông sản, phân loại danh mục rau củ quả hữu cơ, đồng bộ thông tin trang trại và lô hàng. | Cloudinary Upload |
| **Đơn hàng & Thanh toán (`orders`)** | Tạo giỏ hàng, đặt hàng, xử lý trạng thái giao hàng, tích hợp cổng thanh toán **VNPay** tạo URL thanh toán và xác thực IPN/Return. | VNPay Sandbox SDK |
| **Đánh giá (`reviews`)** | Người mua đánh giá chất lượng sản phẩm (1-5 sao kèm nhận xét) sau khi đơn hàng chuyển sang trạng thái hoàn tất (`Completed`). | RESTful API |
| **Lưu trữ đa phương tiện (`upload`)** | Tải lên hình ảnh sản phẩm, nhật ký trang trại, giấy chứng nhận tiêu chuẩn VietGAP/GlobalGAP. | Cloudinary CDN |

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Framework:** [NestJS 11](https://nestjs.com/) (Kiến trúc Module hóa, Dependency Injection, Controller-Service-Repository).
* **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/) (Strict Type, Clean Code).
* **Cơ sở dữ liệu:** [MySQL 8.0](https://www.mysql.com/) (13 bảng dữ liệu quan hệ chuẩn hóa 3NF).
* **Bảo mật:** `bcryptjs` băm mật khẩu, `@nestjs/jwt` & `passport-jwt` xác thực phiên làm việc.
* **Cổng thanh toán:** [VNPay Sandbox](https://sandbox.vnpayment.vn/) với thuật toán mã hóa SHA-512 kiểm tra tính toàn vẹn giao dịch.
* **Đám mây lưu trữ:** [Cloudinary API](https://cloudinary.com/) tối ưu hóa hình ảnh.

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
greenFarmBE/
├── src/
│   ├── auth/           # Module xác thực người dùng (JWT, Bcrypt, Roles Guard)
│   ├── batches/        # Module quản lý lô hàng nông sản & nhật ký canh tác
│   ├── categories/     # Module danh mục sản phẩm nông sản
│   ├── farms/          # Module quản lý nông trại & hồ sơ canh tác
│   ├── orders/         # Module xử lý đơn hàng & tích hợp thanh toán VNPay
│   ├── products/       # Module sản phẩm, giá bán, hình ảnh
│   ├── reviews/        # Module đánh giá & nhận xét chất lượng nông sản
│   ├── upload/         # Module tích hợp Cloudinary CDN upload ảnh
│   ├── users/          # Module quản lý tài khoản người dùng
│   ├── app.module.ts   # Root Module kết nối cơ sở dữ liệu
│   └── main.ts         # Điểm khởi chạy ứng dụng (Port: 3000)
├── test/               # Kiểm thử đơn vị & E2E
├── .env.example        # Mẫu biến môi trường cấu hình hệ thống
├── package.json        # Danh sách thư viện phụ thuộc
└── README.md           # Tài liệu hướng dẫn dự án
```

---

## ⚙️ Cài đặt & Khởi chạy dự án

### 1. Yêu cầu môi trường
* **Node.js:** Phiên bản >= 20.x (Khuyến nghị **Node v22.x** để hỗ trợ Web Crypto API).
* **MySQL:** Phiên bản 8.0+ đang chạy trên cổng `3306`.

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc của `greenFarmBE`:

```env
PORT=3000

# Cấu hình Cơ sở dữ liệu MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=GreenFarm

# Cấu hình JWT Authentication
JWT_SECRET=GreenFarmerSecretKey2026

# Cấu hình Cloudinary CDN
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cấu hình Cổng thanh toán VNPay Sandbox
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/payment-result
```

### 4. Chạy ứng dụng
```bash
# Chạy ở chế độ phát triển (Development / Hot-reload)
npm run start:dev

# Kiểm tra Build cho môi trường Production
npm run build
```

Máy chủ sẽ khởi chạy tại: `http://localhost:3000`

---

## 👨‍💻 Tác giả & Thông tin Đồ án

* **Sinh viên thực hiện:** Lê Tuấn Khải
* **Mã sinh viên / Lớp:** 23KIT - Trường Công nghệ Thông tin & Truyền thông Việt - Hàn (**VKU**) - Đại học Đà Nẵng
* **Đề tài:** Thực tập Doanh nghiệp tại **FPT Software DaNang**
* **Dự án:** GreenFarmer - Hệ thống Thương mại Điện tử Nông sản Sạch & Truy xuất Nguồn gốc Canh tác
