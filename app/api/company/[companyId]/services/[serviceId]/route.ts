import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ companyId: string; serviceId: string }> }
) {
	try {
		const { companyId, serviceId } = await context.params;
		const body = await req.json();

		const hasName = Object.prototype.hasOwnProperty.call(body, "name");
		const hasPrice = Object.prototype.hasOwnProperty.call(body, "priceCents");
		const hasDuration =
			Object.prototype.hasOwnProperty.call(body, "durationText");

		if (!hasName && !hasPrice && !hasDuration) {
			return NextResponse.json(
				{ error: "No fields provided for update" },
				{ status: 400 }
			);
		}

		const data: Record<string, any> = {};

		if (hasName) {
			if (typeof body.name !== "string" || !body.name.trim()) {
				return NextResponse.json(
					{ error: "Service name must be a non-empty string" },
					{ status: 400 }
				);
			}
			data.name = body.name.trim();
		}

		if (hasPrice) {
			if (body.priceCents === null || body.priceCents === "") {
				data.priceCents = null;
			} else {
				const parsedPrice =
					typeof body.priceCents === "number"
						? body.priceCents
						: parseInt(body.priceCents, 10);

				if (!Number.isFinite(parsedPrice)) {
					return NextResponse.json(
						{ error: "priceCents must be a number" },
						{ status: 400 }
					);
				}

				data.priceCents = parsedPrice;
			}
		}

		if (hasDuration) {
			if (body.durationText === null || body.durationText === "") {
				data.durationText = null;
			} else if (typeof body.durationText === "string") {
				data.durationText = body.durationText.trim();
			} else {
				return NextResponse.json(
					{ error: "durationText must be a string" },
					{ status: 400 }
				);
			}
		}

		const service = await db.service.update({
			where: { id: serviceId, companyId },
			data,
			select: {
				id: true,
				name: true,
				priceCents: true,
				durationText: true,
			},
		});

		return NextResponse.json({ success: true, service });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025") {
				return NextResponse.json(
					{ error: "Service not found" },
					{ status: 404 }
				);
			}
		}

		console.error("❌ Error updating service:", error);
		return NextResponse.json(
			{ error: "Failed to update service" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_req: Request,
	context: { params: Promise<{ companyId: string; serviceId: string }> }
) {
	try {
		const { companyId, serviceId } = await context.params;

		await db.service.delete({
			where: { id: serviceId, companyId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("❌ Error deleting service:", error);
		return NextResponse.json(
			{ error: "Failed to delete service" },
			{ status: 500 }
		);
	}
}
