import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { OfflineSyncManager } from '../utils/OfflineSyncManager';

export function ProfileScreen() {
  const { T } = useTheme();
  const { profile, signOut } = useAuth();
  const [queueLength, setQueueLength] = React.useState(0);

  React.useEffect(() => {
    OfflineSyncManager.getQueue().then(q => setQueueLength(q.length));
  }, []);

  const handleManualSync = async () => {
    await OfflineSyncManager.syncAll();
    const q = await OfflineSyncManager.getQueue();
    setQueueLength(q.length);
    alert('Sync complete!');
  };

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={[globalStyles.h2, { color: T.text, marginBottom: 24 }]}>Officer Profile</Text>

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: T.border, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Ionicons name="person" size={24} color={T.textMuted} />
            </View>
            <View>
              <Text style={{ color: T.text, fontSize: 18, fontWeight: '600' }}>{profile?.name || 'Officer'}</Text>
              <Text style={{ color: T.textMuted, fontSize: 14 }}>{profile?.email}</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: T.border, paddingTop: 16 }}>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>ROLE</Text>
            <Text style={{ color: T.text, marginBottom: 12 }}>{profile?.role}</Text>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>LGU ID</Text>
            <Text style={{ color: T.text }}>{profile?.lgu_id || 'Not Assigned'}</Text>
          </View>
        </View>

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={[globalStyles.h3, { color: T.text, margin: 0 }]}>Offline Sync</Text>
            <View style={{ backgroundColor: queueLength > 0 ? '#FEF08A' : '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ color: queueLength > 0 ? '#854D0E' : '#166534', fontSize: 12, fontWeight: '600' }}>
                {queueLength} pending
              </Text>
            </View>
          </View>
          <Text style={{ color: T.textMuted, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
            Actions performed while offline will be queued and synced automatically when a connection is restored.
          </Text>
          <TouchableOpacity 
            style={[globalStyles.secondaryButton, { borderColor: T.border }]} 
            onPress={handleManualSync}
          >
            <Text style={[globalStyles.secondaryButtonText, { color: T.text }]}>Force Sync Now</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[globalStyles.secondaryButton, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]} 
          onPress={signOut}
        >
          <Text style={[globalStyles.secondaryButtonText, { color: '#DC2626' }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
