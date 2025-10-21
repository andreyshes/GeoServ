"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
	<DropdownMenuPrimitive.Portal>
		<DropdownMenuPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"z-50 min-w-[10rem] rounded-xl border border-neutral-200 bg-white p-2 shadow-xl",
				"data-[side=bottom]:animate-slideDown data-[side=top]:animate-slideUp",
				className
			)}
			{...props}
		/>
	</DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuLabel = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Label
		ref={ref}
		className={cn(
			"px-2 py-1.5 text-sm font-medium text-neutral-500",
			className
		)}
		{...props}
	/>
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// Separator line
const DropdownMenuSeparator = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<DropdownMenuPrimitive.Separator
		ref={ref}
		className={cn("my-2 h-px bg-neutral-200", className)}
		{...props}
	/>
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenuPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition",
			"text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100",
			inset && "pl-8",
			className
		)}
		{...props}
	/>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
};
