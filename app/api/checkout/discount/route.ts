import { NextRequest, NextResponse } from "next/server";
import { computeDiscountAmount, normalizeDiscountCode } from "@/lib/discount";
import {
  findDiscountCode,
  validateDiscountCode,
} from "@/lib/discount-codes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code : "";
    const subtotal = Number(body?.subtotal);

    if (!normalizeDiscountCode(code)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }

    const row = await findDiscountCode(code);
    if (!row) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }

    const cartSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
    const valid = validateDiscountCode(row, cartSubtotal);
    if (!valid.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: valid.error,
          minOrderAmount: valid.minOrderAmount ?? null,
        },
        { status: 400 }
      );
    }

    const value = Number(row.value);
    const amount = computeDiscountAmount(cartSubtotal, row.type, value);

    return NextResponse.json({
      ok: true,
      code: row.code,
      type: row.type,
      value,
      amount,
      minOrderAmount: row.minOrderAmount != null ? Number(row.minOrderAmount) : null,
    });
  } catch (err) {
    console.error("Discount validate error:", err);
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 500 });
  }
}
