import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { OfflineSyncManager } from '../utils/OfflineSyncManager';

export function TaskDetailsScreen({ route, navigation }: any) {
  const { task } = route.params;
  const { T } = useTheme();
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    Alert.alert(
      "Confirm Resolution",
      "Are you sure you want to mark this task as Resolved?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Resolve", 
          onPress: async () => {
            setLoading(true);
            try {
              // Queue offline sync action
              await OfflineSyncManager.enqueueTask({
                type: 'UPDATE_REPORT_STATUS',
                payload: {
                  reportId: task.id,
                  status: 'Resolved'
                }
              });
              // Attempt immediate sync
              await OfflineSyncManager.syncAll();
              
              setStatus('Resolved');
              Alert.alert('Success', 'Task marked as resolved. (Will sync automatically if offline)');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: T.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={[globalStyles.h3, { color: T.text, margin: 0 }]}>Task Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header Info */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: T.textMuted, fontSize: 14, marginBottom: 4 }}>REFERENCE NUMBER</Text>
          <Text style={{ color: T.text, fontSize: 24, fontWeight: '700' }}>{task.reference_number || task.id.substring(0,8)}</Text>
          <View style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: status === 'Resolved' ? '#DCFCE7' : '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}>
            <Text style={{ color: status === 'Resolved' ? '#166534' : '#2563EB', fontSize: 14, fontWeight: '600' }}>
              {status}
            </Text>
          </View>
        </View>

        {/* Photo */}
        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 24, padding: 0, overflow: 'hidden' }]}>
          {task.photo_url ? (
            <Image source={{ uri: task.photo_url }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: 200, backgroundColor: T.border, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={48} color={T.textMuted} />
              <Text style={{ color: T.textMuted, marginTop: 8 }}>No photo provided</Text>
            </View>
          )}
        </View>

        {/* Details Grid */}
        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 24 }]}>
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>CATEGORY</Text>
            <Text style={{ color: T.text, fontSize: 16 }}>{task.category}</Text>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>LOCATION</Text>
            <Text style={{ color: T.text, fontSize: 16 }}>{task.barangay}</Text>
            <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 4 }}>Lat: {task.latitude}, Lng: {task.longitude}</Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>DESCRIPTION</Text>
            <Text style={{ color: T.text, fontSize: 16, lineHeight: 24 }}>{task.description || 'No description provided.'}</Text>
          </View>

          <View>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>REPORTED BY</Text>
            <Text style={{ color: T.text, fontSize: 16 }}>{task.citizen_name}</Text>
          </View>
        </View>

        {/* Actions */}
        {status !== 'Resolved' && (
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { backgroundColor: T.text }]} 
            onPress={handleResolve}
            disabled={loading}
          >
            <Text style={[globalStyles.primaryButtonText, { color: T.bg }]}>
              {loading ? 'Processing...' : 'Mark as Resolved'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
