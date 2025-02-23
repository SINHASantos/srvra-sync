# SRVRA Sync Type System

## Event Types
SRVRA Sync provides comprehensive event types for real-time state management.

### Core Sync Events
```typescript
// Track data modifications
DATA_CHANGE: 'data-change'

// Synchronization completion
SYNC_COMPLETE: 'sync-complete'

// Error handling
SYNC_ERROR: 'sync-error'

// Conflict management
CONFLICT: 'conflict'
CONFLICT_RESOLVED: 'conflict-resolved'
```

### Additional Sync Events

```typescript
// Batch processing
BATCH_COMPLETE: 'batch-complete'

// Delta updates
DELTA_APPLIED: 'delta-applied'

// Network monitoring
NETWORK_STATUS: 'network-status'

```

## State Types
Track synchronization status across the system.

### Core States

```typescript
// Initial state
INITIAL: 'initial'

// Active sync
SYNCING: 'syncing'

// Successful sync
SYNCED: 'synced'

// Error state
ERROR: 'error'

```
### Extended States
```typescript
// Network states
OFFLINE: 'offline'
RECONNECTING: 'reconnecting'

// Partial completion
PARTIAL_SYNC: 'partial-sync'

```

## Conflict Types
Advanced conflict resolution strategies.

### Core Resolution Types

```typescript
// Priority-based resolution
SERVER_WINS: 'server-wins'
CLIENT_WINS: 'client-wins'

// Automated handling
AUTO_MERGE: 'auto-merge'

// Manual intervention
MANUAL_RESOLVE: 'manual-resolve'

```

### Advanced Resolution Types

```typescript
// Granular resolution
FIELD_LEVEL: 'field-level'

// Time-based resolution
TIMESTAMP_BASED: 'timestamp-based'

// Intelligent merging
SMART_MERGE: 'smart-merge'

```
## Usage Examples
### Event Handling

```typescript
import { SrvraEventTypes } from 'srvra-sync';

sync.on(SrvraEventTypes.DATA_CHANGE, (data) => {
    console.log('Data changed:', data);
});

```

### State Management
```typescript
import { SrvraStateTypes } from 'srvra-sync';

if (sync.getState() === SrvraStateTypes.SYNCED) {
    // Process synced data
}

```
### Conflict Resolution

```typescript
import { SrvraConflictTypes } from 'srvra-sync';

sync.setConflictStrategy(SrvraConflictTypes.SMART_MERGE);

```
## Type Integration
### TypeScript Support

```typescript
import { 
    SrvraEventTypes, 
    SrvraStateTypes, 
    SrvraConflictTypes 
} from 'srvra-sync';

interface SyncConfig {
    eventType: keyof typeof SrvraEventTypes;
    stateType: keyof typeof SrvraStateTypes;
    conflictType: keyof typeof SrvraConflictTypes;
}

```
### React Integration

```typescript
function SyncComponent() {
    const [syncState, setSyncState] = useState(SrvraStateTypes.INITIAL);
    
    useEffect(() => {
        sync.on(SrvraEventTypes.SYNC_COMPLETE, () => {
            setSyncState(SrvraStateTypes.SYNCED);
        });
    }, []);
}

```

The SRVRA type system provides a robust foundation for enterprise-grade state management with comprehensive event handling, state tracking, and conflict resolution capabilities.
