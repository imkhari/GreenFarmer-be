import { Injectable, HttpException, HttpStatus, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const SALT_ROUNDS = 10;

type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findById(id: number) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new HttpException({ success: false, message: 'Không tìm thấy người dùng' }, HttpStatus.NOT_FOUND);
        }
        const { password, ...result } = user;
        return result;
    }

    async updateProfile(id: number, updateData: {
        full_name?: string;
        phone?: string;
        address?: string;
        avatar?: string;
    },) {

        await this.usersRepository.update(id, updateData);
        const updatedUser = await this.usersRepository.findOne({ where: { id } });

        if (!updatedUser) {
            throw new HttpException({ success: false, message: 'Không tìm thấy user' }, HttpStatus.NOT_FOUND);
        }

        const { password, ...result } = updatedUser;
        return result;
    }
    async updateAvatar(
        id: number,
        avatarUrl: string,
    ) {

        await this.usersRepository.update(
            id,
            {
                avatar: avatarUrl,
            },
        );

        const updatedUser =
            await this.usersRepository.findOne({
                where: { id },
            });

        if (!updatedUser) {
            throw new HttpException(
                {
                    success: false,
                    message:
                        "Không tìm thấy user",
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const {
            password,
            ...result
        } = updatedUser;

        return result;
    }
    async create(createUserDto: CreateUserDto): Promise<SafeUser> {
        await this.ensureEmailNotTaken(createUserDto.email);

        const hashedPassword = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);

        const user = this.usersRepository.create({
            full_name: createUserDto.full_name,
            email: createUserDto.email,
            password: hashedPassword,
            phone: createUserDto.phone,
            address: createUserDto.address,
            avatar: createUserDto.avatar,
            role: createUserDto.role ?? UserRole.BUYER,
            status: UserStatus.ACTIVE,
        });

        const savedUser = await this.usersRepository.save(user);
        return this.toResponse(savedUser);
    }
    async findAll(query: UserQueryDto) {
        const { search, role, status, page = 1, limit = 10 } = query;

        const qb = this.usersRepository.createQueryBuilder('user');

        if (search) {
            qb.andWhere(
                '(LOWER(user.full_name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
                {
                    search: `%${search}%`,
                },
            );
        }

        if (role) {
            qb.andWhere('user.role = :role', { role });
        }

        if (status) {
            qb.andWhere('user.status = :status', { status });
        }

        qb.orderBy('user.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [users, total] = await qb.getManyAndCount();

        return {
            items: users.map((user) => this.toResponse(user)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id: number): Promise<SafeUser> {
        const user = await this.findUserEntity(id);
        return this.toResponse(user);
    }
    async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
        const user = await this.findUserEntity(id);

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            await this.ensureEmailNotTaken(updateUserDto.email);
        }

        const { full_name, ...rest } = updateUserDto;

        Object.assign(user, rest);
        if (full_name !== undefined) {
            user.full_name = full_name;
        }

        const updatedUser = await this.usersRepository.save(user);
        return this.toResponse(updatedUser);
    }
    async lock(id: number) {
        return this.setStatus(id, UserStatus.LOCKED, 'Khóa tài khoản thành công');
    }

    async unlock(id: number) {
        return this.setStatus(id, UserStatus.ACTIVE, 'Mở khóa tài khoản thành công');
    }

    // ============================================================
    // RESET PASSWORD
    // ============================================================
    async resetPassword(id: number, resetPasswordDto: ResetPasswordDto) {
        const user = await this.findUserEntity(id);

        user.password = await bcrypt.hash(resetPasswordDto.password, SALT_ROUNDS);
        await this.usersRepository.save(user);

        return { message: 'Reset password thành công' };
    }

    // ============================================================
    // DELETE USER
    // ============================================================
    async remove(id: number) {
        const user = await this.findUserEntity(id);
        await this.usersRepository.remove(user);

        return { message: 'Xóa User thành công' };
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private async findUserEntity(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('Không tìm thấy User');
        }

        return user;
    }

    private async ensureEmailNotTaken(email: string): Promise<void> {
        const existingUser = await this.usersRepository.findOne({ where: { email } });

        if (existingUser) {
            throw new ConflictException('Email đã tồn tại');
        }
    }

    private async setStatus(id: number, status: UserStatus, message: string) {
        const user = await this.findUserEntity(id);
        user.status = status;
        await this.usersRepository.save(user);

        return { message };
    }

    private toResponse(user: User): SafeUser {
        const { password, ...result } = user;
        return result;
    }
}