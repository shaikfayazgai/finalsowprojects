/**
 * Admin payment rails mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_PAYMENT_RAILS,
  type MockPaymentRail,
  type RailStatus,
} from "@/mocks/admin/rails";

const railOverlay = createOverlayStore<MockPaymentRail>("glimmora.mock.adminPaymentRails.v1");

export const adminRailsOverlay = railOverlay;

function listMerged(): MockPaymentRail[] {
  return applyOverlay(MOCK_PAYMENT_RAILS, railOverlay.read());
}

export function listPaymentRails(): MockPaymentRail[] {
  return listMerged();
}

export function getPaymentRail(id: string): MockPaymentRail | undefined {
  return listMerged().find((r) => r.id === id);
}

export function setRailStatus(id: string, status: RailStatus): MockPaymentRail | undefined {
  if (!getPaymentRail(id)) return undefined;
  railOverlay.patch(id, { status });
  return getPaymentRail(id);
}

export function setRailHoldPolicy(
  id: string,
  holdPolicy: MockPaymentRail["holdPolicy"],
): MockPaymentRail | undefined {
  if (!getPaymentRail(id)) return undefined;
  railOverlay.patch(id, { holdPolicy });
  return getPaymentRail(id);
}

export function rotateRailKey(id: string): MockPaymentRail | undefined {
  const r = getPaymentRail(id);
  if (!r) return undefined;
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  railOverlay.patch(id, {
    keyMask: `****${suffix}`,
    secretRotatedAt: new Date().toISOString(),
  });
  return getPaymentRail(id);
}

export interface DrainRailResult {
  source: MockPaymentRail;
  target?: MockPaymentRail;
  movedCount: number;
}

function findFallbackRail(source: MockPaymentRail): MockPaymentRail | undefined {
  return listMerged().find(
    (r) =>
      r.id !== source.id &&
      r.status === "active" &&
      r.country === source.country &&
      (r.currency === source.currency || source.currency === "Multi" || r.currency === "Multi"),
  );
}

export function drainRailToFallback(sourceId: string): DrainRailResult | undefined {
  const source = getPaymentRail(sourceId);
  if (!source || source.pendingPayoutsCount <= 0) return undefined;

  const target = findFallbackRail(source);
  const movedCount = source.pendingPayoutsCount;

  railOverlay.patch(sourceId, {
    pendingPayoutsCount: 0,
    pendingPayoutsTotal: source.currency === "Multi" ? "$0" : "₹0",
    pendingPayoutsOldest: "—",
  });

  if (target) {
    railOverlay.patch(target.id, {
      pendingPayoutsCount: target.pendingPayoutsCount + movedCount,
    });
    return { source: getPaymentRail(sourceId)!, target: getPaymentRail(target.id), movedCount };
  }

  return { source: getPaymentRail(sourceId)!, movedCount };
}
