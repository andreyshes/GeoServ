"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/app/components/ui/table";
import { Trash, Pencil, Plus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/app/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/app/components/ui/alert-dialog";
import { Label } from "@/app/components/ui/label";

export default function ServicesSection({
	services,
	newService,
	setNewService,
	addService,
	deleteService,
	editingService,
	setEditingService,
	editForm,
	setEditForm,
	handleEditSubmit,
	isSaving,
}: any) {
	return (
		<div className="rounded-xl border bg-white shadow-sm overflow-hidden">
			{/* HEADER */}
			<div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
				<h2 className="font-semibold text-gray-800">Services</h2>
				<span className="text-sm text-gray-400">
					{services.length} service{services.length !== 1 && "s"}
				</span>
			</div>

			{/* ADD */}
			<div className="p-4 border-b flex flex-wrap gap-2">
				<Input
					placeholder="Service name"
					value={newService.name}
					onChange={(e) =>
						setNewService({ ...newService, name: e.target.value })
					}
					className="w-48"
				/>
				<Input
					placeholder="Price ($)"
					value={newService.price}
					type="number"
					onChange={(e) =>
						setNewService({ ...newService, price: e.target.value })
					}
					className="w-32"
				/>
				<Input
					placeholder="Duration"
					value={newService.durationText}
					onChange={(e) =>
						setNewService({ ...newService, durationText: e.target.value })
					}
					className="w-32"
				/>
				<Button onClick={addService}>
					<Plus className="w-4 h-4" /> Add
				</Button>
			</div>

			{/* LIST */}
			<Table>
				<TableHeader>
					<TableRow className="bg-gray-50">
						<TableHead>Name</TableHead>
						<TableHead>Price</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead></TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{services.map((s: any) => (
						<TableRow key={s.id}>
							<TableCell className="font-medium">{s.name}</TableCell>
							<TableCell>${(s.priceCents ?? 0) / 100}</TableCell>
							<TableCell>{s.durationText || "-"}</TableCell>

							<TableCell className="flex gap-2 justify-end">
								{/* DELETE */}
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="hover:bg-red-100"
										>
											<Trash className="w-4 h-4 text-red-500" />
										</Button>
									</AlertDialogTrigger>

									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete Service</AlertDialogTitle>
											<AlertDialogDescription>
												Are you sure you want to delete{" "}
												<strong>{s.name}</strong>? This cannot be undone.
											</AlertDialogDescription>
										</AlertDialogHeader>

										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => deleteService(s.id)}
												className="bg-red-600 text-white hover:bg-red-700"
											>
												Delete
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>

								{/* EDIT */}
								<Dialog
									open={editingService?.id === s.id}
									onOpenChange={(open) => {
										if (open) {
											setEditingService(s);
											setEditForm({
												name: s.name,
												price: (s.priceCents ?? 0) / 100 + "",
												duration: s.durationText || "",
											});
										} else {
											setEditingService(null);
										}
									}}
								>
									<DialogTrigger asChild>
										<Button variant="ghost" size="icon">
											<Pencil className="w-4 h-4 text-blue-500" />
										</Button>
									</DialogTrigger>

									<DialogContent>
										<DialogHeader>
											<DialogTitle>Edit Service</DialogTitle>
										</DialogHeader>

										<div className="space-y-3">
											<div>
												<Label>Name</Label>
												<Input
													value={editForm.name}
													onChange={(e) =>
														setEditForm({ ...editForm, name: e.target.value })
													}
												/>
											</div>

											<div>
												<Label>Price ($)</Label>
												<Input
													type="number"
													value={editForm.price}
													onChange={(e) =>
														setEditForm({ ...editForm, price: e.target.value })
													}
												/>
											</div>

											<div>
												<Label>Duration</Label>
												<Input
													value={editForm.duration}
													onChange={(e) =>
														setEditForm({
															...editForm,
															duration: e.target.value,
														})
													}
												/>
											</div>
										</div>

										<DialogFooter>
											<Button
												onClick={handleEditSubmit}
												disabled={isSaving}
												className="hover:bg-blue-400 hover:text-white"
											>
												{isSaving ? "Saving..." : "Save Changes"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
