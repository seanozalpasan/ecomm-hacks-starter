import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { GameList } from "./game-list";

export default async function DashboardPage() {
	const user = await currentUser();

	// Redirect to sign-in if not authenticated
	if (!user) {
		redirect("/sign-in");
	}

	return (
		<div className=" bg-white">
			{/* Header */}
			<header className="flex justify-between items-center p-4">
				<Logo />
				<div className="flex items-center gap-3">
					<Link
						href="/create"
						className="px-4 py-2 border-2 border-gray-900 rounded-full bg-white text-gray-900 font-medium hover:bg-gray-50 transition"
					>
						Add
					</Link>
					<span className="text-gray-900 font-medium">
						{user.firstName || user.emailAddresses[0].emailAddress}
					</span>
					<UserButton afterSignOutUrl="/" />
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-2xl mx-auto px-4 py-8">
				{/* Title */}
				<h1 className="text-4xl font-bold text-center mb-8">Unwrappd</h1>

				{/* Game List */}
				<GameList />

				{/* Previous Link */}
				<div className="mt-8">
					<button
						type="button"
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
					>
						<span>Previous</span>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<path
								d="M4 6l4 4 4-4"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>
			</main>
		</div>
	);
}

// make a new game
// central view: shows you all the games you are a part of
//when a user clicks a game:
// there are two possible views
// 1.) if you are a participant: shows the spinning wheel
// 2.) if you are an author: you see a more advanced panel
// at the advanced panel: (on the left side): list of all users
// bottom of the left side: you can invite new people
// top right: fields to edit the price limit, deadline, you can edit the deadline, edit status (opened / closed) game [drop-down menu (active / cancelled / pending)]
// top right: field to enter category of gift
// bottom right: button to match the people / create group
// when you click into a game:
