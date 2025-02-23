// /srvra-sync/src/sync/SrvraDataSync.js

/**
 * SRVRA Data Sync
 * Enterprise-grade real-time synchronization engine with distributed capabilities
 * 
 * Features:
 * - Real-time bi-directional sync
 * - Offline-first architecture
 * - Delta-based updates
 * - Automatic conflict handling
 * - Multi-node synchronization
 * - Performance optimization
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



import SrvraEventBus from '/js/srvra-sync/src/events/SrvraEventBus.js';
import SrvraStateManager from '/js/srvra-sync/src/state/SrvraStateManager.js';
import SrvraConflictResolver from '/js/srvra-sync/src/sync/SrvraConflictResolver.js';


class SrvraDataSync {
    constructor(config = {}) {
        this.config = {
            syncInterval: config.syncInterval || 30000,
            retryAttempts: config.retryAttempts || 3,
            batchSize: config.batchSize || 100,
            enableDeltaUpdates: config.enableDeltaUpdates || true,
            ...config
        };

        this.eventBus = new SrvraEventBus();
        this.stateManager = new SrvraStateManager();
        this.conflictResolver = new SrvraConflictResolver({
            trackHistory: true,
            maxRetries: this.config.retryAttempts
        });

        this.syncQueue = [];
        this.pendingSync = new Map();
        this.lastSyncTimestamp = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startSyncInterval();
    }

    setupEventListeners() {
        this.eventBus.subscribe('data-change', this.handleDataChange.bind(this));
        this.eventBus.subscribe('sync-complete', this.handleSyncComplete.bind(this));
        this.eventBus.subscribe('conflict', this.handleConflict.bind(this));
    }

	startSyncInterval() {
        this.syncInterval = setInterval(() => {
            this.sync();
        }, this.config.syncInterval);
    }

	handleSyncComplete(data) {
	    this.lastSyncTimestamp = data.timestamp;
	    
	    // Update sync statistics
	    this.syncStats = {
	        lastSuccessfulSync: data.timestamp,
	        changesProcessed: data.changes,
	        conflictsResolved: data.conflicts.length
	    };

	    // Clear processed items from sync queue
	    this.syncQueue = this.syncQueue.filter(item => 
	        !data.changes.some(change => change.key === item.key)
	    );

	    // Update state metadata
	    this.stateManager.setMetadata('lastSync', {
	        timestamp: data.timestamp,
	        status: 'success',
	        stats: this.syncStats
	    });

	    // Trigger any pending callbacks
	    if (this.onSyncComplete) {
	        this.onSyncComplete(this.syncStats);
	    }

	    // Emit success event with detailed stats
	    this.eventBus.publish('sync-success', {
	        timestamp: data.timestamp,
	        duration: Date.now() - data.timestamp,
	        stats: this.syncStats,
	        nextSyncScheduled: Date.now() + this.config.syncInterval
	    });

	    // Reset sync flags
	    this.isSyncing = false;
	    this.syncAttempts = 0;
	}


    async sync(options = {}) {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const changes = this.collectChanges();
            if (changes.length === 0) {
                return;
            }

            const batches = this.createBatches(changes);
            const results = await this.processBatches(batches);
            
            this.handleSyncResults(results);
            this.lastSyncTimestamp = Date.now();
            
            this.eventBus.publish('sync-complete', {
                timestamp: this.lastSyncTimestamp,
                changes: changes.length,
                conflicts: results.conflicts
            });

        } catch (error) {
            this.handleSyncError(error);
        } finally {
            this.isSyncing = false;
        }
    }

    collectChanges() {
        const changes = [];
        for (const [key, value] of this.stateManager.state) {
            if (this.hasChanged(key, value)) {
                changes.push({
                    key,
                    value,
                    version: this.stateManager.version,
                    timestamp: Date.now()
                });
            }
        }
        return changes;
    }

    createBatches(changes) {
        const batches = [];
        for (let i = 0; i < changes.length; i += this.config.batchSize) {
            batches.push(changes.slice(i, i + this.config.batchSize));
        }
        return batches;
    }

    async processBatches(batches) {
        const results = {
            success: [],
            conflicts: [],
            errors: []
        };

        for (const batch of batches) {
            try {
                const result = await this.sendBatch(batch);
                const resolvedConflicts = this.handleBatchConflicts(result.conflicts);
                
                results.success.push(...result.success);
                results.conflicts.push(...resolvedConflicts);
                results.errors.push(...result.errors);
            } catch (error) {
                results.errors.push(error);
            }
        }

        return results;
    }



    async sendBatch(batch) {
        const batchId = this.generateBatchId();
        this.pendingSync.set(batchId, batch);

        try {
            const response = await this.sendToServer(batch);
            return this.processBatchResponse(response);
        } finally {
            this.pendingSync.delete(batchId);
        }
    }

    mergeBatchResults(results, batchResults) {
        results.success.push(...batchResults.success);
        results.conflicts.push(...batchResults.conflicts);
        results.errors.push(...batchResults.errors);
    }

    hasChanged(key, value) {
        const lastSync = this.getLastSyncState(key);
        return !lastSync || lastSync.version !== value.version;
    }

    handleDataChange(change) {
        this.syncQueue.push(change);
        if (this.config.enableDeltaUpdates) {
            this.processDeltaUpdate(change);
        }
    }

    processDeltaUpdate(change) {
        const delta = this.calculateDelta(change);
        if (delta) {
            this.applyDelta(delta);
        }
    }

    calculateDelta(change) {
        const current = this.stateManager.getState(change.key);
        return this.generateDelta(current, change.value);
    }

    generateDelta(oldValue, newValue) {
	    const delta = {
	        timestamp: Date.now(),
	        changes: {},
	        type: this.determineDataType(newValue)
	    };

	    switch (delta.type) {
	        case 'object':
	            Object.keys({ ...oldValue, ...newValue }).forEach(key => {
	                if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
	                    delta.changes[key] = {
	                        old: oldValue[key],
	                        new: newValue[key]
	                    };
	                }
	            });
	            break;

	        case 'array':
	            delta.changes = {
	                added: newValue.filter(item => !oldValue.includes(item)),
	                removed: oldValue.filter(item => !newValue.includes(item)),
	                modified: newValue.filter((item, index) => 
	                    oldValue[index] && item !== oldValue[index]
	                )
	            };
	            break;

	        default:
	            delta.changes = {
	                old: oldValue,
	                new: newValue
	            };
	    }

	    return delta;
	}

	applyDelta(delta) {
	    const currentValue = this.stateManager.getState(delta.key);
	    let updatedValue;

	    switch (delta.type) {
	        case 'object':
	            updatedValue = { ...currentValue };
	            Object.entries(delta.changes).forEach(([key, change]) => {
	                updatedValue[key] = change.new;
	            });
	            break;

	        case 'array':
	            updatedValue = [...currentValue]
	                .filter(item => !delta.changes.removed.includes(item))
	                .concat(delta.changes.added);
	            delta.changes.modified.forEach((item, index) => {
	                const currentIndex = updatedValue.findIndex(i => i === currentValue[index]);
	                if (currentIndex !== -1) {
	                    updatedValue[currentIndex] = item;
	                }
	            });
	            break;

	        default:
	            updatedValue = delta.changes.new;
	    }

	    this.stateManager.setState(delta.key, updatedValue);
	    return updatedValue;
	}


    handleConflict(conflict) {
        const resolution = this.conflictResolver.resolveConflict({
            serverValue: conflict.serverValue,
            clientValue: conflict.clientValue,
            serverTimestamp: conflict.serverTimestamp,
            clientTimestamp: conflict.clientTimestamp,
            dataType: this.determineDataType(conflict.serverValue),
            metadata: {
                key: conflict.key,
                version: conflict.version
            }
        });

        this.applyResolution(conflict.key, resolution);
        
        this.eventBus.publish('conflict-resolved', {
            key: conflict.key,
            resolution,
            timestamp: Date.now()
        });

        return resolution;
    }
   
    

	determineDataType(value) {
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    applyResolution(key, resolution) {
        this.stateManager.setState(key, resolution.value);
        
        if (resolution.metadata) {
            this.stateManager.setMetadata(key, resolution.metadata);
        }
    }

    handleBatchConflicts(conflicts) {
        return conflicts.map(conflict => ({
            original: conflict,
            resolution: this.handleConflict(conflict)
        }));
    }

    getConflictStatistics() {
        return this.conflictResolver.getStatistics();
    }

    getConflictHistory(filter) {
        return this.conflictResolver.getResolutionHistory(filter);
    }

    destroy() {
        clearInterval(this.syncInterval);
        this.eventBus.destroy();
        this.stateManager.destroy();
        this.conflictResolver.destroy();
        this.syncQueue = [];
        this.pendingSync.clear();
    }


    handleSyncError(error) {
        this.eventBus.publish('sync-error', {
            error,
            timestamp: Date.now()
        });
    }

    getLastSyncState(key) {
        return this.stateManager.getLastUpdate(key);
    }

    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

}
export { SrvraDataSync };

	
