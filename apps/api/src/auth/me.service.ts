import { Injectable } from '@nestjs/common';
import { PLANS } from '../plans/plans.js';
import { StoresService } from '../stores/stores.service.js';
import type { AuthUser } from './current-user.decorator.js';
import type { MeDto } from './dto/auth.dto.js';

@Injectable()
export class MeService {
  constructor(private readonly stores: StoresService) {}

  async build(user: AuthUser): Promise<MeDto> {
    const stores = await this.stores.listMine(user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
      plan: { id: user.plan, ...PLANS[user.plan] },
      // The onboarding ends by creating the first store.
      onboardingCompleted: stores.length > 0,
      stores,
    };
  }
}
