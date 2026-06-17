import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../utils/supabaseClient';
import { globalStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function TasksScreen({ navigation }: any) {
  const { T } = useTheme();
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!profile?.lgu_id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('lgu_id', profile.lgu_id)
        .in('status', ['Under Review', 'In Progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.lgu_id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return { bg: '#FEF3C7', text: '#D97706' };
      case 'In Progress': return { bg: '#DBEAFE', text: '#2563EB' };
      default: return { bg: T.border, text: T.textMuted };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity 
        style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 12 }]}
        onPress={() => navigation.navigate('TaskDetails', { task: item })}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View>
            <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{item.reference_number || item.id.substring(0, 8)}</Text>
            <Text style={{ color: T.textMuted, fontSize: 14 }}>{item.category.toUpperCase()}</Text>
          </View>
          <View style={{ backgroundColor: statusColor.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ color: statusColor.text, fontSize: 12, fontWeight: '600' }}>{item.status}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="location-outline" size={16} color={T.textMuted} style={{ marginRight: 6 }} />
          <Text style={{ color: T.textMuted, fontSize: 14 }}>{item.barangay}</Text>
        </View>

        {item.assigned_office && (
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Ionicons name="briefcase-outline" size={16} color={T.textMuted} style={{ marginRight: 6 }} />
             <Text style={{ color: T.textMuted, fontSize: 14 }}>Assigned to: {item.assigned_office}</Text>
           </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg }]}>
      <View style={{ padding: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.border }}>
        <Text style={[globalStyles.h2, { color: T.text }]}>My Tasks</Text>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTasks} tintColor={T.text} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="checkmark-circle-outline" size={48} color={T.border} style={{ marginBottom: 16 }} />
              <Text style={{ color: T.textMuted, fontSize: 16 }}>No active tasks assigned to you right now.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
