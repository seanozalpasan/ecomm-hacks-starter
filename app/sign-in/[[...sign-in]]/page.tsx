aimport { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<div className="mt-40 bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
			<SignIn
				appearance={{
					elements: {
						rootBox: "mx-auto",
						card: "shadow-lg",
					},
				}}
			/>
		</div>
	);
}
