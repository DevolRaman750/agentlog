-- Migration 000026 Down: Remove Software Engineer API Configuration

-- Remove the Software Engineer configuration
DELETE FROM api_configurations WHERE id = 'system-config-software-engineer'; 