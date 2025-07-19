// Scoreboard.jsx – compute remaining counts inside
(function(global){
  function Scoreboard({stats,wordTotal,wordUnlocked,phraseTotal,phraseUnlocked,addNewWords,addNewPhrases}){
    const wordRemain=wordTotal-wordUnlocked;
    const phraseRemain=phraseTotal-phraseUnlocked;
    return(
      <div className="flex flex-col gap-1 self-start text-sm">
        <span>Score: <span className="text-green-600 font-bold">{stats.right}</span> ✅ | <span className="text-red-600 font-bold">{stats.wrong}</span> ❌</span>
        <span className="mt-1">Words unlocked: {wordUnlocked} / {wordTotal}</span>
        {wordRemain>0&&<button onClick={addNewWords} className="mt-0.5 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-full shadow text-xs">+ Add {Math.min(20,wordRemain)} words</button>}
        <span className="mt-3">Phrases unlocked: {phraseUnlocked} / {phraseTotal}</span>
        {phraseRemain>0&&<button onClick={addNewPhrases} className="mt-0.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full shadow text-xs">+ Add {Math.min(20,phraseRemain)} phrases</button>}
      </div>
    );
  }
  global.Scoreboard=Scoreboard;
})(window);

