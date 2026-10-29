import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [PrismaModule, RoomsModule, AuthModule, UsersModule,
    // Configure CacheManager with Redis
    CacheModule.registerAsync({
      isGlobal: true, // Make cache module available globally
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: '127.0.0.1',
            port: 6379,
          },
        }),
      }),
    }),
    // Configure Rate Limiting (Throttler)
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time to live in milliseconds (1 minute)
      limit: 30,  // Max number of requests within TTL
    }]),
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
