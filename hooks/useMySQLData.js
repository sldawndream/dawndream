'use client';

import { useState, useEffect } from 'react';

/**
 * Generic fetcher hook for DawnDream MySQL API routes.
 *
 * Usage:
 *   const { data, loading, error } = useMySQLData('/api/mysql/player-stats?name=Seraphine');
 */
export function useMySQLData(url) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

/**
 * Hook for player stats.
 */
export function usePlayerStats(avatarName) {
  return useMySQLData(avatarName ? `/api/mysql/player-stats?name=${encodeURIComponent(avatarName)}` : null);
}

/**
 * Hook for lineage tree.
 */
export function useLineage(avatarName, depth = 2) {
  return useMySQLData(avatarName ? `/api/mysql/lineage?name=${encodeURIComponent(avatarName)}&depth=${depth}` : null);
}

/**
 * Hook for achievements.
 */
export function useAchievements(avatarName) {
  return useMySQLData(avatarName ? `/api/mysql/achievements?name=${encodeURIComponent(avatarName)}` : null);
}

/**
 * Hook for leaderboard.
 * type: 'age' | 'kills' | 'bites' | 'amrita' | 'blood'
 */
export function useLeaderboard(type = 'age', limit = 25) {
  return useMySQLData(`/api/mysql/leaderboard?type=${type}&limit=${limit}`);
}

/**
 * Hook for live clans.
 */
export function useClans() {
  return useMySQLData('/api/mysql/clans');
}

/**
 * Hook for live hordes.
 */
export function useHordes() {
  return useMySQLData('/api/mysql/hordes');
}
