import { NextRequest, NextResponse } from "next/server";
import { signPayload } from "@/lib/signed-payload";
import {
  CUSTOM_GRAPHIC_PENDING_TTL_MS,
  savePendingGraphic,
  validateCustomGraphic,
  type PendingGraphicToken,
} from "@/lib/custom-graphic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File mancante" }, { status: 400 });
  }

  const validated = await validateCustomGraphic(file);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const saved = await savePendingGraphic(validated.graphic);
  const token = signPayload({
    scope: "custom-graphic-pending",
    file: saved.fileName,
    originalName: saved.originalName,
    exp: Date.now() + CUSTOM_GRAPHIC_PENDING_TTL_MS,
  } satisfies PendingGraphicToken);

  return NextResponse.json({
    token,
    originalName: saved.originalName,
    kind: validated.graphic.kind,
  });
}
