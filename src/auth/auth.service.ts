import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new HttpException({ success: false, message: 'Email đã tồn tại' }, HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const role =
      registerDto.role === 'seller'
        ? UserRole.SELLER
        : UserRole.BUYER;
    const newUser = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.usersRepository.save(newUser);
    const { password, updated_at, ...result } = savedUser;

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: result,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { email: loginDto.email } });
    if (!user) {
      throw new HttpException({ success: false, message: 'Email hoặc mật khẩu không đúng' }, HttpStatus.UNAUTHORIZED);
    }

    const isPasswordMatching = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordMatching) {
      throw new HttpException({ success: false, message: 'Email hoặc mật khẩu không đúng' }, HttpStatus.UNAUTHORIZED);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const { password, address, ...userData } = user;

    return {
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      user: userData,
    };
  }
}