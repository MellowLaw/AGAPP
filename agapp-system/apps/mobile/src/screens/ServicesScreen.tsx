import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';
import { useToast } from '../components/Toast';

const OFFICE_ICONS: Record<string, string> = {
  'BPLO': 'briefcase-outline',
  "Treasurer's Office": 'cash-outline',
  'Civil Registrar': 'document-text-outline',
  'MSWDO': 'heart-outline',
  "Mayor's Office": 'ribbon-outline',
  'Health Office': 'medkit-outline',
  'Municipal Planning and Development Office': 'map-outline',
};

export function ServicesScreen({ navigation }: any) {
  const { T } = useTheme();
  const { showToast } = useToast();
  const { selectedLgu, profile } = useAuth();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(profile?.name || '');
  const [purpose, setPurpose] = useState('');
  const [copies, setCopies] = useState('1');
  const verified = isVerified(profile);

  const withdrawRequest = (requestId: string) => {
    Alert.alert(
      'Withdraw application?',
      'This will cancel your submitted application. This cannot be undone.',
      [
        { text: 'Keep application', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('cancel_request', { p_request_id: requestId });
            if (error) {
              showToast(error.message, 'error');
            } else {
              showToast('Application withdrawn.', 'success');
              refreshRequests();
            }
          },
        },
      ],
    );
  };

  const refreshRequests = async () => {
    if (!profile) return;
    const { data } = await supabase.from('service_requests').select('*').eq('citizen_id', profile.id).order('created_at', { ascending: false });
    if (data) setMyRequests(data);
  };

  useEffect(() => {
    if (!selectedLgu || !profile) return;

    const fetchServices = async () => {
      const { data } = await supabase
        .from('lgu_services')
        .select('*')
        .eq('lgu_id', selectedLgu.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (data) setCatalog(data);
    };

    fetchServices();
    refreshRequests();
  }, [selectedLgu, profile]);

  const submitApplication = async () => {
    if (!verified) {
      showToast('Please verify your identity before applying for services.', 'error');
      return;
    }
    if (!fullName || !purpose) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const { data: inserted, error } = await supabase.from('service_requests').insert({
      lgu_id: selectedLgu.id,
      citizen_id: profile.id,
      citizen_name: profile.name,
      lgu_service_id: selectedService.id,
      service_type: selectedService.name,
      office_name: selectedService.office_name,
      status: 'Submitted',
      form_details: {
        full_name: fullName,
        purpose,
        copies: parseInt(copies, 10) || 1,
      },
    }).select('reference_number').single();

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(`Application submitted. Reference: ${inserted?.reference_number || 'N/A'}`, 'success');
      setShowForm(false);
      setSelectedService(null);
      setPurpose('');
      setCopies('1');
      refreshRequests();
    }
  };

  const officeGroups = catalog.reduce((acc: Record<string, any[]>, s) => {
    (acc[s.office_name] = acc[s.office_name] || []).push(s);
    return acc;
  }, {});

  // ── Application form ────────────────────────────────────────────────────
  if (showForm && selectedService) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} style={{ backgroundColor: T.bg }}>
          <TouchableOpacity style={{ marginBottom: 20 }} onPress={() => setShowForm(false)}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>

          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>{selectedService.name}</Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 24 }]}>
            Application form · {selectedService.fee_note}
          </Text>

          {!verified && (
            <View style={[styles.verificationBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 14 }}>Verification Required</Text>
                  <Text style={{ color: '#A16207', fontSize: 12, marginTop: 2 }}>Verify your identity to submit service applications.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.verifyBtn, { backgroundColor: '#B45309' }]}
                  onPress={() => navigation.navigate('VerifyIdentity')}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={[globalStyles.label, { color: T.textMuted }]}>FULL NAME</Text>
            <TextInput
              style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={T.textMuted}
            />

            <Text style={[globalStyles.label, { color: T.textMuted }]}>PURPOSE</Text>
            <TextInput
              style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border, height: 80, textAlignVertical: 'top' }]}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. For employment"
              placeholderTextColor={T.textMuted}
              multiline
            />

            <Text style={[globalStyles.label, { color: T.textMuted }]}>COPIES</Text>
            <TextInput
              style={[globalStyles.input, { color: T.text, backgroundColor: T.cardAlt, borderColor: T.border }]}
              value={copies}
              onChangeText={setCopies}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[globalStyles.primaryButton, { backgroundColor: !verified ? '#D1D5DB' : ACCENT, marginTop: 12 }]}
              onPress={verified ? submitApplication : () => navigation.navigate('VerifyIdentity')}
              disabled={!verified}
            >
              <Text style={[globalStyles.primaryButtonText, { color: !verified ? '#9CA3AF' : '#1A1A1A' }]}>
                {!verified ? 'Verify to Submit' : 'Submit application'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Detail sheet ─────────────────────────────────────────────────────────
  if (selectedService) {
    const requirements: string[] = Array.isArray(selectedService.requirements) ? selectedService.requirements : [];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} style={{ backgroundColor: T.bg }}>
          <TouchableOpacity style={{ marginBottom: 20 }} onPress={() => setSelectedService(null)}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>

          <Text style={{ color: T.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>{selectedService.office_name}</Text>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28, marginBottom: 10 }]}>{selectedService.name}</Text>
          {!!selectedService.description && (
            <Text style={[globalStyles.muted, { color: T.textMuted, marginBottom: 20 }]}>{selectedService.description}</Text>
          )}

          <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.metaLabel, { color: T.textMuted }]}>FEE</Text>
                <Text style={{ color: T.text, fontSize: 14, fontWeight: '600' }}>{selectedService.fee_note}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.metaLabel, { color: T.textMuted }]}>PROCESSING TIME</Text>
                <Text style={{ color: T.text, fontSize: 14, fontWeight: '600' }}>{selectedService.processing_time || 'Varies'}</Text>
              </View>
            </View>

            {requirements.length > 0 && (
              <>
                <Text style={[styles.metaLabel, { color: T.textMuted, marginBottom: 10 }]}>REQUIREMENTS TO BRING</Text>
                {requirements.map((req, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={T.textMuted} style={{ marginRight: 8, marginTop: 1 }} />
                    <Text style={{ color: T.text, fontSize: 14, flex: 1 }}>{req}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          <TouchableOpacity
            style={[globalStyles.primaryButton, { backgroundColor: ACCENT }]}
            onPress={() => setShowForm(true)}
          >
            <Text style={[globalStyles.primaryButtonText, { color: '#1A1A1A' }]}>Request this document</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Catalog list ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>Services.</Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 16 }]}>
            Apply online · pay & claim at the counter
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {Object.keys(officeGroups).length === 0 && (
            <Text style={{ color: T.textMuted, fontSize: 14 }}>No services are available yet. Please check back later.</Text>
          )}

          {Object.entries(officeGroups).map(([office, services], groupIdx) => (
            <View key={office} style={{ marginBottom: 20 }}>
              <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10 }}>
                {office.toUpperCase()}
              </Text>
              <View style={styles.grid}>
                {services.map((s, idx) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.serviceCard, { backgroundColor: PASTELS[Object.keys(PASTELS)[(groupIdx + idx) % 6] as keyof typeof PASTELS] }]}
                    onPress={() => setSelectedService(s)}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons name={(OFFICE_ICONS[office] || 'document-outline') as any} size={22} color="#1A1A1A" />
                    </View>
                    <Text style={styles.serviceLabel}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {myRequests.length > 0 && (
            <>
              <View style={globalStyles.sectionHeader}>
                <Text style={[globalStyles.sectionTitle, { color: T.text }]}>My applications</Text>
              </View>
              {myRequests.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.requestCard, { backgroundColor: T.card, borderColor: T.border }]}
                  onPress={() => navigation.navigate('TrackingDetail', { id: r.id, type: 'service' })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '600' }}>{r.reference_number}</Text>
                    <Text style={{ color: T.text, fontSize: 16, fontWeight: '600', marginTop: 2 }}>{r.service_type}</Text>
                  </View>
                  {r.status === 'Submitted' && (
                    <TouchableOpacity
                      style={[styles.withdrawBtn, { borderColor: T.border }]}
                      onPress={(e) => { e.stopPropagation(); withdrawRequest(r.id); }}
                    >
                      <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700' }}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                  <View style={[styles.statusPill, { backgroundColor: r.status === 'Ready for Pickup' ? PASTELS.butter : PASTELS.sage }]}>
                    <Text style={styles.statusPillText}>{r.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verificationBanner: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  verifyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: { width: '48%', padding: 20, borderRadius: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  serviceLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  requestCard: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  withdrawBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  metaLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
});
