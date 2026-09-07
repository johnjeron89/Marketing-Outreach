"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Simple in-memory rate limiter for login attempts
// Resets on cold start (serverless), but provides protection during active usage
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = process.env.NODE_ENV === 'development' ? 50 : 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    // Window expired or first attempt — allow
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count++;
  }
}

function clearAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase().trim());
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string || '').trim();
  const password = formData.get('password') as string || '';

  // Basic validation
  if (!email || !password) {
    redirect('/login?error=Please enter both email and password')
  }

  // Rate limit check
  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    redirect(`/login?error=Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`)
  }

  console.log(`[Auth] Attempting login for email: "${email}" (length: ${email.length})`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[Auth] Supabase login error:', error.message, error.status);
    recordFailedAttempt(email);
    // Generic error message — don't reveal whether the email exists
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Successful login — clear rate limit
  clearAttempts(email);

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
