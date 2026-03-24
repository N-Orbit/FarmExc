import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from './email.service';
import { NotificationGateway } from '../notification.gateway';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../prisma.service';
import { SmsService } from './sms.service';
import { TemplateService } from './template.service';
import { WebPushService } from './web-push.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const prismaMock = {
    user: { findUnique: jest.fn() },
    notification: { create: jest.fn() },
    notificationDelivery: { create: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
        { provide: WebPushService, useValue: { sendNotification: jest.fn() } },
        { provide: SmsService, useValue: { sendSms: jest.fn() } },
        { provide: TemplateService, useValue: { render: jest.fn().mockReturnValue('rendered') } },
        { provide: NotificationGateway, useValue: { sendToUser: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
