import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<div className="flex items-center justify-center p-4 min-h-screen">
			<SignUp
				forceRedirectUrl="/onboarding"
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
