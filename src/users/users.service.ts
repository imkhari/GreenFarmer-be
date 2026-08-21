import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

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
}