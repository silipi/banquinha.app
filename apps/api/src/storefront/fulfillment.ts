import type { FulfillmentMethod } from './dto/create-order.dto.js';

/** The ways to receive an order a store offers, in the order the bag shows them. */
export function offeredFulfillment(store: {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}): FulfillmentMethod[] {
  const methods: FulfillmentMethod[] = [];
  if (store.pickupEnabled) methods.push('pickup');
  if (store.deliveryEnabled) methods.push('delivery');
  return methods;
}
