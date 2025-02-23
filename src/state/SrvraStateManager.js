
// /srvra-sync/src/state/SrvraStateManager.js

/**
 * SRVRA State Manager
 * Enterprise-grade state management with advanced synchronization
 * 
 * Features:
 * - Atomic state updates
 * - Version control and history
 * - Conflict detection and resolution
 * - State persistence and recovery
 * - Real-time state synchronization
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



class SrvraStateManager {
    constructor(config = {}) {
        this.config = {
            historySize: config.historySize || 50,
            mergeStrategy: config.mergeStrategy || 'last-write-wins',
            enableVersioning: config.enableVersioning || true,
            autoSync: config.autoSync || true,
            ...config
        };

        this.state = new Map();
        this.history = [];
        this.subscribers = new Map();
        this.version = 0;
        this.pendingUpdates = new Map();
    }

    setState(key, value, options = {}) {
        const updateId = this.generateUpdateId();
        const previousValue = this.state.get(key);

        const update = {
            id: updateId,
            key,
            value,
            version: ++this.version,
            timestamp: Date.now(),
            metadata: options.metadata || {},
            source: options.source || 'client'
        };

        this.trackHistory(update, previousValue);
        this.state.set(key, value);
        this.notifySubscribers(key, value, update);

        return updateId;
    }

    getState(key, options = {}) {
        const value = this.state.get(key);
        
        if (options.withMetadata) {
            return {
                value,
                version: this.version,
                lastUpdate: this.getLastUpdate(key)
            };
        }
        
        return value;
    }

    subscribe(key, callback, options = {}) {
        const subscriberId = this.generateSubscriberId();
        
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Map());
        }

        this.subscribers.get(key).set(subscriberId, {
            callback,
            filter: options.filter,
            priority: options.priority || 'normal'
        });

        return subscriberId;
    }

    unsubscribe(key, subscriberId) {
        if (!this.subscribers.has(key)) return false;
        return this.subscribers.get(key).delete(subscriberId);
    }

    batch(updates) {
        const batchId = this.generateBatchId();
        const results = new Map();

        updates.forEach(({ key, value, options = {} }) => {
            results.set(key, this.setState(key, value, {
                ...options,
                batch: batchId
            }));
        });

        return {
            batchId,
            results
        };
    }

    merge(incomingState, options = {}) {
        const conflicts = new Map();
        const updates = new Map();

        for (const [key, value] of Object.entries(incomingState)) {
            const currentValue = this.state.get(key);
            
            if (this.hasConflict(currentValue, value)) {
                conflicts.set(key, {
                    incoming: value,
                    current: currentValue
                });
            } else {
                updates.set(key, value);
            }
        }

        if (conflicts.size > 0) {
            this.resolveConflicts(conflicts, options.mergeStrategy);
        }

        updates.forEach((value, key) => {
            this.setState(key, value, { source: 'merge' });
        });

        return {
            conflicts: conflicts.size,
            updates: updates.size
        };
    }

    trackHistory(update, previousValue) {
        this.history.push({
            ...update,
            previousValue
        });

        if (this.history.length > this.config.historySize) {
            this.history.shift();
        }
    }

    notifySubscribers(key, value, update) {
        if (!this.subscribers.has(key)) return;

        const subscribers = Array.from(this.subscribers.get(key).entries())
            .sort(([, a], [, b]) => this.prioritySort(a.priority, b.priority));

        subscribers.forEach(([, subscriber]) => {
            if (!subscriber.filter || subscriber.filter(value, update)) {
                subscriber.callback(value, update);
            }
        });
    }

    hasConflict(current, incoming) {
        if (!current || !incoming) return false;
        return current.version && incoming.version && current.version !== incoming.version;
    }

    resolveConflicts(conflicts, strategy = this.config.mergeStrategy) {
        conflicts.forEach((conflict, key) => {
            const resolvedValue = this.applyMergeStrategy(conflict, strategy);
            this.setState(key, resolvedValue, { source: 'conflict-resolution' });
        });
    }

    applyMergeStrategy(conflict, strategy) {
        switch (strategy) {
            case 'last-write-wins':
                return conflict.incoming;
            case 'server-wins':
                return conflict.current;
            case 'merge-fields':
                return { ...conflict.current, ...conflict.incoming };
            default:
                return conflict.incoming;
        }
    }

    prioritySort(a, b) {
        const priorityMap = { high: 3, normal: 2, low: 1 };
        return priorityMap[b] - priorityMap[a];
    }

    getLastUpdate(key) {
        return this.history
            .filter(update => update.key === key)
            .pop();
    }

    generateUpdateId() {
        return `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSubscriberId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateBatchId() {
        return `bat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getStatistics() {
        return {
            stateSize: this.state.size,
            historyLength: this.history.length,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((total, subs) => total + subs.size, 0),
            version: this.version
        };
    }

    destroy() {
        this.state.clear();
        this.history = [];
        this.subscribers.clear();
        this.pendingUpdates.clear();
    }
}

export default SrvraStateManager;
