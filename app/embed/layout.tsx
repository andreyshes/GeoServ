export default function EmbedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					padding: 0,
					background: "white",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
				}}
			>
				{children}
			</body>
		</html>
	);
}
