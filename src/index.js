// /srvra-sync/src/index.js

/**
 * SRVRA Sync Engine
 * Enterprise-grade state management and synchronization system
 * 
 * Features:
 * - Advanced state synchronization
 * - Real-time event management
 * - Intelligent conflict resolution
 * - Multi-node coordination
 * - Enterprise security
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

// Core synchronization components
export { SrvraEventBus } from './events/SrvraEventBus';
export { SrvraStateManager } from './state/SrvraStateManager';

// Data sync and conflict handling
export { SrvraDataSync } from './sync/SrvraDataSync';
export { SrvraConflictResolver } from './sync/SrvraConflictResolver';

// Utility exports
export { 
    SrvraEventTypes,
    SrvraStateTypes,
    SrvraConflictTypes 
} from './types';

// Configuration exports
export { 
    DEFAULT_SYNC_CONFIG,
    DEFAULT_CONFLICT_CONFIG 
} from './config';
