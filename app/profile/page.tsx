import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { db } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Redirect if not logged in
  if (!authUser) {
    redirect("/auth/login");
  }

  // Load Prisma User by authUserId
  const dbUser = await db.user.findUnique({
    where: { authUserId: authUser.id },
    include: {
      company: true,
    },
  });

  if (!dbUser) {
    console.error("No matching user found in Prisma for authUserId:", authUser.id);
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold text-white mb-8">My Profile</h1>

        <ProfileClient
          authUser={authUser}
          dbUser={dbUser}
          company={dbUser.company}
        />
      </div>
    </div>
  );
}
