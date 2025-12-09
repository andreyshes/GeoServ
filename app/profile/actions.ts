"use server";

import { supabaseServerAction } from "@/lib/supabaseServer-action";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";


// ---------- TYPES ----------
type ActionResult = { error?: string; success?: boolean };

// ---------- UPDATE NAME ----------
export async function updateName(name: string): Promise<ActionResult> {
  try {
    if (!name || name.trim().length < 2) {
      return { error: "Name must be at least 2 characters." };
    }

    const supabase = await supabaseServerAction();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: "Unauthorized." };

    // Update Prisma User
    await db.user.update({
      where: { authUserId: user.id },
      data: { name },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update name." };
  }
}

// ---------- UPDATE EMAIL ----------
export async function updateEmail(email: string): Promise<ActionResult> {
  try {
    if (!email.includes("@")) {
      return { error: "Invalid email address." };
    }

    const supabase = await supabaseServerAction();
    const {
      data: { user },
      error: fetchErr,
    } = await supabase.auth.getUser();

    if (fetchErr || !user) return { error: "Unauthorized." };

    const { error } = await supabase.auth.updateUser({ email });

    if (error) return { error: error.message };

    revalidatePath("/profile");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update email." };
  }
}

// ---------- UPDATE PASSWORD ----------
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    if (newPassword.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    const supabase = await supabaseServerAction();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized." };

    // Re-authentication (Supabase requires this)
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (reauthError) return { error: "Current password is incorrect." };

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) return { error: error.message };

    revalidatePath("/profile");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update password." };
  }
}

// ---------- AVATAR UPLOAD ----------
// ---------- AVATAR: UPDATE METADATA ONLY ----------
export async function updateAvatarUrl(publicUrl: string): Promise<ActionResult> {
  try {
    const supabase = await supabaseServerAction();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized." };

    const { error: updateErr } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateErr) return { error: updateErr.message };

    revalidatePath("/profile");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update avatar metadata." };
  }
}

