import { IsEmail, IsIn, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  full_name!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  password!: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: string;
  @IsOptional()
  @IsIn(['buyer', 'seller'], {
    message: 'Role chỉ được là Buyer hoặc Seller',
  })
  role?: 'buyer' | 'seller';
}

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password!: string;
}