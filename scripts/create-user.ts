/**
 * Create a new user in Supabase Auth + optionally create their Workspace.
 *
 * Usage:
 *   npx tsx scripts/create-user.ts <email> <password>
 *
 * Examples:
 *   npx tsx scripts/create-user.ts admin@company.com "SecurePass123!"
 *   npm run create-user -- admin@company.com "SecurePass123!"
 *
 * Requires these environment variables (from .env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_URL (for Prisma workspace creation)
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-user.ts <email> <password>");
  console.error('Example: npx tsx scripts/create-user.ts admin@company.com "SecurePass123!"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("❌ Password must be at least 8 characters long.");
  process.exit(1);
}

async function main() {
  // Create Supabase admin client
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`\nCreating user: ${email}...`);

  let userId: string;

  // Try to create user in Supabase Auth (confirmed, no email verification needed)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
    });

  if (authError) {
    if (authError.message.toLowerCase().includes("already")) {
      console.log(`ℹ️  User already exists in Auth. Updating password...`);
      // Find the user ID
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        userId = existingUser.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
        });
        if (updateError) {
          console.error(`❌ Failed to update password: ${updateError.message}`);
          process.exit(1);
        }
        console.log(`✅ Password successfully updated for user: ${email}`);
      } else {
        console.error(`❌ Failed: User exists but could not locate user ID.`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to create auth user: ${authError.message}`);
      process.exit(1);
    }
  } else {
    userId = authData.user.id;
    console.log(`✅ Auth user created with ID: ${userId}`);
  }

  // Create associated Workspace in Prisma
  try {
    // Dynamic import to avoid requiring full Next.js environment
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Check if workspace already exists
    const existing = await pool.query(
      'SELECT id FROM "Workspace" WHERE "clerkUserId" = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      console.log(`ℹ️  Workspace already exists for this user.`);
    } else {
      // Generate a cuid-like ID
      const { randomBytes } = await import("crypto");
      const id = randomBytes(16).toString("hex").slice(0, 25);

      await pool.query(
        `INSERT INTO "Workspace" (id, "clerkUserId", name, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [id, userId, "My Workspace"]
      );

      // Create workspace settings
      const settingsId = randomBytes(16).toString("hex").slice(0, 25);
      await pool.query(
        `INSERT INTO "WorkspaceSettings" (id, "workspaceId", "dailySendLimit", "sendWindowStart", "sendWindowEnd", "createdAt", "updatedAt")
         VALUES ($1, $2, 50, '09:00', '17:00', NOW(), NOW())`,
        [settingsId, id]
      );

      console.log(`✅ Workspace created with ID: ${id}`);
    }

    await pool.end();
  } catch (dbError: any) {
    console.warn(
      `⚠️  Could not create workspace (database might not be migrated yet): ${dbError.message}`
    );
    console.log(
      "   The workspace will be auto-created when the user first logs in."
    );
  }

  console.log(`\n🎉 Done! User ${email} can now log in at /login`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
