// lib/auth.ts
import { supabase } from "./supabase";

// ------------------ LOGIN ------------------
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase
      .from("allowedpeople")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return { success: false, message: "Invalid email or password" };
    }

    // Save session
    localStorage.setItem(
      "userSession",
      JSON.stringify({ email, loggedIn: true })
    );

    return { success: true, message: "Login successful" };
  } catch (error) {
    return { success: false, message: "Login error occurred" };
  }
}

// ------------------ SIGNUP ------------------
export async function signUp(email: string, password: string, accessCode: string) {
  try {
    // 1. Get access code from DB - use .single() instead of .limit(1)
    const { data: access, error: accessError } = await supabase
      .from("accesscode")
      .select("code")
      .single();

    if (accessError || !access) {
      console.error("Access code error:", accessError);
      return { success: false, message: "Access code not configured" };
    }

    const requiredCode = access.code;

    // 2. Compare provided code
    if (accessCode.trim() !== requiredCode.trim()) {
      return { success: false, message: "Invalid access code" };
    }

    // 3. Check if email already exists
    const { data: existing } = await supabase
      .from("allowedpeople")
      .select("email")
      .eq("email", email)
      .single();

    if (existing) {
      return { success: false, message: "Email is already registered" };
    }

    // 4. Insert user
    const { error } = await supabase
      .from("allowedpeople")
      .insert({ email, password });

    if (error) {
      return { success: false, message: "Registration failed" };
    }

    // 5. Auto-login
    localStorage.setItem(
      "userSession",
      JSON.stringify({ email, loggedIn: true })
    );

    return { success: true, message: "Registration successful" };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, message: "Signup failed" };
  }
}

// ------------------ SESSION HELPERS ------------------
export function signOut() {
  localStorage.removeItem("userSession");
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  const session = localStorage.getItem("userSession");
  if (!session) return false;
  try {
    return JSON.parse(session).loggedIn === true;
  } catch {
    return false;
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const session = localStorage.getItem("userSession");
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}