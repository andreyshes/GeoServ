export default function EmbedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="w-full min-h-screen bg-white">{children}</div>;
}
