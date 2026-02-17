
// Helper to finding max and holders
const findMaxAndHolders = (
    items: any[],
    getValue: (item: any) => number,
    getLabel: (item: any) => string,
    minThreshold: number = 0
) => {
    let maxVal = -1;
    items.forEach(item => {
        const val = getValue(item);
        if (val > maxVal) maxVal = val;
    });

    if (maxVal <= minThreshold) return null;

    const holders = items.filter(item => getValue(item) === maxVal).map(item => getLabel(item));
    return { value: maxVal, holders: holders.join(', ') };
};

export const calculateAutomaticRecords = (
    allStandings: any[],
    allHistory: any[],
    allTeams: any[],
    allManagers: any[],
    allSeasons: any[],
    allChampions: any[],
    allAwards: any[],
    allTrades: any[]
) => {
    const getTeamName = (id: string) => (allTeams as any[])?.find(t => t.id === id)?.name || 'Desconhecido';
    const getManagerName = (id: string) => (allManagers as any[])?.find(m => m.id === id)?.name || 'Desconhecido';

    // Mappings
    const seasonIdYearMap: Record<string, string> = {};
    (allSeasons as any[])?.forEach(s => seasonIdYearMap[s.id] = s.year);

    const seasonTeamManagerMap: Record<string, string> = {}; // Key: "TeamID-Year" -> ManagerID
    (allHistory as any[])?.forEach(h => {
        if (h.team_id && h.year && h.manager_id) {
            seasonTeamManagerMap[`${h.team_id}-${h.year}`] = h.manager_id;
        }
    });

    const newRecords: any[] = [];

    // --- 1. SPECIAL RECORDS ---
    // Most Trades in a Day
    const tradesByDate: Record<string, number> = {};
    (allTrades as any[])?.forEach((t: any) => {
        if (t.date) {
            const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
            tradesByDate[dateStr] = (tradesByDate[dateStr] || 0) + 1;
        }
    });
    const maxTradesDayRes = findMaxAndHolders(Object.entries(tradesByDate), ([_, c]) => c, ([d, _]) => d);
    if (maxTradesDayRes) {
        newRecords.push({ id: 'most-trades-day', title: 'Mais Trades em um Dia', description: `O mercado quebrou! Foram ${maxTradesDayRes.value} trocas realizadas no dia ${maxTradesDayRes.holders}.`, value: maxTradesDayRes.value, holder: maxTradesDayRes.holders, type: 'TEAM', date: maxTradesDayRes.holders }); // Added date property if needed or parse holder
    }

    // --- 2. TEAM RECORDS (SEASON) ---

    // Temporada com mais trades (League Wide)
    const tradesBySeasonObj: Record<string, number> = {};
    (allStandings as any[])?.forEach(s => {
        const year = seasonIdYearMap[s.season_id] || 'Unknown';
        tradesBySeasonObj[year] = (tradesBySeasonObj[year] || 0) + (Number(s.trades_count) || 0);
    });
    // Divide total trades by 2
    Object.keys(tradesBySeasonObj).forEach(y => {
        tradesBySeasonObj[y] = Math.floor(tradesBySeasonObj[y] / 2);
    });

    const maxTradesSeasonRes = findMaxAndHolders(Object.entries(tradesBySeasonObj), ([_, c]) => c, ([y, _]) => y);
    if (maxTradesSeasonRes) {
        newRecords.push({ id: 'most-trades-season-league', title: 'Temporada com Mais Trades', description: `A temporada ${maxTradesSeasonRes.holders} teve ${maxTradesSeasonRes.value} trocas.`, value: maxTradesSeasonRes.value, holder: maxTradesSeasonRes.holders, type: 'TEAM' });
    }

    // Time com mais vitórias (Season)
    const maxWinsSeasonRes = findMaxAndHolders(
        allStandings || [],
        (s) => Number(s.wins) || 0,
        (s) => `${getTeamName(s.team_id)} (${seasonIdYearMap[s.season_id]})`
    );
    if (maxWinsSeasonRes) {
        newRecords.push({ id: 'most-wins-season-team', title: 'Time com Mais Vitórias (Season)', description: `Dominância! ${maxWinsSeasonRes.holders} com ${maxWinsSeasonRes.value} vitórias.`, value: maxWinsSeasonRes.value, holder: maxWinsSeasonRes.holders, type: 'TEAM' });
    }

    // Time com mais derrotas (Season)
    const maxLossesSeasonRes = findMaxAndHolders(
        allStandings || [],
        (s) => Number(s.losses) || 0,
        (s) => `${getTeamName(s.team_id)} (${seasonIdYearMap[s.season_id]})`
    );
    if (maxLossesSeasonRes) {
        newRecords.push({ id: 'most-losses-season-team', title: 'Time com Mais Derrotas (Season)', description: `Difícil... ${maxLossesSeasonRes.holders} com ${maxLossesSeasonRes.value} derrotas.`, value: maxLossesSeasonRes.value, holder: maxLossesSeasonRes.holders, type: 'TEAM' });
    }

    // --- 3. TEAM RECORDS (TOTAL) ---
    // Prepare Aggregates
    const teamAgg: Record<string, { wins: number, losses: number }> = {};
    (allStandings as any[])?.forEach(s => {
        if (!teamAgg[s.team_id]) teamAgg[s.team_id] = { wins: 0, losses: 0 };
        teamAgg[s.team_id].wins += (Number(s.wins) || 0);
        teamAgg[s.team_id].losses += (Number(s.losses) || 0);
    });

    // Mais Vitórias (Geral)
    const maxWinsTotalTeamRes = findMaxAndHolders(Object.entries(teamAgg), ([_, data]) => data.wins, ([id, _]) => getTeamName(id));
    if (maxWinsTotalTeamRes) newRecords.push({ id: 'most-wins-total-team', title: 'Time Mais Vitorioso (Geral)', description: `Franquia histórica.`, value: maxWinsTotalTeamRes.value, holder: maxWinsTotalTeamRes.holders, type: 'TEAM' });

    // Mais Derrotas (Geral)
    const maxLossesTotalTeamRes = findMaxAndHolders(Object.entries(teamAgg), ([_, data]) => data.losses, ([id, _]) => getTeamName(id));
    if (maxLossesTotalTeamRes) newRecords.push({ id: 'most-losses-total-team', title: 'Time com Mais Derrotas (Geral)', description: `Haja resiliência.`, value: maxLossesTotalTeamRes.value, holder: maxLossesTotalTeamRes.holders, type: 'TEAM' });

    // Mais Títulos (Time)
    const teamTitles: Record<string, number> = {};
    (allChampions as any[])?.forEach(c => { if (c.team_id) teamTitles[c.team_id] = (teamTitles[c.team_id] || 0) + 1; });
    const maxTitlesTeamRes = findMaxAndHolders(Object.entries(teamTitles), ([_, c]) => c, ([id, _]) => getTeamName(id));
    if (maxTitlesTeamRes) newRecords.push({ id: 'most-titles-team', title: 'Time com Mais Títulos', description: `Dinastia.`, value: maxTitlesTeamRes.value, holder: maxTitlesTeamRes.holders, type: 'TEAM' });

    // Mais Vice (Time)
    const teamRunners: Record<string, number> = {};
    (allChampions as any[])?.forEach(c => { if (c.runner_up_team_id) teamRunners[c.runner_up_team_id] = (teamRunners[c.runner_up_team_id] || 0) + 1; });
    const maxRunnersTeamRes = findMaxAndHolders(Object.entries(teamRunners), ([_, c]) => c, ([id, _]) => getTeamName(id));
    if (maxRunnersTeamRes) newRecords.push({ id: 'most-runners-team', title: 'Time com Mais Vice-Campeonatos', description: `Bateu na trave.`, value: maxRunnersTeamRes.value, holder: maxRunnersTeamRes.holders, type: 'TEAM' });

    // Time com mais "Regular Season Titles" (Position 1)
    const teamRegSeasons: Record<string, number> = {};
    (allStandings as any[])?.forEach(s => { if (s.position == 1) teamRegSeasons[s.team_id] = (teamRegSeasons[s.team_id] || 0) + 1; });
    const maxRegSeasonTeamRes = findMaxAndHolders(Object.entries(teamRegSeasons), ([_, c]) => c, ([id, _]) => getTeamName(id));
    if (maxRegSeasonTeamRes) newRecords.push({ id: 'most-reg-season-team', title: 'Time Campeão Regular Season', description: `Consistência na fase regular.`, value: maxRegSeasonTeamRes.value, holder: maxRegSeasonTeamRes.holders, type: 'TEAM' });


    return newRecords;
};
