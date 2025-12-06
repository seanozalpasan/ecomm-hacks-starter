import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Providers } from "./providers";

const snPro = localFont({
	src: [
		{
			path: "../public/SNPro/SNPro-VariableRegular.woff2",
			weight: "200 900",
			style: "normal",
		},
		{
			path: "../public/SNPro/SNPro-VariableItalic.woff2",
			weight: "200 900",
			style: "italic",
		},
	],
	variable: "--font-sn-pro",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Unwrappd",
	description: "Noel's Gift Exchange",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className={`${snPro.variable} antialiased`}>
					<Providers>{children}</Providers>
					<Toaster
						position="bottom-right"
						richColors
						toastOptions={{
							className: "font-sans",
							style: {
								fontFamily:
									"var(--font-sn-pro), system-ui, -apple-system, sans-serif",
							},
						}}
					/>
				</body>
			</html>
		</ClerkProvider>
	);
}
