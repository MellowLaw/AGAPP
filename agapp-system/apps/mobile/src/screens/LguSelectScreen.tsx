import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function LguSelectScreen() {
  const { setSelectedLgu } = useAuth();
  const { T } = useTheme();
  const [lgus, setLgus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLgus = async () => {
      try {
        const { data, error } = await supabase.from('lgus').select('*').eq('is_active', true);
        if (!error && data) {
          setLgus(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLgus();
  }, []);

  return (
    <SafeAreaView style={[globalStyles.screen, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={[globalStyles.serif, { color: T.text, fontSize: 28, marginTop: 40 }]}>
          Select your LGU.
        </Text>
        <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 32 }]}>
          Choose your municipality to access local services and reports.
        </Text>

        {loading ? (
          <ActivityIndicator color={T.text} style={{ marginTop: 40 }} />
        ) : (
          lgus.map((lgu) => (
            <TouchableOpacity
              key={lgu.id}
              style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setSelectedLgu(lgu)}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: lgu.primary_color || T.chip, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF' }}>{lgu.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: T.text }}>{lgu.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={T.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
