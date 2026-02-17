import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { listTeams, listManagers, listChampions, listAwards } from '../cms';

export const useGlobalData = () => {
    const [data, setData] = useState<any>({
        standings: [],
        history: [],
        teams: [],
        managers: [],
        seasons: [],
        champions: [],
        awards: [],
        trades: [],
        loading: true
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [
                { data: standings },
                { data: history },
                { data: teams },
                { data: managers },
                { data: seasons },
                { data: champions },
                { data: awards },
                { data: trades }
            ] = await Promise.all([
                supabase.from('season_standings').select('*'),
                supabase.from('manager_history').select('*'),
                listTeams(),
                listManagers(),
                supabase.from('seasons').select('*'),
                listChampions(),
                listAwards(),
                supabase.from('trades').select('*')
            ]);

            setData({
                standings: standings || [],
                history: history || [],
                teams: teams || [],
                managers: managers || [],
                seasons: seasons || [],
                champions: champions || [],
                awards: awards || [],
                trades: trades || [],
                loading: false
            });
        } catch (error) {
            console.error('Error fetching global data:', error);
            setData(prev => ({ ...prev, loading: false }));
        }
    };

    return data;
};
