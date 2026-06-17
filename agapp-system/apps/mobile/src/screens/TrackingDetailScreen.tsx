import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

export function TrackingDetailScreen({ route, navigation }: any) {
  const { id, type } = route.params;
  const { T } = useTheme();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const table = type === 'report' ? 'reports' : 'service_requests';
      const { data: item } = await supabase.from(table).select('*').eq('id', id).single();
      if (item) setData(item);
    };
    fetchDetail();
  }, [id, type]);

  if (!data) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: T.card, borderBottomWidth: 1, borderColor: T.border }}>
          <Ionicons name="arrow-back" size={24} color={T.text} onPress={() => navigation.goBack()} />
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 22, marginLeft: 16 }]}>Details</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
              REFERENCE NUMBER
            </Text>
            <Text style={{ color: T.text, fontSize: 24, fontWeight: '700', marginBottom: 16 }}>
              {data.reference_number}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={[styles.statusPill, { backgroundColor: PASTELS.sage }]}>
                <Text style={styles.statusPillText}>{data.status}</Text>
              </View>
              <Text style={{ color: T.textMuted, fontSize: 14, marginLeft: 12 }}>
                Updated {new Date(data.updated_at || data.created_at).toLocaleDateString()}
              </Text>
            </View>

            {type === 'report' ? (
              <>
                <Text style={[styles.label, { color: T.textMuted }]}>CATEGORY</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.category}</Text>

                {data.photo_url && (
                  <>
                    <Text style={[styles.label, { color: T.textMuted }]}>PHOTO PROOF</Text>
                    <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', marginTop: 4, marginBottom: 16, borderWidth: 1, borderColor: T.border }}>
                      <Image source={{ uri: data.photo_url }} style={{ flex: 1 }} resizeMode="cover" />
                    </View>
                  </>
                )}

                <Text style={[styles.label, { color: T.textMuted }]}>DESCRIPTION</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.description}</Text>
                {data.location && (
                  <>
                    <Text style={[styles.label, { color: T.textMuted }]}>LOCATION</Text>
                    <Text style={[styles.value, { color: T.text }]}>{data.location.address || 'GPS coordinates captured'}</Text>
                    <View style={{ height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: T.border }}>
                      <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                          latitude: data.location.lat,
                          longitude: data.location.lng,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                      >
                        <Marker coordinate={{ latitude: data.location.lat, longitude: data.location.lng }} />
                      </MapView>
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: T.textMuted }]}>SERVICE TYPE</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.service_type}</Text>
                <Text style={[styles.label, { color: T.textMuted }]}>OFFICE</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.office_name}</Text>
                <Text style={[styles.label, { color: T.textMuted }]}>PURPOSE</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.form_details?.purpose}</Text>
              </>
            )}
          </View>

          {data.status === 'Resolved' && type === 'report' && !data.rating && (
            <View style={[globalStyles.card, { backgroundColor: T.cardAlt, borderColor: T.border, alignItems: 'center' }]}>
              <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Rate the resolution</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1,2,3,4,5].map(star => (
                  <TouchableOpacity key={star} onPress={() => {
                    supabase.from('reports').update({ rating: star }).eq('id', id).then(() => {
                      setData({ ...data, rating: star });
                    });
                  }}>
                    <Ionicons name="star-outline" size={32} color={T.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {data.rating && (
             <View style={[globalStyles.card, { backgroundColor: PASTELS.sage, alignItems: 'center' }]}>
               <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '700' }}>You rated this {data.rating} stars</Text>
             </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  value: { fontSize: 16, marginBottom: 16 },
});
