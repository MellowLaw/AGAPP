import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { PASTELS } from '../theme';
import { reportCategoryLabel } from '@agapp/shared';
import MapView, { Marker } from 'react-native-maps';
import QRCode from 'react-native-qrcode-svg';
import { useToast } from '../components/Toast';
import { getRelativeTime } from '../utils/timeAgo';
import { ArrowLeft2, Star, Danger } from 'iconsax-react-native';

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
              <View style={[styles.timelineDot, { backgroundColor: done ? T.accent : T.cardAlt, borderColor: done ? T.accent : T.border }]} />
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: i < currentIdx ? T.accent : T.border }]} />}
            </View>
            <Text style={{ color: done ? T.text : T.textMuted, fontFamily: 'Octarine-Bold', fontSize: 14, marginLeft: 12, marginBottom: 18 }}>
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
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    const table = type === 'report' ? 'reports' : 'service_requests';

    const fetchDetail = async () => {
      setLoading(true);
      const { data: item } = await supabase.from(table).select('*').eq('id', id).single();
      if (item) setData(item);
      setLoading(false);
    };
    fetchDetail();

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
        {/* Tinted Map Background */}
        <Image
          source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: isDarkMode ? 0.04 : 0.07,
            tintColor: T.accent,
          }}
          resizeMode="cover"
        />

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: T.border }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <ArrowLeft2 size={30} color={T.text} variant="Outline" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 20, marginLeft: 16 }}>Details</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            {loading ? (
              <ActivityIndicator color={T.text} />
            ) : (
              <>
                <Danger size={40} color={T.textMuted} variant="Bold" style={{ marginBottom: 12 }} />
                <Text style={{ color: T.text, fontFamily: 'Octarine-Bold', fontSize: 18, textAlign: 'center' }}>Not Found</Text>
                <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 14, textAlign: 'center', marginTop: 6 }}>
                  Item not found, or you do not have permission.
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
      {/* Tinted Map Background */}
      <Image
        source={isDarkMode ? require('../../assets/brand/bg-map-2.png') : require('../../assets/brand/bg-map-1.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          opacity: isDarkMode ? 0.04 : 0.07,
          tintColor: T.accent,
        }}
        resizeMode="cover"
      />

      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderColor: T.border,
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 20, marginLeft: 16 }}>Details</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={{
            backgroundColor: T.card,
            borderColor: T.border,
            borderWidth: 1,
            borderRadius: 24, // card radii 24
            padding: 20,
            marginBottom: 16,
          }}>
            <Text style={{ color: T.textMuted, fontSize: 11, fontFamily: 'Octarine-Bold', letterSpacing: 1, marginBottom: 4 }}>
              REFERENCE NUMBER
            </Text>
            <Text style={{ color: T.text, fontSize: 24, fontFamily: 'Octarine-Bold', marginBottom: 16 }}>
              {data.reference_number}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={[styles.statusPill, { backgroundColor: PASTELS.sage }]}>
                <Text style={styles.statusPillText}>{data.status}</Text>
              </View>
              <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 13, marginLeft: 12 }}>
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
                    <View style={{ height: 180, borderRadius: 14, overflow: 'hidden', marginTop: 4, marginBottom: 16, borderWidth: 1, borderColor: T.border }}>
                      <Image source={{ uri: data.photo_url }} style={{ flex: 1 }} resizeMode="cover" />
                    </View>
                  </>
                )}

                <Text style={[styles.label, { color: T.textMuted }]}>DESCRIPTION</Text>
                <Text style={[styles.value, { color: T.text }]}>{data.description}</Text>

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
                    <View style={{ height: 150, borderRadius: 14, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: T.border }}>
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
            <View style={{
              backgroundColor: PASTELS.butter,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 24,
              padding: 20,
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontFamily: 'Octarine-Bold', marginBottom: 4 }}>Ready for pickup!</Text>
              <Text style={{ color: '#4B4B4B', fontSize: 13, fontFamily: 'Inter-Medium', textAlign: 'center', marginBottom: 16 }}>
                Show this QR at {data.office_name}. Pay the fee at the counter — the officer scans it to release your document.
              </Text>
              <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16 }}>
                <QRCode value={`agap:claim:${data.claim_code}`} size={180} />
              </View>
              <Text style={{ color: '#6B6B6B', fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 14 }}>Or give this code at the counter:</Text>
              <Text style={{ color: '#1A1A1A', fontSize: 22, fontFamily: 'Octarine-Bold', letterSpacing: 2, marginTop: 4 }}>{data.claim_code}</Text>
            </View>
          )}

          {type === 'service' && data.status === 'Released' && (
            <View style={{
              backgroundColor: PASTELS.sage,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 24,
              padding: 20,
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontFamily: 'Octarine-Bold' }}>Document released</Text>
              {data.released_at && (
                <Text style={{ color: '#4B4B4B', fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 4 }}>
                  {new Date(data.released_at).toLocaleString()}
                </Text>
              )}
            </View>
          )}

          {data.status === 'Resolved' && type === 'report' && !data.rating && (
            <View style={{
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 24,
              padding: 20,
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ color: T.text, fontSize: 16, fontFamily: 'Octarine-Bold', marginBottom: 12 }}>Rate the resolution</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1,2,3,4,5].map(star => {
                  const isHovered = hoverRating !== null && star <= hoverRating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPressIn={() => setHoverRating(star)}
                      onPressOut={() => setHoverRating(null)}
                      onPress={() => {
                        supabase.rpc('rate_report', { p_report_id: id, p_rating: star }).then(({ error }) => {
                          if (error) { showToast(`Rating failed: ${error.message}`, 'error'); return; }
                          setData({ ...data, rating: star });
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Star size={32} color={isHovered ? T.accent : T.textMuted} variant={isHovered ? 'Bold' : 'Linear'} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {data.rating && (
            <View style={{
              backgroundColor: PASTELS.sage,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 24,
              padding: 20,
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ color: '#1A1A1A', fontSize: 16, fontFamily: 'Octarine-Bold' }}>You rated this {data.rating} stars</Text>
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontFamily: 'Octarine-Bold', color: '#1A1A1A' },
  label: { fontSize: 11, fontFamily: 'Octarine-Bold', letterSpacing: 0.8, marginBottom: 4 },
  value: { fontSize: 15, fontFamily: 'Inter-Medium', marginBottom: 16 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  timelineLine: { width: 2, flex: 1, minHeight: 14 },
});
