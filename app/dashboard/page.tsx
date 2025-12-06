import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { GameDropdowns } from './game-dropdowns'

export default async function DashboardPage() {
  const user = await currentUser()
  
  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">My Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome, {user.firstName || 'User'}!
          </h2>
          <p className="text-gray-600">
            Email: {user.emailAddresses[0].emailAddress}
          </p>
        </div>

        {/* Game Dropdowns Component */}
        <GameDropdowns />
      </main>
    </div>
  )
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
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