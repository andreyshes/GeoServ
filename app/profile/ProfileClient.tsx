"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
	updateName,
	updateEmail,
	updatePassword,
	updateAvatarUrl,
} from "./actions";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User as DbUser, Company } from "@prisma/client";

interface ProfileClientProps {
	authUser: SupabaseUser;
	dbUser: DbUser;
	company: Company;
}

const TRANSPARENT_PIXEL =
	"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function ProfileClient({
	authUser,
	dbUser,
	company,
}: ProfileClientProps) {
	const [isPending, startTransition] = useTransition();

	// Local state for forms
	const [name, setName] = useState(dbUser.name || "");
	const [email, setEmail] = useState(authUser.email || "");

	const [currentPw, setCurrentPw] = useState("");
	const [newPw, setNewPw] = useState("");
	const [confirmPw, setConfirmPw] = useState("");

	const avatarUrl =
		dbUser.avatarUrl || authUser.user_metadata?.avatar_url || null;

	const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

		if (file.size > MAX_SIZE) {
			toast.error("Photo size must be less than 5MB.");
			return;
		}

		if (!allowedTypes.includes(file.type)) {
			toast.error("Only JPG, PNG, and WebP images are allowed.");
			return;
		}

		setIsUploadingAvatar(true);

		const supabase = supabaseBrowser();

		const fileExt = file.name.split(".").pop();
		const fileName = `avatar-${authUser.id}-${Date.now()}.${fileExt}`;
		const filePath = `avatars/${fileName}`;

		const { error: uploadErr } = await supabase.storage
			.from("avatars")
			.upload(filePath, file, {
				upsert: true,
				contentType: file.type,
			});

		if (uploadErr) {
			toast.error("Upload failed: " + uploadErr.message);
			setIsUploadingAvatar(false);
			return;
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from("avatars")
			.getPublicUrl(filePath);

		const publicUrl = urlData.publicUrl;

		setAvatarPreview(publicUrl);

		const response = await updateAvatarUrl(publicUrl);

		if (response.error) {
			// Revert preview if the server action fails
			setAvatarPreview(avatarUrl);
			toast.error(response.error);
		} else {
			toast.success("Avatar updated!");
		}

		setIsUploadingAvatar(false);
	}

	const saveName = () => {
		startTransition(async () => {
			const result = await updateName(name);
			if (result.error) toast.error(result.error);
			else toast.success("Name updated.");
		});
	};

	const saveEmail = () => {
		startTransition(async () => {
			const result = await updateEmail(email);
			if (result.error) toast.error(result.error);
			else
				toast.success("Email updated — please verify the confirmation email.");
		});
	};

	const savePassword = () => {
		if (newPw !== confirmPw) {
			toast.error("New passwords do not match.");
			return;
		}

		startTransition(async () => {
			const result = await updatePassword(currentPw, newPw);
			if (result.error) toast.error(result.error);
			else {
				toast.success("Password updated.");
				// Clear password fields on success
				setCurrentPw("");
				setNewPw("");
				setConfirmPw("");
			}
		});
	};

	return (
		<div className="space-y-10 pb-20">
			{/* ---------- AVATAR SECTION ---------- */}
			<Card className="bg-[#111] border-white/10 p-6 rounded-2xl">
				<h2 className="text-xl font-semibold text-white mb-6">Profile Photo</h2>

				<div className="flex items-center gap-6">
					<div
						className="
  relative
  rounded-full
  overflow-hidden
  border border-white/10
  shadow-lg
  flex items-center justify-center
  w-20 h-20 aspect-square
  sm:w-24 sm:h-24
	shrink-0
"
					>
						{isUploadingAvatar ? (
							<Loader2 className="h-6 w-6 animate-spin text-white/50" />
						) : (
							<Image
								src={
									avatarPreview && avatarPreview.length > 5
										? avatarPreview
										: TRANSPARENT_PIXEL
								}
								alt="Avatar"
								fill
								className="object-cover"
							/>
						)}

						{!avatarPreview && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-700/50">
								<Camera className="h-6 w-6 text-white/70" />
							</div>
						)}
					</div>

					<div>
						<label
							className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg cursor-pointer border border-white/10 transition ${
								isUploadingAvatar
									? "bg-white/5 opacity-50"
									: "bg-white/5 hover:bg-white/10"
							}`}
						>
							{isUploadingAvatar ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Camera className="h-4 w-4" />
							)}
							{isUploadingAvatar ? "Uploading..." : "Change Photo"}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								className="hidden"
								onChange={handleAvatarChange}
								disabled={isUploadingAvatar}
							/>
						</label>
						<p className="text-xs text-neutral-500 mt-2">
							Recommended: Square image, max 5MB, JPG, PNG, or WebP.
						</p>
					</div>
				</div>
			</Card>

			{/* ---------- BASIC INFO SECTION ---------- */}
			<Card className="bg-[#0D0D0D] border border-white/10 p-8 rounded-2xl shadow-xl">
				<h2 className="text-2xl font-semibold text-white mb-8">
					Profile Information
				</h2>

				<div className="space-y-6">
					{/* NAME */}
					<div className="space-y-2">
						<Label className="text-neutral-400 text-sm">Name</Label>
						<Input
							className="bg-[#0A0A0A] border-white/10 text-white focus:ring-2 focus:ring-blue-600/50"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					{/* EMAIL */}
					<div className="space-y-2">
						<Label className="text-neutral-400 text-sm">Email</Label>
						<Input
							className="bg-[#0A0A0A] border-white/10 text-white focus:ring-2 focus:ring-blue-600/50"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<p className="text-xs text-neutral-500">
							Updating your email may require re-verification.
						</p>
					</div>

					<div className="pt-4 space-x-5">
						<Button
							onClick={saveName}
							disabled={isPending}
							className="w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl space-x-5"
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Save Name"
							)}
						</Button>

						<Button
							onClick={saveEmail}
							disabled={isPending}
							className="w-auto mr-2 bg-[#1A1A1A] hover:bg-[#222] text-white border border-white/10 font-medium py-2.5 rounded-xl"
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Update Email"
							)}
						</Button>
					</div>
				</div>
			</Card>

			{/* ---------- COMPANY INFO (READ ONLY) ---------- */}
			<Card className="bg-[#111] border-white/10 p-6 rounded-2xl">
				<h2 className="text-xl font-semibold text-white mb-4">Company Info</h2>

				<p className="text-neutral-300 font-medium">{company.name}</p>
				{company.address && (
					<p className="text-neutral-500 text-sm mt-1">{company.address}</p>
				)}
			</Card>

			{/* ---------- PASSWORD SECTION ---------- */}
			<Card className="bg-[#111] border-white/10 p-6 rounded-2xl">
				<h2 className="text-xl font-semibold text-white mb-6">
					Change Password
				</h2>

				<div className="space-y-4">
					<div>
						<Label className="text-neutral-400">Current Password</Label>
						<Input
							type="password"
							className="bg-black border-white/10 text-white"
							value={currentPw}
							onChange={(e) => setCurrentPw(e.target.value)}
						/>
					</div>

					<div>
						<Label className="text-neutral-400">New Password</Label>
						<Input
							type="password"
							className="bg-black border-white/10 text-white"
							value={newPw}
							onChange={(e) => setNewPw(e.target.value)}
						/>
					</div>

					<div>
						<Label className="text-neutral-400">Confirm New Password</Label>
						<Input
							type="password"
							className="bg-black border-white/10 text-white"
							value={confirmPw}
							onChange={(e) => setConfirmPw(e.target.value)}
						/>
					</div>

					<Button
						onClick={savePassword}
						disabled={isPending || !currentPw || !newPw || !confirmPw}
						className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
					>
						{isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Update Password"
						)}
					</Button>
				</div>
			</Card>
		</div>
	);
}
