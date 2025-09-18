import { DittoService } from './DittoService';
import { 
  SyncRecord, 
  SyncSource, 
  ConflictResolution, 
  SyncDeduplicationEvents, 
  DittoEventEmitter 
} from '../types/DittoTypes';

export class SyncDeduplicationService implements DittoEventEmitter<SyncDeduplicationEvents> {
  private dittoService: DittoService;
  private syncRecordsCollection = 'sync_records';
  private conflictsCollection = 'sync_conflicts';
  private hashCache: Map<string, string> = new Map();
  private listeners: Map<keyof SyncDeduplicationEvents, Set<Function>> = new Map();

  constructor() {
    this.dittoService = DittoService.getInstance();
    this.initializeListeners();
  }

  async initialize(): Promise<void> {
    if (!this.dittoService.isReady()) {
      throw new Error('Ditto service not initialized');
    }

    await this.subscribeToSyncRecords();
    await this.startConflictResolution();
    console.log('Sync deduplication service initialized');
  }

  private async subscribeToSyncRecords(): Promise<void> {
    try {
      await this.dittoService.subscribeToCollection(
        this.syncRecordsCollection,
        (docs, event) => {
          // Handle sync record updates
          docs.forEach(doc => {
            const record = this.deserializeSyncRecord(doc);
            this.emit('recordCreated', record);
          });
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to sync records:', error);
      throw error;
    }
  }

  private async startConflictResolution(): Promise<void> {
    // Start periodic conflict resolution
    setInterval(async () => {
      await this.processConflicts();
    }, 30000); // Process conflicts every 30 seconds
  }

  // Generate deterministic ID for data
  generateDeterministicId(data: any, dataType: string): string {
    const normalizedData = this.normalizeData(data, dataType);
    const hash = this.generateHash(normalizedData);
    return `${dataType}_${hash}`;
  }

  // Check if data already exists
  async isDuplicate(data: any, dataType: string): Promise<boolean> {
    const deterministicId = this.generateDeterministicId(data, dataType);
    
    try {
      const existing = await this.dittoService.findDocument(
        this.syncRecordsCollection, 
        deterministicId
      );
      return existing !== null;
    } catch (error) {
      console.error('Error checking for duplicate:', error);
      return false;
    }
  }

  // Process incoming data for deduplication
  async processIncomingData(
    data: any,
    dataType: string,
    source: SyncSource
  ): Promise<{ action: 'accept' | 'reject' | 'conflict'; record?: SyncRecord }> {
    const deterministicId = this.generateDeterministicId(data, dataType);
    const hash = this.generateHash(data);

    const existingRecord = await this.getSyncRecord(deterministicId);

    if (!existingRecord) {
      // New data - accept and create record
      const record = await this.createSyncRecord(deterministicId, data, dataType, source, hash);
      return { action: 'accept', record };
    }

    // Check if it's the same data
    if (existingRecord.hash === hash) {
      // Same data from different source - update sources
      await this.updateSyncRecordSources(deterministicId, source);
      return { action: 'reject', record: existingRecord };
    }

    // Different data with same ID - conflict
    const conflictRecord = await this.handleConflict(existingRecord, data, source);
    return { action: 'conflict', record: conflictRecord };
  }

  private async createSyncRecord(
    id: string,
    data: any,
    dataType: string,
    source: SyncSource,
    hash: string
  ): Promise<SyncRecord> {
    const record: SyncRecord = {
      id,
      dataType: dataType as any,
      sourceId: this.extractSourceId(data, dataType),
      hash,
      timestamp: new Date(),
      syncStatus: 'pending',
      sources: [source],
    };

    await this.dittoService.upsertDocument(
      this.syncRecordsCollection,
      this.serializeSyncRecord(record),
      id
    );

    this.emit('recordCreated', record);
    return record;
  }

  private async handleConflict(
    existingRecord: SyncRecord,
    newData: any,
    newSource: SyncSource
  ): Promise<SyncRecord> {
    const conflictId = `conflict_${existingRecord.id}_${Date.now()}`;
    
    const conflict = {
      id: conflictId,
      originalRecordId: existingRecord.id,
      conflictingData: newData,
      conflictingSource: newSource,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    await this.dittoService.upsertDocument(
      this.conflictsCollection,
      conflict,
      conflictId
    );

    // Apply conflict resolution strategy
    const resolvedRecord = await this.resolveConflict(existingRecord, newData, newSource);
    
    this.emit('conflictDetected', conflict);
    return resolvedRecord;
  }

  private async resolveConflict(
    existingRecord: SyncRecord,
    newData: any,
    newSource: SyncSource
  ): Promise<SyncRecord> {
    const strategy = this.getConflictResolutionStrategy(existingRecord.dataType);
    
    switch (strategy) {
      case 'last_write_wins':
        return await this.resolveLastWriteWins(existingRecord, newData, newSource);
      case 'merge':
        return await this.resolveMerge(existingRecord, newData, newSource);
      case 'manual':
        return await this.flagForManualResolution(existingRecord, newData, newSource);
      default:
        return existingRecord;
    }
  }

  private async resolveLastWriteWins(
    existingRecord: SyncRecord,
    newData: any,
    newSource: SyncSource
  ): Promise<SyncRecord> {
    const existingTimestamp = Math.max(...existingRecord.sources.map(s => s.timestamp.getTime()));
    const newTimestamp = newSource.timestamp.getTime();

    if (newTimestamp > existingTimestamp) {
      // New data wins
      const updatedRecord = {
        ...existingRecord,
        hash: this.generateHash(newData),
        sources: [...existingRecord.sources, newSource],
        conflictResolution: {
          strategy: 'last_write_wins' as const,
          resolvedBy: 'system',
          resolvedAt: new Date(),
          originalVersions: [existingRecord],
          resolvedVersion: newData,
        },
      };

      await this.updateSyncRecord(updatedRecord);
      this.emit('conflictResolved', updatedRecord);
      return updatedRecord;
    }

    return existingRecord;
  }

  private async resolveMerge(
    existingRecord: SyncRecord,
    newData: any,
    newSource: SyncSource
  ): Promise<SyncRecord> {
    // Implement merge logic based on data type
    const mergedData = this.mergeData(existingRecord, newData, existingRecord.dataType);
    
    const updatedRecord = {
      ...existingRecord,
      hash: this.generateHash(mergedData),
      sources: [...existingRecord.sources, newSource],
      conflictResolution: {
        strategy: 'merge' as const,
        resolvedBy: 'system',
        resolvedAt: new Date(),
        originalVersions: [existingRecord, newData],
        resolvedVersion: mergedData,
      },
    };

    await this.updateSyncRecord(updatedRecord);
    this.emit('conflictResolved', updatedRecord);
    return updatedRecord;
  }

  private async flagForManualResolution(
    existingRecord: SyncRecord,
    newData: any,
    newSource: SyncSource
  ): Promise<SyncRecord> {
    // Flag for manual resolution
    const updatedRecord = {
      ...existingRecord,
      syncStatus: 'conflict' as const,
      sources: [...existingRecord.sources, newSource],
    };

    await this.updateSyncRecord(updatedRecord);
    return updatedRecord;
  }

  private mergeData(existingRecord: SyncRecord, newData: any, dataType: string): any {
    switch (dataType) {
      case 'message':
        return newData; // Messages can't be merged
      case 'marker':
        return {
          ...existingRecord,
          ...Object.fromEntries(
            Object.entries(newData).filter(([_, value]) => value != null)
          ),
          lastUpdated: new Date(),
        };
      case 'location':
        return newData; // Use most recent location
      default:
        return newData;
    }
  }

  private async processConflicts(): Promise<void> {
    try {
      const conflicts = await this.dittoService.findAllDocuments(this.conflictsCollection);
      
      for (const conflict of conflicts) {
        if (conflict.status === 'pending') {
          // Process pending conflicts
          await this.resolveConflictById(conflict.id);
        }
      }
    } catch (error) {
      console.error('Error processing conflicts:', error);
    }
  }

  private async resolveConflictById(conflictId: string): Promise<void> {
    // Implementation for resolving specific conflicts
    console.log(`Resolving conflict: ${conflictId}`);
  }

  // Utility methods
  private normalizeData(data: any, dataType: string): any {
    switch (dataType) {
      case 'message':
        return {
          content: data.content,
          type: data.type,
          senderId: data.senderId,
          timestamp: Math.floor(new Date(data.timestamp).getTime() / 1000),
        };
      case 'marker':
        return {
          latitude: Math.round(data.latitude * 1000000) / 1000000,
          longitude: Math.round(data.longitude * 1000000) / 1000000,
          title: data.title,
          category: data.category,
        };
      case 'location':
        return {
          latitude: Math.round(data.latitude * 1000000) / 1000000,
          longitude: Math.round(data.longitude * 1000000) / 1000000,
          peerId: data.peerId,
          timestamp: Math.floor(new Date(data.timestamp).getTime() / 1000),
        };
      default:
        return data;
    }
  }

  private generateHash(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return this.simpleHash(str);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private extractSourceId(data: any, dataType: string): string {
    switch (dataType) {
      case 'message':
        return data.senderId || 'unknown';
      case 'marker':
        return data.createdBy || 'unknown';
      case 'location':
        return data.peerId || 'unknown';
      default:
        return 'unknown';
    }
  }

  private getConflictResolutionStrategy(dataType: string): 'last_write_wins' | 'merge' | 'manual' {
    switch (dataType) {
      case 'message':
        return 'last_write_wins';
      case 'marker':
        return 'merge';
      case 'location':
        return 'last_write_wins';
      default:
        return 'manual';
    }
  }

  // Database operations
  private async getSyncRecord(id: string): Promise<SyncRecord | null> {
    try {
      const doc = await this.dittoService.findDocument(this.syncRecordsCollection, id);
      return doc ? this.deserializeSyncRecord(doc) : null;
    } catch (error) {
      console.error('Error getting sync record:', error);
      return null;
    }
  }

  private async updateSyncRecord(record: SyncRecord): Promise<void> {
    await this.dittoService.upsertDocument(
      this.syncRecordsCollection,
      this.serializeSyncRecord(record),
      record.id
    );
  }

  private async updateSyncRecordSources(id: string, newSource: SyncSource): Promise<void> {
    const store = await this.dittoService.getStore();
    const collection = store.collection(this.syncRecordsCollection);
    
      await collection
      .findByID(id)
      .update((mutableDoc: any) => {
        if (mutableDoc) {
          const sourcesPath = mutableDoc.at('sources');
          const currentSources = Array.isArray(sourcesPath.value) ? [...sourcesPath.value] : [];
          currentSources.push(this.serializeSource(newSource));
          sourcesPath.set(currentSources);
        }
      });
  }

  private serializeSyncRecord(record: SyncRecord): any {
    return {
      ...record,
      timestamp: record.timestamp.toISOString(),
      sources: record.sources.map(this.serializeSource),
      conflictResolution: record.conflictResolution ? {
        ...record.conflictResolution,
        resolvedAt: record.conflictResolution.resolvedAt.toISOString(),
      } : undefined,
    };
  }

  private deserializeSyncRecord(data: any): SyncRecord {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      sources: data.sources.map(this.deserializeSource),
      conflictResolution: data.conflictResolution ? {
        ...data.conflictResolution,
        resolvedAt: new Date(data.conflictResolution.resolvedAt),
      } : undefined,
    };
  }

  private serializeSource(source: SyncSource): any {
    return {
      ...source,
      timestamp: source.timestamp.toISOString(),
    };
  }

  private deserializeSource(data: any): SyncSource {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
    };
  }

  async shutdown(): Promise<void> {
    this.hashCache.clear();
    this.removeAllListeners();
    console.log('Sync deduplication service shutdown');
  }

  // Event emitter implementation
  private initializeListeners(): void {
    this.listeners.set('recordCreated', new Set());
    this.listeners.set('conflictDetected', new Set());
    this.listeners.set('conflictResolved', new Set());
  }

  on<K extends keyof SyncDeduplicationEvents>(event: K, listener: SyncDeduplicationEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener as Function);
    }
  }

  off<K extends keyof SyncDeduplicationEvents>(event: K, listener: SyncDeduplicationEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Function);
    }
  }

  emit<K extends keyof SyncDeduplicationEvents>(
    event: K, 
    ...args: Parameters<SyncDeduplicationEvents[K] extends (...args: any[]) => any ? SyncDeduplicationEvents[K] : never>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          (listener as Function)(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.forEach(listeners => listeners.clear());
  }
}
