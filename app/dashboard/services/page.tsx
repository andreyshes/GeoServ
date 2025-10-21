"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	TableHead,
} from "@/app/components/ui/table";
import { Input } from "@/app/components/ui/input";
import { Plus, Trash } from "lucide-react";

interface Service {
	id: string;
	name: string;
	priceCents: number | null;
	durationMinutes: number | null;
}

export default function ServicesPage({ companyId }: { companyId: string }) {
	const [services, setServices] = useState<Service[]>([]);
	const [newService, setNewService] = useState({
		name: "",
		price: "",
		durationText: "",
	});

	async function fetchServices() {
		const res = await fetch(`/api/company/${companyId}/services`);
		const data = await res.json();
		setServices(data.services || []);
	}

	useEffect(() => {
		fetchServices();
	}, [companyId]);

	async function addService() {
		if (!newService.name.trim()) return;
		await fetch(`/api/company/${companyId}/services`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: newService.name,
				priceCents: parseInt(newService.price) * 100,
				durationText: newService.durationText || "",
			}),
		});
		setNewService({ name: "", price: "", durationText: "" });
		fetchServices();
	}

	async function deleteService(id: string) {
		await fetch(`/api/company/${companyId}/services/${id}`, {
			method: "DELETE",
		});
		fetchServices();
	}

	return (
		<div className="max-w-4xl mx-auto pt-24 px-6 pb-16">
			<h1 className="text-3xl font-bold mb-6">Services</h1>

			<div className="flex gap-2 mb-8">
				<Input
					placeholder="Service name"
					value={newService.name}
					onChange={(e) =>
						setNewService({ ...newService, name: e.target.value })
					}
				/>
				<Input
					placeholder="Price ($)"
					type="number"
					value={newService.price}
					onChange={(e) =>
						setNewService({ ...newService, price: e.target.value })
					}
				/>
				<Input
					placeholder="Duration (min)"
					type="number"
					value={newService.durationText}
					onChange={(e) =>
						setNewService({ ...newService, durationText: e.target.value })
					}
				/>
				<Button onClick={addService}>
					<Plus className="w-4 h-4" />
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Price</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{services.map((s) => (
						<TableRow key={s.id}>
							<TableCell>{s.name}</TableCell>
							<TableCell>${(s.priceCents ?? 0) / 100}</TableCell>
							<TableCell>{s.durationMinutes} min</TableCell>
							<TableCell>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => deleteService(s.id)}
								>
									<Trash className="w-4 h-4 text-red-500" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
