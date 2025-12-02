"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export type Service = {
	id: string;
	name: string;
	priceCents: number | null;
	durationText: string | null;
};

export default function useServices(companyId: string) {
	const [services, setServices] = useState<Service[]>([]);
	const [newService, setNewService] = useState({
		name: "",
		price: "",
		durationText: "",
	});

	const [editingService, setEditingService] = useState<Service | null>(null);

	const [editForm, setEditForm] = useState({
		name: "",
		price: "",
		duration: "",
	});

	const [isSaving, setIsSaving] = useState(false);

	/** ⬇ Fetch all services */
	async function fetchServices() {
		try {
			const res = await fetch(`/api/company/${companyId}/services`);
			const data = await res.json();
			setServices(data.services || []);
		} catch (err) {
			toast.error("Failed to load services");
		}
	}

	/** ⬇ Add new service */
	async function addService() {
		try {
			if (!newService.name.trim()) {
				toast.error("Service name required");
				return;
			}

			await fetch(`/api/company/${companyId}/services`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newService.name,
					priceCents: parseInt(newService.price || "0") * 100,
					durationText: newService.durationText,
				}),
			});

			toast.success("Service added");
			setNewService({ name: "", price: "", durationText: "" });
			fetchServices();
		} catch {
			toast.error("Failed to add service");
		}
	}

	/** ⬇ Delete service */
	async function deleteService(id: string) {
		try {
			const res = await fetch(`/api/company/${companyId}/services/${id}`, {
				method: "DELETE",
			});

			if (!res.ok) throw new Error();

			toast.success("Service deleted");
			setServices((prev) => prev.filter((s) => s.id !== id));
		} catch {
			toast.error("Failed to delete service");
		}
	}

	/** ⬇ Edit service */
	async function handleEditSubmit() {
		if (!editingService) return;
		setIsSaving(true);

		try {
			await fetch(`/api/company/${companyId}/services/${editingService.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: editForm.name,
					priceCents: parseInt(editForm.price || "0") * 100,
					durationText: editForm.duration,
				}),
			});

			toast.success("Service updated");

			setEditingService(null);
			fetchServices();
		} catch {
			toast.error("Failed to update service");
		} finally {
			setIsSaving(false);
		}
	}

	useEffect(() => {
		fetchServices();
	}, [companyId]);

	return {
		services,
		newService,
		setNewService,
		editingService,
		setEditingService,
		editForm,
		setEditForm,
		addService,
		deleteService,
		handleEditSubmit,
		isSaving,
	};
}
