import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<div className=" bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-zinc-900 dark:to-purple-950 flex items-center justify-center p-4">
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
