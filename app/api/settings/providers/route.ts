import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Default provider names (non-adult)
const DEFAULT_PROVIDER_NAMES = [
  "4kHDHub",
  "HDHub4u",
  "Movies4u",
  "Drive",
  "Vega",
  "ZeeFliz",
  "ZinkMovies",
  "DesireMovies",
  "NetMirror",
  "AnimeSalt",
  "KMMovies",
  "Netflix",
];

async function getSessionUser(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch settings or initialize in-memory defaults
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);

  return NextResponse.json({
    success: true,
    settings: settings ?? {
      userId: user.id,
      enabledProviders: DEFAULT_PROVIDER_NAMES,
      adultEnabled: false,
      adultConsentAt: null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const enabledProviders: string[] | undefined = body.enabledProviders;
  const adultEnabled: boolean | undefined = body.adultEnabled;
  const confirmAdult: boolean | undefined = body.confirmAdult;

  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);

  const now = new Date();
  const payload: Partial<{
    enabledProviders: string[] | null;
    adultEnabled: boolean;
    adultConsentAt: Date | null;
    updatedAt: Date;
  }> = { updatedAt: now };

  if (enabledProviders) {
    payload.enabledProviders = enabledProviders;
  }

  if (typeof adultEnabled === "boolean") {
    // Only enable adult when confirmAdult true
    if (adultEnabled) {
      if (!confirmAdult) {
        return NextResponse.json({ success: false, error: "Adult content requires confirmation" }, { status: 400 });
      }
      payload.adultEnabled = true;
      payload.adultConsentAt = now;
    } else {
      payload.adultEnabled = false;
      payload.adultConsentAt = null;
    }
  }

  if (settings) {
    await db.update(userSettings).set(payload as any).where(eq(userSettings.userId, user.id));
  } else {
    await db.insert(userSettings).values({
      id: `${user.id}:settings`,
      userId: user.id,
      enabledProviders: payload.enabledProviders ?? DEFAULT_PROVIDER_NAMES,
      adultEnabled: payload.adultEnabled ?? false,
      adultConsentAt: payload.adultConsentAt ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [updated] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);
  return NextResponse.json({ success: true, settings: updated });
}