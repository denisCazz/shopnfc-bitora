import { NextRequest, NextResponse } from "next/server";
import { validateVAT } from "@/lib/vies";

export async function POST(req: NextRequest) {
  const { countryCode, vatNumber } = await req.json();

  if (!countryCode || !vatNumber) {
    return NextResponse.json(
      { error: "countryCode e vatNumber richiesti" },
      { status: 400 }
    );
  }

  const result = await validateVAT(countryCode, vatNumber);
  return NextResponse.json(result);
}
