'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as dashboardApi from '../services/api/dashboard';
import * as logsApi from '../services/api/logs';

/**
 * DashboardCacheContext — keeps dashboard stats and bottle logs in memory
 * across admin page navigations so the dashboard page doesn't refetch on
 * every route change. Data is scoped by locationId and has a 60-second
 * staleness window (re-fetch if older than 60s).
 */
const DashboardCacheContext = createContext(null);

const STALE_MS = 60_000; // 1 minute

export function DashboardCacheProvider({ children }) {
    const [stats, setStats] = useState({
        totalBottles: 0, totalPoints: 0, onlineMachines: 0,
        totalMachines: 0, activeUsers: 0, totalUsers: 0, totalRewards: 0,
    });
    const [bottleLogs, setBottleLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const lastFetchRef = useRef({ locationId: null, ts: 0 });

    const parseBottleLogs = (logsData) => {
        return (logsData || []).map(log => {
            let ts = null;
            if (log.timestamp) {
                const parsed = new Date(log.timestamp);
                ts = isNaN(parsed.getTime()) ? new Date() : parsed;
            } else if (log.depositedAt) {
                const parsed = new Date(log.depositedAt);
                ts = isNaN(parsed.getTime()) ? new Date() : parsed;
            } else {
                ts = new Date();
            }
            return { ...log, timestampObj: ts };
        });
    };

    const fetchDashboard = useCallback(async (locationId, { force = false, silent = false } = {}) => {
        const now = Date.now();
        const cached = lastFetchRef.current;

        // Skip if data is fresh and location hasn't changed
        if (!force && cached.locationId === locationId && (now - cached.ts) < STALE_MS) {
            return;
        }

        if (silent) setIsRefreshing(true);
        else setIsLoading(true);

        const statsPromise = dashboardApi.getStats(locationId).catch(err => {
            console.error('Dashboard stats failed:', err);
            return null;
        });
        const logsPromise = logsApi.getBottles(locationId).catch(err => {
            console.error('Bottle logs failed:', err);
            return null;
        });

        const [statsData, logsData] = await Promise.all([statsPromise, logsPromise]);

        if (statsData) {
            setStats({
                totalBottles: statsData.totalBottles ?? 0,
                totalPoints: statsData.totalPointsAwarded ?? 0,
                onlineMachines: statsData.onlineMachines ?? 0,
                totalMachines: statsData.totalMachines ?? 0,
                activeUsers: statsData.activeUsers ?? 0,
                totalUsers: statsData.totalUsers ?? 0,
                totalRewards: statsData.totalRewards ?? 0,
            });
        }
        if (logsData) {
            setBottleLogs(parseBottleLogs(logsData));
        }

        lastFetchRef.current = { locationId, ts: Date.now() };
        setIsLoading(false);
        setIsRefreshing(false);
    }, []);

    const value = {
        stats,
        bottleLogs,
        isLoading,
        isRefreshing,
        fetchDashboard,
    };

    return (
        <DashboardCacheContext.Provider value={value}>
            {children}
        </DashboardCacheContext.Provider>
    );
}

export function useDashboardCache() {
    const ctx = useContext(DashboardCacheContext);
    if (!ctx) throw new Error('useDashboardCache must be used within DashboardCacheProvider');
    return ctx;
}
