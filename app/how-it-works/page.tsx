import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-custom-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-almost-black">
            How It Works
          </h1>
          <p className="text-xl text-gray-custom-600">
            Everything you need to know about chess ratings, staying active, and not becoming a couch potato
          </p>
        </div>

        {/* What Is This? */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-red">🎯 What Is This Thing?</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
            <p className="text-gray-custom-700 text-lg mb-4">
              Welcome to the OWT Swiss Chess Elo Tracker! This is where we keep track of who&apos;s crushing it at chess and who&apos;s... well, not.
            </p>
            <p className="text-gray-custom-700 text-lg">
              Every match you play affects your Elo rating - a number that represents your chess skill. Win against strong opponents? Big gains.
              Lose to someone with a lower rating? Ouch. The system is fair, mathematical, and completely merciless.
            </p>
          </div>
        </section>

        {/* How Elo Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-red">📊 How Does Elo Work?</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-almost-black">The Basics</h3>
              <ul className="space-y-2 text-gray-custom-700">
                <li>• Everyone starts at <strong className="text-brand-red">1200 Elo</strong> - perfectly average, like ordering vanilla ice cream</li>
                <li>• Win a match? Your rating goes up 📈</li>
                <li>• Lose a match? Your rating goes down 📉</li>
                <li>• Draw? Everyone gets a tiny adjustment</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-almost-black">The Magic Formula</h3>
              <p className="text-gray-custom-700 mb-3">
                The Elo system isn&apos;t just random - it&apos;s based on <em>expectations</em>. Here&apos;s how it works:
              </p>
              <div className="bg-gray-custom-50 border border-gray-custom-300 rounded p-4 mb-3">
                <p className="text-gray-custom-700 mb-2">
                  <strong className="text-almost-black">Expected Score</strong> = 1 / (1 + 10<sup>((Opponent Elo - Your Elo) / 400)</sup>)
                </p>
                <p className="text-gray-custom-700">
                  <strong className="text-almost-black">New Elo</strong> = Old Elo + K × (Actual Score - Expected Score)
                </p>
                <p className="text-gray-custom-600 text-sm mt-2">
                  (K-factor = 32, which controls how volatile ratings are)
                </p>
              </div>
              <p className="text-gray-custom-700">
                Translation: Beat someone way stronger than you? <strong className="text-green-600">Massive points</strong>.
                Beat someone weaker? <strong className="text-yellow-600">Meh, a few points</strong>.
                Lose to someone weaker? <strong className="text-brand-red">Big oof</strong>.
              </p>
            </div>

            <div className="bg-gradient-to-r from-gray-custom-50 to-gray-custom-100 border border-brand-red/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-brand-red">Example Time!</h4>
              <p className="text-gray-custom-700 mb-2">
                You (1300 Elo) beat someone at 1500 Elo:
              </p>
              <ul className="text-gray-custom-700 space-y-1 ml-4">
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
          <h2 className="text-3xl font-bold mb-4 text-brand-red">⏰ The Decay System (Use It or Lose It)</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-lg font-semibold mb-2">
                ⚠️ Warning: Couch potatoes not welcome!
              </p>
              <p className="text-red-700">
                This isn&apos;t a retirement fund for your rating. If you don&apos;t play, you lose points. That&apos;s the rule.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-almost-black">How Decay Works</h3>
              <ul className="space-y-2 text-gray-custom-700">
                <li>• <strong className="text-almost-black">7 days</strong> of not playing? Time starts ticking ⏱️</li>
                <li>• <strong className="text-almost-black">5 points lost</strong> per week of inactivity</li>
                <li>• Every <strong className="text-almost-black">Friday at 6 PM UTC</strong>, the decay hammer drops 🔨</li>
                <li>• Your rating never goes below the lowest active player (we&apos;re not monsters)</li>
                <li>• Already at minimum? You&apos;re safe... for now</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-almost-black">Decay Math</h3>
              <div className="bg-gray-custom-50 border border-gray-custom-300 rounded p-4 mb-3">
                <p className="text-gray-custom-700 mb-2">
                  Inactive Periods = (Days Since Last Match - 7) / 7
                </p>
                <p className="text-gray-custom-700">
                  Total Decay = (Inactive Periods + 1) × 5 points
                </p>
              </div>
              <div className="space-y-2 text-gray-custom-700">
                <p>• 10 days inactive: <strong className="text-yellow-600">-5 points</strong></p>
                <p>• 17 days inactive: <strong className="text-orange-600">-10 points</strong></p>
                <p>• 24 days inactive: <strong className="text-brand-red">-15 points</strong></p>
                <p className="text-sm text-gray-custom-600 mt-2">
                  (See the pattern? Play chess or watch your rating evaporate like morning dew)
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-custom-50 to-gray-custom-100 border border-brand-red/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-brand-red">Why Does Decay Exist?</h4>
              <p className="text-gray-custom-700">
                Simple: ratings should reflect <em>current</em> skill, not ancient glory. If you&apos;re not playing,
                your skills get rusty. The decay system keeps ratings accurate and prevents people from camping
                at the top of the leaderboard while hiding under their desk.
              </p>
            </div>
          </div>
        </section>

        {/* Activity Bonus */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-red">🎁 Activity Bonus (Free Points? Yes Please!)</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-lg font-semibold mb-2">
                ✨ Good news: Active players get rewarded!
              </p>
              <p className="text-green-700">
                All those points that decay away from inactive players? They don&apos;t disappear - they go to YOU.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-almost-black">How It Works</h3>
              <ul className="space-y-2 text-gray-custom-700">
                <li>• Play at least once every <strong className="text-almost-black">7 days</strong> = you&apos;re active 🎮</li>
                <li>• Every Friday, all decay points are collected in a big pot 🍯</li>
                <li>• That pot is split equally among all active players</li>
                <li>• Maximum bonus: <strong className="text-almost-black">+5 points per week</strong></li>
                <li>• It happens automatically - you don&apos;t need to do anything!</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-almost-black">The Math</h3>
              <div className="bg-gray-custom-50 border border-gray-custom-300 rounded p-4 mb-3">
                <p className="text-gray-custom-700">
                  Your Bonus = min(5, Total Decay Points / Number of Active Players)
                </p>
              </div>
              <div className="space-y-2 text-gray-custom-700">
                <p>• 100 points decayed, 20 active players: Everyone gets <strong className="text-green-600">+5 points</strong></p>
                <p>• 40 points decayed, 20 active players: Everyone gets <strong className="text-green-600">+2 points</strong></p>
                <p>• 200 points decayed, 10 active players: Everyone gets <strong className="text-green-600">+5 points</strong> (capped!)</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-custom-50 to-gray-custom-100 border border-brand-red/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-brand-red">Zero-Sum Economics</h4>
              <p className="text-gray-custom-700">
                This is a <strong className="text-almost-black">zero-sum system</strong> - no points are created or destroyed.
                When inactive players lose points through decay, active players gain those exact same points through bonuses.
                The total Elo in the system always stays the same. It&apos;s like Robin Hood, but for chess ratings.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-red">⚡ Quick Facts</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-4">
              <div className="text-3xl mb-2">🎬</div>
              <h3 className="font-semibold mb-1 text-almost-black">Starting Elo</h3>
              <p className="text-gray-custom-600">Everyone begins at 1200</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-4">
              <div className="text-3xl mb-2">🔢</div>
              <h3 className="font-semibold mb-1 text-almost-black">K-Factor</h3>
              <p className="text-gray-custom-600">32 (moderate volatility)</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-4">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-semibold mb-1 text-almost-black">Inactivity Threshold</h3>
              <p className="text-gray-custom-600">7 days without playing</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-4">
              <div className="text-3xl mb-2">📉</div>
              <h3 className="font-semibold mb-1 text-almost-black">Decay Rate</h3>
              <p className="text-gray-custom-600">5 points per week</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-4">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold mb-1 text-almost-black">Max Activity Bonus</h3>
              <p className="text-gray-custom-600">5 points per week</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-4">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="font-semibold mb-1 text-almost-black">Decay Schedule</h3>
              <p className="text-gray-custom-600">Every Friday, 6 PM UTC</p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-red">💡 Pro Tips</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300 p-6">
            <ul className="space-y-3 text-gray-custom-700">
              <li className="flex items-start">
                <span className="text-brand-red mr-2">→</span>
                <span><strong className="text-almost-black">Play regularly:</strong> One match per week keeps the decay away (and gives you free bonus points)</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-red mr-2">→</span>
                <span><strong className="text-almost-black">Challenge stronger players:</strong> Bigger risk, bigger reward. Calculated bravery pays off</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-red mr-2">→</span>
                <span><strong className="text-almost-black">Don&apos;t fear losses:</strong> Every match gives you data. Losing to someone stronger doesn&apos;t hurt much</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-red mr-2">→</span>
                <span><strong className="text-almost-black">Track your progress:</strong> Check your player page to see your Elo graph over time</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-red mr-2">→</span>
                <span><strong className="text-almost-black">Stay active:</strong> The system rewards consistency. Weekly activity bonuses add up!</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Back Button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-brand-red hover:bg-brand-red-dark text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-sm hover:shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
