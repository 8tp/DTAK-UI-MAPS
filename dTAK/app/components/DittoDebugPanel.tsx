import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Button,
  ScrollView,
  Platform,
} from 'react-native';
import { DittoService } from '../../ditto/services/DittoService';

type Peer = { id: string; siteID?: string; info?: any };

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
            const newDocs = (docs || []).map((d: any) => (d && d.value ? d.value : d));
            setMessages((s) => [...newDocs, ...s].slice(0, 200));
          } catch {}
        });
      } catch {}
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
      const id = `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const doc = {
        from: info.deviceName,
        deviceId: info.deviceId,
        text: payload,
        ts: new Date().toISOString(),
      };
      await svc.upsertDocument('debug_messages', doc, id);
      setMessages((s) => [doc, ...s].slice(0, 200));
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

        <ScrollView style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.mono}>{status}</Text>

          <Text style={styles.sectionTitle}>Peers ({peers.length})</Text>
          <FlatList
            data={peers}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.mono}>{item.id}</Text>
                <Text style={{ color: '#9ca3af' }}>{JSON.stringify(item.info)}</Text>
              </View>
            )}
          />

          <Text style={styles.sectionTitle}>Send Test Message</Text>
          <TextInput value={payload} onChangeText={setPayload} style={styles.input} placeholder="message payload" />
          <Button title="Send" onPress={sendTest} />

          <Text style={styles.sectionTitle}>Recent Messages</Text>
          <FlatList
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.msgRow}>
                <Text style={styles.mono}>{item.ts || ''}</Text>
                <Text>{item.from}: {item.text}</Text>
              </View>
            )}
          />
        </ScrollView>
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
  row: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#111827' },
  input: { backgroundColor: '#fff', padding: 8, borderRadius: 6, marginBottom: 8 },
  msgRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
});
