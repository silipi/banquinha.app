import { BadRequestException } from '@nestjs/common';
import type { FulfillmentMethod } from './dto/create-order.dto.js';

interface FulfillmentOptions {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
}

/** The ways to receive an order a store offers, in the order the bag shows them. */
export function offeredFulfillment(
  store: FulfillmentOptions,
): FulfillmentMethod[] {
  const methods: FulfillmentMethod[] = [];
  if (store.pickupEnabled) methods.push('pickup');
  if (store.deliveryEnabled) methods.push('delivery');
  if (store.onlineEnabled) methods.push('online');
  return methods;
}

/** A store keeps at least one way to receive orders on. */
export function assertSomeFulfillment(options: FulfillmentOptions): void {
  if (offeredFulfillment(options).length === 0) {
    throw new BadRequestException(
      'Deixe pelo menos uma forma de atendimento ligada: retirada, entrega ou online.',
    );
  }
}
