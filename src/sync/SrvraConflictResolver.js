// /srvra-sync/src/sync/SrvraConflictResolver.js

/**
 * SRVRA Conflict Resolver
 * Enterprise-grade conflict resolution engine with intelligent merge capabilities
 * 
 * Features:
 * - Customizable resolution strategies
 * - Intelligent merge rules
 * - Version-based conflict detection
 * - Automatic conflict resolution
 * - History-aware reconciliation
 * - Real-time conflict handling
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



class SrvraConflictResolver {
    constructor(config = {}) {
        this.config = {
            defaultStrategy: config.defaultStrategy || 'server-wins',
            maxRetries: config.maxRetries || 3,
            enableMergeRules: config.enableMergeRules || true,
            trackHistory: config.trackHistory || true,
            ...config
        };

        this.conflictHistory = [];
        this.mergeRules = new Map();
        this.customStrategies = new Map();
        this.init();
    }

    init() {
        this.registerDefaultStrategies();
        this.setupMergeRules();
    }

    registerDefaultStrategies() {
        this.customStrategies.set('server-wins', this.serverWinsStrategy.bind(this));
        this.customStrategies.set('client-wins', this.clientWinsStrategy.bind(this));
        this.customStrategies.set('last-write-wins', this.lastWriteWinsStrategy.bind(this));
        this.customStrategies.set('auto-merge', this.autoMergeStrategy.bind(this));
    }

    setupMergeRules() {
        if (this.config.enableMergeRules) {
            this.registerDefaultMergeRules();
        }
    }

    registerDefaultMergeRules() {
        this.mergeRules.set('array', this.mergeArrays.bind(this));
        this.mergeRules.set('object', this.mergeObjects.bind(this));
        this.mergeRules.set('string', this.mergeStrings.bind(this));
    }

    resolveConflict(conflict) {
        const resolution = {
            originalConflict: conflict,
            timestamp: Date.now(),
            strategy: this.determineStrategy(conflict),
            attempts: 0
        };

        try {
            resolution.result = this.applyStrategy(resolution);
            this.trackResolution(resolution);
            return resolution.result;
        } catch (error) {
            return this.handleResolutionError(resolution, error);
        }
    }

    determineStrategy(conflict) {
        if (conflict.forcedStrategy) {
            return conflict.forcedStrategy;
        }

        if (conflict.dataType && this.mergeRules.has(conflict.dataType)) {
            return 'auto-merge';
        }

        return this.config.defaultStrategy;
    }

    applyStrategy(resolution) {
        const strategy = this.customStrategies.get(resolution.strategy);
        if (!strategy) {
            throw new Error(`Unknown resolution strategy: ${resolution.strategy}`);
        }

        return strategy(resolution.originalConflict);
    }

    serverWinsStrategy(conflict) {
        return {
            value: conflict.serverValue,
            source: 'server',
            metadata: conflict.serverMetadata
        };
    }

    clientWinsStrategy(conflict) {
        return {
            value: conflict.clientValue,
            source: 'client',
            metadata: conflict.clientMetadata
        };
    }

    lastWriteWinsStrategy(conflict) {
        const serverTime = conflict.serverTimestamp || 0;
        const clientTime = conflict.clientTimestamp || 0;

        return serverTime >= clientTime 
            ? this.serverWinsStrategy(conflict)
            : this.clientWinsStrategy(conflict);
    }

    autoMergeStrategy(conflict) {
        const mergeRule = this.mergeRules.get(conflict.dataType);
        return mergeRule(conflict.serverValue, conflict.clientValue, conflict);
    }

    mergeArrays(serverArray, clientArray, conflict) {
        const merged = [...new Set([...serverArray, ...clientArray])];
        return {
            value: merged,
            source: 'merged',
            metadata: { 
                originalLength: { server: serverArray.length, client: clientArray.length },
                mergedLength: merged.length
            }
        };
    }

    mergeObjects(serverObj, clientObj, conflict) {
        const merged = {
            ...serverObj,
            ...clientObj,
            _metadata: {
                mergedAt: Date.now(),
                sources: ['server', 'client']
            }
        };

        return {
            value: merged,
            source: 'merged',
            metadata: { fields: Object.keys(merged) }
        };
    }

    mergeStrings(serverString, clientString, conflict) {
        return {
            value: [serverString, clientString].join(this.config.stringMergeDelimiter || '\n'),
            source: 'merged',
            metadata: { 
                lengths: { server: serverString.length, client: clientString.length }
            }
        };
    }

    registerCustomStrategy(name, strategyFn) {
        this.customStrategies.set(name, strategyFn);
    }

    registerMergeRule(dataType, ruleFn) {
        this.mergeRules.set(dataType, ruleFn);
    }

    trackResolution(resolution) {
        if (!this.config.trackHistory) return;

        this.conflictHistory.push({
            timestamp: resolution.timestamp,
            strategy: resolution.strategy,
            result: resolution.result,
            conflict: resolution.originalConflict
        });

        if (this.conflictHistory.length > this.config.maxHistoryLength) {
            this.conflictHistory.shift();
        }
    }

    handleResolutionError(resolution, error) {
        resolution.attempts++;
        
        if (resolution.attempts < this.config.maxRetries) {
            return this.resolveConflict(resolution.originalConflict);
        }

        throw new Error(`Failed to resolve conflict after ${resolution.attempts} attempts`);
    }

    getResolutionHistory(filter = {}) {
        return this.conflictHistory.filter(resolution => {
            if (filter.strategy && resolution.strategy !== filter.strategy) return false;
            if (filter.since && resolution.timestamp < filter.since) return false;
            return true;
        });
    }

    getStatistics() {
        return {
            totalResolutions: this.conflictHistory.length,
            strategyCounts: this.getStrategyCounts(),
            customStrategies: this.customStrategies.size,
            mergeRules: this.mergeRules.size
        };
    }

    getStrategyCounts() {
        return this.conflictHistory.reduce((counts, resolution) => {
            counts[resolution.strategy] = (counts[resolution.strategy] || 0) + 1;
            return counts;
        }, {});
    }

    destroy() {
        this.conflictHistory = [];
        this.mergeRules.clear();
        this.customStrategies.clear();
    }
}

export default SrvraConflictResolver;
