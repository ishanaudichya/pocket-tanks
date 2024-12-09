import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6f3ff] to-[#d4e9ff] relative">
      {/* Keep only the heart pattern background */}
      <div className="heart-pattern"></div>

      {/* Main content wrapper */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
        <main className="flex flex-col items-center gap-8 text-center">
          {/* Title Section */}
          <div className="floating">
            <h1 className="text-4xl sm:text-6xl font-bold text-[#4a9eca] mb-2">
              Sakku Tanks 🎮
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 italic">
              "Because relationship is a battle with u...  💕"
            </p>
          </div>

          {/* Game Join Section */}
          <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Link 
                  href="/ishan" 
                  className="flex-1 bg-[#89cff0] hover:bg-[#4a9eca] text-white font-bold py-2 px-4 rounded-full transition-colors text-center"
                >
                  Join as Ishan
                </Link>
                <Link 
                  href="/sakshi" 
                  className="flex-1 bg-[#89cff0] hover:bg-[#4a9eca] text-white font-bold py-2 px-4 rounded-full transition-colors text-center"
                >
                  Join as Sakshi
                </Link>
              </div>
            </div>
          </div>

          {/* Cute Rules Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mt-8 max-w-md">
            <h2 className="text-2xl font-bold text-[#4a9eca] mb-4">Rules of Love & War 💘</h2>
            <ul className="text-left space-y-3">
              <li className="flex items-center gap-2">
                <span className="text-pink-400">❤️</span>
                <span className="text-gray-700">No cheating by saying "Love you puchhu" to distract!</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-pink-400">🎀</span>
                <span className="text-gray-700">Cute agression is allowed (and encouraged!)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-pink-400">🌟</span>
                <span className="text-gray-700">Looser(usually sakku) should buy the other ice cream!</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-pink-400">🎮</span>
                <span className="text-gray-700">Loser has to send cute selfies (boobies)!</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-sm text-gray-600">
            <p>Made with 💖 for Sakku</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
