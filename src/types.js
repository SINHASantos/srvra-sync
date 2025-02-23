// /srvra-sync/src/types.js

/**
 * SRVRA Type System
 * Enterprise-grade type definitions for state management and synchronization
 * 
 * Features:
 * - Comprehensive event types
 * - State management types
 * - Conflict resolution types
 * - Real-time sync types
 * - Type-safe operations
 * - TypeScript compatibility
 * 
 * Copyright (C) [2025] [Srvra]
 * Author: [Santosh Sinha]
 * This file is part of [SRVRA Enterprise UI Engine]
 *
 * This program is dual-licensed under either:
 * - GNU Affero General Public License v3.0
 * - Commercial License
 * 
 * Contact [signme888@gmail.com] for commercial licensing options
 * @version 1.0.0
 */
  
export const SrvraEventTypes = {
    // Core sync events
    DATA_CHANGE: 'data-change',
    SYNC_COMPLETE: 'sync-complete',
    SYNC_ERROR: 'sync-error',
    CONFLICT: 'conflict',
    CONFLICT_RESOLVED: 'conflict-resolved',
    
    // Additional sync events
    BATCH_COMPLETE: 'batch-complete',
    DELTA_APPLIED: 'delta-applied',
    NETWORK_STATUS: 'network-status'
};

export const SrvraStateTypes = {
    // Core states
    INITIAL: 'initial',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    ERROR: 'error',
    
    // Extended states
    OFFLINE: 'offline',
    RECONNECTING: 'reconnecting',
    PARTIAL_SYNC: 'partial-sync'
};

export const SrvraConflictTypes = {
    // Core resolution types
    SERVER_WINS: 'server-wins',
    CLIENT_WINS: 'client-wins',
    AUTO_MERGE: 'auto-merge',
    MANUAL_RESOLVE: 'manual-resolve',
    
    // Advanced resolution types
    FIELD_LEVEL: 'field-level',
    TIMESTAMP_BASED: 'timestamp-based',
    SMART_MERGE: 'smart-merge'
};
