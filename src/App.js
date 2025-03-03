import React, { useState, useEffect } from 'react';

const ResultsEntry = () => {
  const [step, setStep] = useState(1);
  const [results, setResults] = useState({
    firstRound: {},
    semifinals: {},
    conferenceFinals: {},
    finals: {}
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [semiFinalTeams, setSemiFinalTeams] = useState({ east: [], west: [] });
  const [confFinalTeams, setConfFinalTeams] = useState({ east: [], west: [] });

  const eastTeams = ['Celtics', 'Bucks', '76ers', 'Heat', 'Knicks', 'Cavaliers', 'Nets', 'Hawks'];
  const westTeams = ['Nuggets', 'Suns', 'Warriors', 'Lakers', 'Clippers', 'Grizzlies', 'Mavericks', 'Kings'];

  const handleResult = (round, matchupId, field, value) => {
    setResults(prev => ({
      ...prev,
      [round]: {
        ...prev[round],
        [matchupId]: {
          ...(prev[round][matchupId] || {}),
          [field]: value
        }
      }
    }));
    setError('');
  };

  const saveResultsToDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://nba-playoff-predictor.onrender.com/api/results', { // Replace with your actual backend URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      setStep(5);
    } catch (err) {
      setError(`Failed to save results: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step >= 2) {
      const eastWinners = Object.entries(results.firstRound)
        .filter(([key, value]) => key.startsWith('east') && value.winner)
        .map(([, value]) => value.winner);
      const westWinners = Object.entries(results.firstRound)
        .filter(([key, value]) => key.startsWith('west') && value.winner)
        .map(([, value]) => value.winner);
      setSemiFinalTeams({
        east: eastWinners.length === 4 ? eastWinners : eastWinners.concat(Array(4 - eastWinners.length).fill('TBD')),
        west: westWinners.length === 4 ? westWinners : westWinners.concat(Array(4 - westWinners.length).fill('TBD'))
      });
    }
    if (step >= 3) {
      const eastConfWinners = Object.entries(results.semifinals)
        .filter(([key, value]) => key.startsWith('east') && value.winner)
        .map(([, value]) => value.winner);
      const westConfWinners = Object.entries(results.semifinals)
        .filter(([key, value]) => key.startsWith('west') && value.winner)
        .map(([, value]) => value.winner);
      setConfFinalTeams({
        east: eastConfWinners.length === 2 ? eastConfWinners : eastConfWinners.concat(Array(2 - eastConfWinners.length).fill('TBD')),
        west: westConfWinners.length === 2 ? westConfWinners : westConfWinners.concat(Array(2 - westConfWinners.length).fill('TBD'))
      });
    }
  }, [results, step]);

  const Matchup = ({ teams, round, matchupId, tooltip }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`/${teams[0].toLowerCase()}.png`} alt={`${teams[0]} logo`} className="w-8 h-8" onError={(e) => (e.target.src = '/placeholder-logo.png')} />
          <span className="font-medium">{teams[0]}</span>
        </div>
        <span className="text-gray-500">vs</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{teams[1]}</span>
          <img src={`/${teams[1].toLowerCase()}.png`} alt={`${teams[1]} logo`} className="w-8 h-8" onError={(e) => (e.target.src = '/placeholder-logo.png')} />
        </div>
      </div>
      <select className="mt-2 p-2 rounded w-full border" value={results[round][matchupId]?.winner || ''} onChange={(e) => handleResult(round, matchupId, 'winner', e.target.value)}>
        <option value="">Select Winner</option>
        {teams.map(team => <option key={team} value={team}>{team}</option>)}
      </select>
      <select className="mt-4 p-2 rounded w-full border" value={results[round][matchupId]?.games || ''} onChange={(e) => handleResult(round, matchupId, 'games', e.target.value)} disabled={!results[round][matchupId]?.winner}>
        <option value="">Select Games</option>
        <option value="4-0">4-0</option>
        <option value="4-1">4-1</option>
        <option value="4-2">4-2</option>
        <option value="4-3">4-3</option>
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(step / 5) * 100}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Step {step} of 5</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">First Round Results</h2>
            <h3 className="font-semibold mb-2">Eastern Conference</h3>
            {Array(4).fill().map((_, i) => (
              <Matchup key={`east-${i}`} teams={[eastTeams[i], eastTeams[7-i]]} round="firstRound" matchupId={`east-${i}`} tooltip="Enter the result" />
            ))}
            <h3 className="font-semibold mb-2 mt-4">Western Conference</h3>
            {Array(4).fill().map((_, i) => (
              <Matchup key={`west-${i}`} teams={[westTeams[i], westTeams[7-i]]} round="firstRound" matchupId={`west-${i}`} tooltip="Enter the result" />
            ))}
            <button onClick={() => setStep(2)} className="mt-6 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Conference Semifinals Results</h2>
            <h3 className="font-semibold mb-2">Eastern Conference</h3>
            {Array(2).fill().map((_, i) => (
              <Matchup 
                key={`east-semi-${i}`} 
                teams={[semiFinalTeams.east[i*2] || 'TBD', semiFinalTeams.east[i*2+1] || 'TBD']} 
                round="semifinals" 
                matchupId={`east-semi-${i}`} 
                tooltip="Enter the result" 
              />
            ))}
            <h3 className="font-semibold mb-2 mt-4">Western Conference</h3>
            {Array(2).fill().map((_, i) => (
              <Matchup 
                key={`west-semi-${i}`} 
                teams={[semiFinalTeams.west[i*2] || 'TBD', semiFinalTeams.west[i*2+1] || 'TBD']} 
                round="semifinals" 
                matchupId={`west-semi-${i}`} 
                tooltip="Enter the result" 
              />
            ))}
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(1)} className="p-2 bg-gray-300 rounded">Previous</button>
              <button onClick={() => setStep(3)} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Conference Finals Results</h2>
            <h3 className="font-semibold mb-2">Eastern Conference</h3>
            <Matchup 
              teams={[confFinalTeams.east[0] || 'TBD', confFinalTeams.east[1] || 'TBD']} 
              round="conferenceFinals" 
              matchupId="east-final" 
              tooltip="Enter the result" 
            />
            <h3 className="font-semibold mb-2 mt-4">Western Conference</h3>
            <Matchup 
              teams={[confFinalTeams.west[0] || 'TBD', confFinalTeams.west[1] || 'TBD']} 
              round="conferenceFinals" 
              matchupId="west-final" 
              tooltip="Enter the result" 
            />
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(2)} className="p-2 bg-gray-300 rounded">Previous</button>
              <button onClick={() => setStep(4)} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">NBA Finals Results</h2>
            <Matchup 
              teams={[
                results.conferenceFinals['east-final']?.winner || 'TBD',
                results.conferenceFinals['west-final']?.winner || 'TBD'
              ]} 
              round="finals" 
              matchupId="finals" 
              tooltip="Enter the result" 
            />
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(3)} className="p-2 bg-gray-300 rounded">Previous</button>
              <button onClick={saveResultsToDatabase} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Results'}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Results Submitted</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(results, null, 2)}</pre>
            <button onClick={() => setStep(1)} className="mt-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Start Over</button>
          </div>
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default ResultsEntry;
