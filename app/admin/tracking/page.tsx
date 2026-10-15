import { getOrders } from "@/app/admin/actions/orders";
import {
  getCustomTrackingsList,
  getOrderTrackingMetaMap,
} from "@/lib/tracking-server";
import TrackingAdminClient from "./TrackingAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminTrackingPage() {
  const [{ orders, profileMap }, metaMap, customTrackings] = await Promise.all([
    getOrders(),
    getOrderTrackingMetaMap(),
    getCustomTrackingsList(),
  ]);

  return (
    <TrackingAdminClient
      initialOrders={orders}
      profileMap={profileMap}
      initialMetaMap={metaMap}
      initialCustomTrackings={customTrackings}
    />
  );
}
