import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/lib/auth';
import { db } from "@/lib/db";
import { gmailProvider } from "@/lib/email/gmail";
import { encrypt } from "@/lib/encryption";
import { getOnboardingStatus } from "@/actions/company";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(new URL(`/settings?error=${error}`, req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
    }

    const workspace = await db.workspace.findUnique({
      where: { supabaseUserId: userId },
    });

    if (!workspace) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Exchange code for tokens
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/google`;
    
    // Check mock mode
    let tokens;
    if (process.env.GMAIL_MOCK_MODE === "true" || code === "mock_code") {
      tokens = {
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        email: "demo.founder@example.com",
        displayName: "Demo Founder",
      };
    } else {
      tokens = await gmailProvider.exchangeCode(code, redirectUri);
    }

    // Save to database
    const mailbox = await db.mailboxConnection.upsert({
      where: {
        workspaceId_email: {
          workspaceId: workspace.id,
          email: tokens.email,
        },
      },
      update: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        displayName: tokens.displayName,
        scopes: ["gmail.send", "gmail.readonly"],
        isActive: true,
        syncError: null,
      },
      create: {
        workspaceId: workspace.id,
        provider: "gmail",
        email: tokens.email,
        displayName: tokens.displayName,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        scopes: ["gmail.send", "gmail.readonly"],
        isActive: true,
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        action: "mailbox_connected",
        entityType: "mailbox",
        entityId: mailbox.id,
        details: { email: tokens.email, provider: "gmail" },
        performedBy: "user",
      },
    });

    // Check if we are in onboarding
    const status = await getOnboardingStatus();
    if (status && status.step !== "review") {
      return NextResponse.redirect(new URL(`/onboarding/${status.step}`, req.url));
    }

    // Determine redirect based on state
    if (state === "onboarding") {
      return NextResponse.redirect(new URL("/onboarding/import-investors", req.url));
    }

    return NextResponse.redirect(new URL("/settings?success=true", req.url));
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(new URL("/settings?error=auth_failed", req.url));
  }
}
