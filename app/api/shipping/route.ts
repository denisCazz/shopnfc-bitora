import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import {
  calculateShippingCost,
  calculateEuropeShippingCost,
  getShippingZone,
  getShippingConfig,
  type EuropeShippingMethod,
} from "@/lib/shipping";

/**
 * POST /api/shipping
 * Calculate shipping cost for the current cart.
 * Body: { items: [{id, quantity}], country, province? }
 */
export async function POST(req: NextRequest) {
  try {
    const { items, country, province, europeShippingMethod } = (await req.json()) as {
      items: { id: number; quantity: number }[];
      country: string;
      province?: string;
      europeShippingMethod?: EuropeShippingMethod;
    };

    if (!items?.length || !country) {
      return NextResponse.json(
        { error: "items and country are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const productIds = items.map((i) => i.id);
    const prods = await db
      .select({
        id: products.id,
        weight: products.weight,
        fragileShipping: products.fragileShipping,
        fragileShippingCost: products.fragileShippingCost,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    const prodMap = new Map(prods.map((p) => [p.id, p]));

    const totalWeight = items.reduce((sum, item) => {
      const weight = prodMap.get(item.id)?.weight != null ? Number(prodMap.get(item.id)!.weight) : 0.5;
      return sum + weight * item.quantity;
    }, 0);

    const config = await getShippingConfig();
    const zone = getShippingZone(country, province, config);
    const shippingCost =
      zone === "europe" && europeShippingMethod
        ? calculateEuropeShippingCost(europeShippingMethod, config)
        : calculateShippingCost(totalWeight, zone, config);

    // Fragile shipping surcharge (per-item, IVA applied for Italian zones)
    const fragileNet = items.reduce((sum, item) => {
      const prod = prodMap.get(item.id);
      if (prod?.fragileShipping && prod.fragileShippingCost != null) {
        return sum + Number(prod.fragileShippingCost) * item.quantity;
      }
      return sum;
    }, 0);
    const zoneConfig = config.zones[zone];
    const fragileShippingCost =
      fragileNet > 0
        ? zoneConfig.includesIva
          ? Math.round(fragileNet * (1 + config.ivaRate) * 100) / 100
          : fragileNet
        : 0;

    return NextResponse.json({ shippingCost, zone, codSurcharge: config.codSurcharge, fragileShippingCost });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Calcolo spedizione non riuscito" },
      { status: 500 }
    );
  }
}
