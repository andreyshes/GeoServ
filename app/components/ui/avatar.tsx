"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200",
				className
			)}
		>
			{children}
		</div>
	);
}

export function AvatarImage({
	src,
	alt,
	className,
}: {
	src?: string | null;
	alt?: string;
	className?: string;
}) {
	if (!src) return null;

	return (
		<Image
			src={src}
			alt={alt || "Avatar"}
			fill
			className={cn("aspect-square h-full w-full object-cover", className)}
		/>
	);
}

export function AvatarFallback({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex h-full w-full items-center justify-center bg-neutral-300 text-neutral-700 text-sm font-medium",
				className
			)}
		>
			{children}
		</div>
	);
}
