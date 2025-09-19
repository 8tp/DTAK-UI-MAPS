import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  // FlatList,
  SectionList,
  TextInput,
  Button,
  Platform,
} from 'react-native';
import { DittoService } from '../../ditto/services/DittoService';

type Peer = { id: string; siteID?: string; info?: any };

// Simple RFC4122 v4 UUID generator (no external deps)
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function DittoDebugPanel({ onClose }: { onClose: () => void }) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [payload, setPayload] = useState<string>('hello from device');
  const [status, setStatus] = useState<string>('unknown');

  useEffect(() => {
    const svc = DittoService.getInstance();

    setStatus(svc.isReady() ? 'ready' : 'not ready');

    // Observe peers
    try {
      svc.observePeers((peerList: any[]) => {
        const normalized = (peerList || []).map((p: any) => ({ id: p?.id || p?.siteID || JSON.stringify(p), info: p }));
        setPeers(normalized);
        setStatus('observing peers');
      });
    } catch {
      // some Ditto versions throw if observer API shape differs
    }

    // Subscribe to debug_messages collection for inbound test messages
    let sub: any = null;
    (async () => {
      try {
        sub = await svc.subscribeToCollection('debug_messages', (docs: any[], ev: any) => {
          try {
            const newDocs = (docs || []).map((d: any) => {
              const payload = d && d.value ? d.value : d || {};
              // Ensure a stable id exists on the item for React key usage
              const docId = payload.id || payload._id || payload.key || payload.ts || uuidv4();
              return { ...payload, id: String(docId) };
            });
            setMessages((existing) => {
              // prepend new docs, dedupe by id and limit length
              const combined = [...newDocs, ...existing];
              const seen = new Set();
              const deduped: any[] = [];
              for (const m of combined) {
                if (!m || !m.id) continue;
                if (seen.has(m.id)) continue;
                seen.add(m.id);
                deduped.push(m);
                if (deduped.length >= 200) break;
              }
              return deduped;
            });
          } catch (e) {
            console.warn('Error processing debug_messages subscription', e);
          }
        });
      } catch (e) {
        console.warn('Failed to subscribe to debug_messages', e);
      }
    })();

    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
      } catch {}
    };
  }, []);

  const sendTest = async () => {
    try {
      const svc = DittoService.getInstance();
      const info = await svc.getDeviceInfo();
  const id = uuidv4();
      const doc = {
        id,
        from: info.deviceName,
        deviceId: info.deviceId,
        text: payload,
        ts: new Date().toISOString(),
      };
      await svc.upsertDocument('debug_messages', doc, id);
      setMessages((s) => {
        // preprend, dedupe by id
        const combined = [doc, ...s];
        const seen = new Set();
        const deduped: any[] = [];
        for (const m of combined) {
          if (!m || !m.id) continue;
          if (seen.has(m.id)) continue;
          seen.add(m.id);
          deduped.push(m);
          if (deduped.length >= 200) break;
        }
        return deduped;
      });
    } catch (err) {
      console.warn('Ditto debug send failed', err);
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Ditto Debug</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: '#fff' }}>Close</Text>
          </TouchableOpacity>
        </View>

        <SectionList
          style={styles.section}
          sections={[
            { key: 'status', title: 'Status', data: [{ type: 'status' }] },
            { key: 'peers', title: `Peers (${peers.length})`, data: peers },
            { key: 'send', title: 'Send Test Message', data: [{ type: 'send' }] },
            { key: 'messages', title: 'Recent Messages', data: messages },
          ]}
          keyExtractor={(item: any, index) => item && item.id ? String(item.id) : String(item?.ts ?? index)}
          renderSectionHeader={({ section: { title } }: any) => (
            <Text style={styles.sectionTitle}>{title}</Text>
          )}
          renderItem={({ item, section }: any) => {
            if (section.key === 'status') {
              return <Text style={styles.mono}>{status}</Text>;
            }
            if (section.key === 'peers') {
              return (
                <View style={styles.row}>
                  <Text style={styles.mono}>{item.id}</Text>
                  <Text style={{ color: '#9ca3af' }}>{JSON.stringify(item.info)}</Text>
                </View>
              );
            }
            if (section.key === 'send') {
              return (
                <View>
                  <TextInput value={payload} onChangeText={setPayload} style={styles.input} placeholder="message payload" />
                  <Button title="Send" onPress={sendTest} />
                </View>
              );
            }
            // messages
            return (
              <View style={styles.msgRow}>
                <Text style={styles.outputText}>{item.ts || ''}</Text>
                <Text style={styles.outputText}>{item.from}: {item.text}</Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2000 },
  panel: { position: 'absolute', top: 80, right: 16, bottom: 80, left: 16, backgroundColor: '#111827', borderRadius: 12, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  closeButton: { padding: 8, backgroundColor: '#ef4444', borderRadius: 6 },
  section: { marginTop: 8 },
  sectionTitle: { color: '#9ca3af', marginTop: 8, marginBottom: 4 },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#e5e7eb' },
  outputText: { color: '#ffffff' },
  row: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#111827' },
  input: { backgroundColor: '#fff', padding: 8, borderRadius: 6, marginBottom: 8 },
  msgRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
});
