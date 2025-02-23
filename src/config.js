// /srvra-sync/src/config.js

export const DEFAULT_SYNC_CONFIG = {
    // Core sync settings
    syncInterval: 30000,
    retryAttempts: 3,
    batchSize: 100,
    enableDeltaUpdates: true,
    
    // Advanced options
    maxConcurrentBatches: 5,
    compressionThreshold: 1024,
    priorityLevels: ['critical', 'high', 'normal', 'low'],
    networkTimeout: 10000
};

export const DEFAULT_CONFLICT_CONFIG = {
    // Core conflict settings
    trackHistory: true,
    maxRetries: 3,
    defaultStrategy: 'server-wins',
    enableMergeRules: true,
    
    // Enhanced conflict handling
    historySize: 100,
    mergeStrategies: ['smart-merge', 'field-level', 'timestamp-based'],
    conflictTimeout: 5000,
    autoResolveThreshold: 0.8
};
