-- Migration 000032 Down: Remove Teams Table

-- 1. Drop the team stats view
DROP VIEW IF EXISTS team_stats;

-- 2. Drop teams table
DROP TABLE IF EXISTS teams; 