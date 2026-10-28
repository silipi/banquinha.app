'use client';

import { meGet, type MeDto } from '@banquinha/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { identifyMerchant } from '@/lib/analytics';
import { panelApi, panelPath } from '@/lib/panel';

/**
 * Loads the signed-in merchant and routes by the onboarding flag: the dashboard needs
 * a finished onboarding, the onboarding needs one still pending. Null while loading or
 * redirecting.
 */
export function usePanelMe(area: 'dashboard' | 'onboarding') {
  const router = useRouter();
  const [me, setMe] = useState<MeDto | null>(null);

  useEffect(() => {
    meGet({ client: panelApi })
      .then(({ data }) => {
        if (!data) return router.replace(panelPath('/login'));
        identifyMerchant(data);
        if (area === 'dashboard' && !data.onboardingCompleted) {
          return router.replace(panelPath('/comecar'));
        }
        if (area === 'onboarding' && data.onboardingCompleted) {
          return router.replace(panelPath('/'));
        }
        setMe(data);
      })
      .catch(() => router.replace(panelPath('/login')));
  }, [area, router]);

  return me;
}
