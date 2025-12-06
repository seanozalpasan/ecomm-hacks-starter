import Image from "next/image";

export function Logo({ size = 64 }: { size?: number }) {
	return (
		<div className="flex items-center gap-2">
			<Image src="/logo.png" alt="Logo" width={size} height={size} />
		</div>
	);
}
