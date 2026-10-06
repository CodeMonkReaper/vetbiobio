import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({ providers: [UsersService, AdminBootstrapService], exports: [UsersService] })
export class UsersModule {}
