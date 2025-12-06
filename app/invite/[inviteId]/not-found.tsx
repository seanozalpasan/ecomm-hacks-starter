import Link from "next/link";

export default function NotFound() {
	return (
		<div className=" bg-white flex items-center justify-center p-4">
			<div className="bg-white rounded-lg p-8 max-w-md text-center">
				<h1 className="text-2xl font-bold mb-4 text-zinc-900">404</h1>
				<h2 className="text-xl font-semibold mb-2 text-zinc-900">
					Invitation Not Found
				</h2>
				<p className="text-zinc-600 mb-6">
					This invitation could not be found or is no longer valid.
				</p>
				<Link
					href="/"
					className="inline-block px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
				>
					Go Home
				</Link>
			</div>
		</div>
	);
}
