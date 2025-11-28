export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#C4A962] to-[#F4E4C1] bg-clip-text text-transparent">
            How It Works
          </h1>
          <p className="text-xl text-gray-400">
            Everything you need to know about chess ratings, staying active, and not becoming a couch potato
          </p>
        </div>

        {/* What Is This? */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#C4A962]">🎯 What Is This Thing?</h2>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-300 text-lg mb-4">
              Welcome to the OWT Swiss Chess Elo Tracker! This is where we keep track of who's crushing it at chess and who's... well, not.
            </p>
            <p className="text-gray-300 text-lg">
              Every match you play affects your Elo rating - a number that represents your chess skill. Win against strong opponents? Big gains.
              Lose to someone with a lower rating? Ouch. The system is fair, mathematical, and completely merciless.
            </p>
          </div>
        </section>

        {/* How Elo Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#C4A962]">📊 How Does Elo Work?</h2>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-[#F4E4C1]">The Basics</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Everyone starts at <strong className="text-white">1200 Elo</strong> - perfectly average, like ordering vanilla ice cream</li>
                <li>• Win a match? Your rating goes up 📈</li>
                <li>• Lose a match? Your rating goes down 📉</li>
                <li>• Draw? Everyone gets a tiny adjustment</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-[#F4E4C1]">The Magic Formula</h3>
              <p className="text-gray-300 mb-3">
                The Elo system isn't just random - it's based on <em>expectations</em>. Here's how it works:
              </p>
              <div className="bg-[#0A0A0A] border border-gray-700 rounded p-4 mb-3">
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">Expected Score</strong> = 1 / (1 + 10<sup>((Opponent Elo - Your Elo) / 400)</sup>)
                </p>
                <p className="text-gray-300">
                  <strong className="text-white">New Elo</strong> = Old Elo + K × (Actual Score - Expected Score)
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  (K-factor = 32, which controls how volatile ratings are)
                </p>
              </div>
              <p className="text-gray-300">
                Translation: Beat someone way stronger than you? <strong className="text-green-400">Massive points</strong>.
                Beat someone weaker? <strong className="text-yellow-400">Meh, a few points</strong>.
                Lose to someone weaker? <strong className="text-red-400">Big oof</strong>.
              </p>
            </div>

            <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] border border-[#C4A962]/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-[#C4A962]">Example Time!</h4>
              <p className="text-gray-300 mb-2">
                You (1300 Elo) beat someone at 1500 Elo:
              </p>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>• Expected: You had only a 24% chance to win</li>
                <li>• You proved everyone wrong! 🎉</li>
                <li>• Reward: ~+24 Elo points</li>
                <li>• Your opponent loses about the same amount</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Decay System */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#C4A962]">⏰ The Decay System (Use It or Lose It)</h2>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-lg font-semibold mb-2">
                ⚠️ Warning: Couch potatoes not welcome!
              </p>
              <p className="text-red-200/80">
                This isn't a retirement fund for your rating. If you don't play, you lose points. That's the rule.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-[#F4E4C1]">How Decay Works</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-white">7 days</strong> of not playing? Time starts ticking ⏱️</li>
                <li>• <strong className="text-white">5 points lost</strong> per week of inactivity</li>
                <li>• Every <strong className="text-white">Friday at 6 PM UTC</strong>, the decay hammer drops 🔨</li>
                <li>• Your rating never goes below the lowest active player (we're not monsters)</li>
                <li>• Already at minimum? You're safe... for now</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-[#F4E4C1]">Decay Math</h3>
              <div className="bg-[#0A0A0A] border border-gray-700 rounded p-4 mb-3">
                <p className="text-gray-300 mb-2">
                  Inactive Periods = (Days Since Last Match - 7) / 7
                </p>
                <p className="text-gray-300">
                  Total Decay = (Inactive Periods + 1) × 5 points
                </p>
              </div>
              <div className="space-y-2 text-gray-300">
                <p>• 10 days inactive: <strong className="text-yellow-400">-5 points</strong></p>
                <p>• 17 days inactive: <strong className="text-orange-400">-10 points</strong></p>
                <p>• 24 days inactive: <strong className="text-red-400">-15 points</strong></p>
                <p className="text-sm text-gray-400 mt-2">
                  (See the pattern? Play chess or watch your rating evaporate like morning dew)
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] border border-[#C4A962]/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-[#C4A962]">Why Does Decay Exist?</h4>
              <p className="text-gray-300">
                Simple: ratings should reflect <em>current</em> skill, not ancient glory. If you're not playing,
                your skills get rusty. The decay system keeps ratings accurate and prevents people from camping
                at the top of the leaderboard while hiding under their desk.
              </p>
            </div>
          </div>
        </section>

        {/* Activity Bonus */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#C4A962]">🎁 Activity Bonus (Free Points? Yes Please!)</h2>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
            <div className="bg-green-950/30 border border-green-800/50 rounded-lg p-4 mb-6">
              <p className="text-green-200 text-lg font-semibold mb-2">
                ✨ Good news: Active players get rewarded!
              </p>
              <p className="text-green-200/80">
                All those points that decay away from inactive players? They don't disappear - they go to YOU.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-[#F4E4C1]">How It Works</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Play at least once every <strong className="text-white">7 days</strong> = you're active 🎮</li>
                <li>• Every Friday, all decay points are collected in a big pot 🍯</li>
                <li>• That pot is split equally among all active players</li>
                <li>• Maximum bonus: <strong className="text-white">+5 points per week</strong></li>
                <li>• It happens automatically - you don't need to do anything!</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-[#F4E4C1]">The Math</h3>
              <div className="bg-[#0A0A0A] border border-gray-700 rounded p-4 mb-3">
                <p className="text-gray-300">
                  Your Bonus = min(5, Total Decay Points / Number of Active Players)
                </p>
              </div>
              <div className="space-y-2 text-gray-300">
                <p>• 100 points decayed, 20 active players: Everyone gets <strong className="text-green-400">+5 points</strong></p>
                <p>• 40 points decayed, 20 active players: Everyone gets <strong className="text-green-400">+2 points</strong></p>
                <p>• 200 points decayed, 10 active players: Everyone gets <strong className="text-green-400">+5 points</strong> (capped!)</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] border border-[#C4A962]/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-[#C4A962]">Zero-Sum Economics</h4>
              <p className="text-gray-300">
                This is a <strong className="text-white">zero-sum system</strong> - no points are created or destroyed.
                When inactive players lose points through decay, active players gain those exact same points through bonuses.
                The total Elo in the system always stays the same. It's like Robin Hood, but for chess ratings.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#C4A962]">⚡ Quick Facts</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">🎬</div>
              <h3 className="font-semibold mb-1 text-white">Starting Elo</h3>
              <p className="text-gray-400">Everyone begins at 1200</p>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">🔢</div>
              <h3 className="font-semibold mb-1 text-white">K-Factor</h3>
              <p className="text-gray-400">32 (moderate volatility)</p>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-semibold mb-1 text-white">Inactivity Threshold</h3>
              <p className="text-gray-400">7 days without playing</p>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">📉</div>
              <h3 className="font-semibold mb-1 text-white">Decay Rate</h3>
              <p className="text-gray-400">5 points per week</p>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold mb-1 text-white">Max Activity Bonus</h3>
              <p className="text-gray-400">5 points per week</p>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="font-semibold mb-1 text-white">Decay Schedule</h3>
              <p className="text-gray-400">Every Friday, 6 PM UTC</p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#C4A962]">💡 Pro Tips</h2>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-[#C4A962] mr-2">→</span>
                <span><strong className="text-white">Play regularly:</strong> One match per week keeps the decay away (and gives you free bonus points)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C4A962] mr-2">→</span>
                <span><strong className="text-white">Challenge stronger players:</strong> Bigger risk, bigger reward. Calculated bravery pays off</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C4A962] mr-2">→</span>
                <span><strong className="text-white">Don't fear losses:</strong> Every match gives you data. Losing to someone stronger doesn't hurt much</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C4A962] mr-2">→</span>
                <span><strong className="text-white">Track your progress:</strong> Check your player page to see your Elo graph over time</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C4A962] mr-2">→</span>
                <span><strong className="text-white">Stay active:</strong> The system rewards consistency. Weekly activity bonuses add up!</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Back Button */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-[#C4A962] hover:bg-[#F4E4C1] text-[#0A0A0A] font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
