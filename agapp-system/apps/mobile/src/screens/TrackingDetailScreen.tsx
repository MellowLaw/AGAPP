import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { globalStyles, PASTELS, ACCENT } from '../theme';
import { reportCategoryLabel } from '@agapp/shared';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';
import { useToast } from '../components/Toast';
import { getRelativeTime } from '../utils/timeAgo';

const SERVICE_STEPS = ['Submitted', 'Under Review', 'In Progress', 'Ready for Pickup', 'Released'];

function ServiceTimeline({ status, T }: { status: string; T: any }) {
  if (status === 'Rejected') return null;
  const currentIdx = SERVICE_STEPS.indexOf(status);
  return (
    <View style={{ marginBottom: 20 }}>
      {SERVICE_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === SERVICE_STEPS.length - 1;
        return (
          <View key={step} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 24 }}>
              <View style={[styles.timelineDot, { backgroundColor: done ? ACCENT : T.cardAlt, borderColor: done ? ACCENT : T.border }]} />
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: i < currentIdx ? ACCENT : T.border }]} />}
            </View>
            <Text style={{ color: done ? T.text : T.textMuted, fontWeight: done ? '700' : '400', fontSize: 14, marginLeft: 12, marginBottom: 18 }}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function TrackingDetailScreen({ route, navigation }: any) {
  const { id, type } = route.params;
  const { T } = useTheme();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const table = type === 'report' ? 'reports' : 'service_requests';

    const fetchDetail = async () => {
      setLoading(true);
      const { data: item } = await supabase.from(table).select('*').eq('id', id).single();
      if (item) setData(item);
      setLoading(false);
    };
    fetchDetail();

    // Live-update so the QR/timeline flip the moment staff changes status
    const channel = supabase
      .channel(`tracking-${type}-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `id=eq.${id}` }, (payload) => {
        setData(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, type]);

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: T.card, borderBottomWidth: 1, borderColor: T.border }}>
            <Ionicons name="arrow-back" size={24} color={T.text} onPress={() => navigation.goBack()} />
            <Text style={[globalStyles.serif, { color: T.text, fontSize: 22, marginLeft: 16 }]}>Details</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            {loading ? (
              <Text style={{ color: T.textMuted, fontSize: 14 }}>Loading…</Text>
            ) : (
              <>
                <Ionicons name="alert-circle-outline" size={40} color={T.textMuted} style={{ marginBottom: 12 }} />
                <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Not found</Text>
                <Text style={{ color: T.textMuted, fontSize: 14, textAlign: 'center', marginTop: 6 }}>
                  Not found, or you don't have access to this item.
                </Text>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
                <Text style={[styles.value, { color: T.text }]}>{reportCategoryLabel(data.category)}</Text>

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
                {/* Stray-animal reports are point-in-time sightings (animals
                    move), so this frames as "Last Seen" + relative time instead
                    of a plain, implicitly-live "Location" — see
                    Docs/Planning/Plan-StrayPets-Reporting.md. Other categories
                    keep the unchanged "LOCATION" / "GPS coordinates captured" line. */}
                {(data.latitude && data.longitude) && (
                  <>
                    <Text style={[styles.label, { color: T.textMuted }]}>
                      {data.category === 'stray_animal' ? 'LAST SEEN' : 'LOCATION'}
                    </Text>
                    <Text style={[styles.value, { color: T.text }]}>
                      {data.category === 'stray_animal'
                        ? `${data.barangay ? data.barangay + ' · ' : ''}${getRelativeTime(data.created_at)}`
                        : 'GPS coordinates captured'}
                    </Text>
                    <View style={{ height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: T.border }}>
                      <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                          latitude: data.latitude,
                          longitude: data.longitude,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                      >
                        <Marker coordinate={{ latitude: data.latitude, longitude: data.longitude }} />
                      </MapView>
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <ServiceTimeline status={data.status} T={T} />

                <Text style={[styles.label, { color: T.textMuted }]}>SERVICE TYPE</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.service_type}</Text>
                <Text style={[styles.label, { color: T.textMuted }]}>OFFICE</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.office_name}</Text>
                <Text style={[styles.label, { color: T.textMuted }]}>PURPOSE</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.form_details?.purpose}</Text>

                {data.status === 'Rejected' && data.reject_reason && (
                  <>
                    <Text style={[styles.label, { color: T.textMuted }]}>REASON</Text>
                    <Text style={[styles.value, { color: T.text }]}>{data.reject_reason}</Text>
                  </>
                )}
              </>
            )}
          </View>

          {type === 'service' && data.status === 'Ready for Pickup' && data.claim_code && (
            <View style={[globalStyles.card, { backgroundColor: PASTELS.butter, alignItems: 'center' }]}>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Ready for pickup!</Text>
              <Text style={{ color: '#4B4B4B', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                Show this QR at {data.office_name}. Pay the fee at the counter — the officer scans it to release your document.
              </Text>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16 }}>
                <QRCode value={`agap:claim:${data.claim_code}`} size={180} />
              </View>
              <Text style={{ color: '#6B6B6B', fontSize: 12, marginTop: 14 }}>Or give this code at the counter:</Text>
              <Text style={{ color: '#1A1A1A', fontSize: 22, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>{data.claim_code}</Text>
            </View>
          )}

          {type === 'service' && data.status === 'Released' && (
            <View style={[globalStyles.card, { backgroundColor: PASTELS.sage, alignItems: 'center' }]}>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '700' }}>Document released</Text>
              {data.released_at && (
                <Text style={{ color: '#4B4B4B', fontSize: 12, marginTop: 4 }}>
                  {new Date(data.released_at).toLocaleString()}
                </Text>
              )}
            </View>
          )}

          {data.status === 'Resolved' && type === 'report' && !data.rating && (
            <View style={[globalStyles.card, { backgroundColor: T.cardAlt, borderColor: T.border, alignItems: 'center' }]}>
              <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Rate the resolution</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1,2,3,4,5].map(star => (
                  <TouchableOpacity key={star} onPress={() => {
                    // Goes through the rate_report RPC, not a direct update:
                    // citizens have no UPDATE policy on reports (adding one would
                    // re-open the insert-forgery the §1 guards just closed), so
                    // the old direct .update() silently matched 0 rows and never
                    // persisted while still flipping the UI to "you rated this".
                    supabase.rpc('rate_report', { p_report_id: id, p_rating: star }).then(({ error }) => {
                      if (error) { showToast(`Rating failed: ${error.message}`, 'error'); return; }
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
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  timelineLine: { width: 2, flex: 1, minHeight: 14 },
});
