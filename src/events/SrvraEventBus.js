//srvra-sync/src/events/SrvraEventBus.js

/**
 * SRVRA Event Bus
 * Enterprise-grade event management system with advanced synchronization
 * 
 * Features:
 * - Priority-based event handling
 * - Backpressure management
 * - Event buffering and persistence
 * - Batch publishing support
 * - Real-time event delivery
 * - Comprehensive error handling
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


class SrvraEventBus {
    constructor(config = {}) {
        this.config = {
            maxListeners: config.maxListeners || 100,
            bufferSize: config.bufferSize || 1000,
            deliveryTimeout: config.deliveryTimeout || 5000,
            priorityLevels: config.priorityLevels || ['high', 'normal', 'low'],
            persistence: config.persistence || false,
            backpressureThreshold: config.backpressureThreshold || 100,
            ...config
        };

        this.listeners = new Map();
        this.eventBuffer = new Map();
        this.deliveryPromises = new Map();
        this.storage = new EventStorage();
        this.statistics = {
            published: 0,
            delivered: 0,
            failed: 0,
            batched: 0
        };
    }

    async batchPublish(events) {
        const batchId = `batch_${Date.now()}`;
        const results = await Promise.all(
            events.map(({name, data, options}) => 
                this.publish(name, data, {...options, batchId})
            )
        );
        this.statistics.batched += events.length;
        return {
            batchId,
            results,
            timestamp: Date.now()
        };
    }

    async replayEvents(eventName, fromTimestamp) {
        const events = this.getEventHistory(eventName)
            .filter(event => event.timestamp >= fromTimestamp)
            .map(event => ({
                name: event.name,
                data: event.data,
                options: {
                    priority: event.priority,
                    metadata: {...event.metadata, replayed: true}
                }
            }));
        return this.batchPublish(events);
    }

    subscribe(eventPattern, callback, options = {}) {
        const eventNames = this.resolveEventPattern(eventPattern);
        const listenerId = this.generateListenerId();

        eventNames.forEach(eventName => {
            if (!this.listeners.has(eventName)) {
                this.listeners.set(eventName, new Set());
            }

            const listener = {
                id: listenerId,
                callback,
                priority: options.priority || 'normal',
                filter: options.filter,
                backpressure: options.backpressure || false,
                pending: 0
            };

            this.listeners.get(eventName).add(listener);
        });

        return listenerId;
    }

    async publish(eventName, data, options = {}) {
        const eventId = this.generateEventId();
        const event = {
            id: eventId,
            name: eventName,
            data,
            timestamp: Date.now(),
            priority: options.priority || 'normal',
            metadata: {
                ...options.metadata,
                batchId: options.batchId
            }
        };

        if (this.config.persistence) {
            await this.storage.saveEvent(event);
        }

        this.bufferEvent(event);
        this.statistics.published++;

        return this.deliverEvent(event);
    }

    async deliverEvent(event) {
        const listeners = this.listeners.get(event.name) || new Set();
        const deliveryPromise = Promise.all(
            Array.from(listeners)
                .sort(this.prioritySort)
                .map(listener => this.notifyListener(listener, event))
        );

        this.deliveryPromises.set(event.id, deliveryPromise);

        try {
            await Promise.race([
                deliveryPromise,
                this.createTimeout(event.id)
            ]);
            this.statistics.delivered++;
        } catch (error) {
            this.statistics.failed++;
            this.handleDeliveryFailure(event, error);
        }

        this.cleanupEvent(event);
        return event.id;
    }

    async notifyListener(listener, event) {
        if (listener.backpressure) {
            listener.pending++;
            if (listener.pending > this.config.backpressureThreshold) {
                await this.waitForCapacity(listener);
            }
        }

        if (listener.filter && !listener.filter(event.data)) {
            return;
        }

        try {
            await listener.callback(event.data, {
                eventId: event.id,
                timestamp: event.timestamp,
                metadata: event.metadata
            });
        } catch (error) {
            this.handleListenerError(listener, event, error);
        } finally {
            if (listener.backpressure) {
                listener.pending--;
            }
        }
    }

    waitForCapacity(listener) {
        return new Promise(resolve => {
            const checkCapacity = () => {
                if (listener.pending <= this.config.backpressureThreshold) {
                    resolve();
                } else {
                    setTimeout(checkCapacity, 100);
                }
            };
            checkCapacity();
        });
    }

    resolveEventPattern(pattern) {
        if (pattern === '*') {
            return Array.from(this.listeners.keys());
        }
        return [pattern];
    }

    unsubscribe(eventName, listenerId) {
        if (!this.listeners.has(eventName)) return false;

        const listeners = this.listeners.get(eventName);
        const listener = Array.from(listeners).find(l => l.id === listenerId);
        
        if (listener) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.listeners.delete(eventName);
            }
            return true;
        }
        return false;
    }

    bufferEvent(event) {
        if (!this.eventBuffer.has(event.name)) {
            this.eventBuffer.set(event.name, []);
        }

        const buffer = this.eventBuffer.get(event.name);
        buffer.push(event);

        if (buffer.length > this.config.bufferSize) {
            buffer.shift();
        }
    }

    getEventHistory(eventName) {
        return this.eventBuffer.get(eventName) || [];
    }

    prioritySort(a, b) {
        const priorityMap = { high: 3, normal: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
    }

    createTimeout(eventId) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Event delivery timeout: ${eventId}`));
            }, this.config.deliveryTimeout);
        });
    }

    handleDeliveryFailure(event, error) {
        console.error(`Event delivery failed: ${event.id}`, error);
        if (this.config.onDeliveryFailure) {
            this.config.onDeliveryFailure(event, error);
        }
    }

    handleListenerError(listener, event, error) {
        console.error(`Listener error: ${listener.id}`, error);
        if (this.config.onListenerError) {
            this.config.onListenerError(listener, event, error);
        }
    }

    cleanupEvent(event) {
        this.deliveryPromises.delete(event.id);
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateListenerId() {
        return `lst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getStatistics() {
        return {
            ...this.statistics,
            activeListeners: Array.from(this.listeners.values())
                .reduce((total, listeners) => total + listeners.size, 0),
            bufferedEvents: Array.from(this.eventBuffer.values())
                .reduce((total, buffer) => total + buffer.length, 0)
        };
    }

    destroy() {
        this.listeners.clear();
        this.eventBuffer.clear();
        this.deliveryPromises.clear();
        if (this.storage) {
            this.storage.destroy();
        }
    }
}

class EventStorage {
    constructor() {
        this.events = new Map();
    }

    async saveEvent(event) {
        this.events.set(event.id, event);
    }

    async getEvent(eventId) {
        return this.events.get(eventId);
    }

    destroy() {
        this.events.clear();
    }
}

export default SrvraEventBus;
