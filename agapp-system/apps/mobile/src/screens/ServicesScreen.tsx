import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';

export function ServicesScreen({ navigation }: any) {
  const { T } = useTheme();
  const { selectedLgu, profile } = useAuth();
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [activeForm, setActiveForm] = useState<any>(null);
  
  // Form state
  const [fullName, setFullName] = useState(profile?.name || '');
  const [purpose, setPurpose] = useState('');
  const [copies, setCopies] = useState('1');
  const verified = isVerified(profile);

  useEffect(() => {
    if (!selectedLgu || !profile) return;
    
    const fetchServices = async () => {
      // Fetch dynamic service types from system config
      const { data: configData } = await supabase
        .from('system_config')
        .select('value')
        .eq('lgu_id', selectedLgu.id)
        .eq('key', 'service_types')
        .single();
        
      if (configData?.value && Array.isArray(configData.value)) {
        setServiceTypes(configData.value);
      } else {
        // Fallback to default if not configured
        setServiceTypes([
          { id: 'birth', label: 'Birth Certificate', office: 'Civil Registrar', icon: 'document-outline' },
          { id: 'business', label: 'Business Permit', office: 'BPLO', icon: 'briefcase-outline' },
        ]);
      }

      // Fetch user's requests
      const { data: reqData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('citizen_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (reqData) setMyRequests(reqData);
    };

    fetchServices();
  }, [selectedLgu, profile]);

  const submitApplication = async () => {
    if (!verified) {
      Alert.alert('Verification Required', 'Please verify your identity before applying for services.');
      return;
    }
    if (!fullName || !purpose) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    const ref = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase.from('service_requests').insert({
      reference_number: ref,
      lgu_id: selectedLgu.id,
      citizen_id: profile.id,
      citizen_name: profile.name,
      service_type: activeForm.label,
      office_name: activeForm.office || 'LGU Office',
      status: 'Submitted',
      form_details: {
        full_name: fullName,
        purpose,
        copies: parseInt(copies, 10) || 1
      },
      qr_code_url: '',
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Application submitted. Reference: ${ref}`);
      setActiveForm(null);
      // Refresh list
      const { data } = await supabase.from('service_requests').select('*').eq('citizen_id', profile.id).order('created_at', { ascending: false });
      if (data) setMyRequests(data);
    }
  };

  if (activeForm) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} style={{ backgroundColor: T.bg }}>
          <TouchableOpacity style={{ marginBottom: 20 }} onPress={() => setActiveForm(null)}>
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </TouchableOpacity>
          
          <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>{activeForm.label}</Text>
          <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 24 }]}>
            Application form · Pay at Municipal Hall
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
          <View style={styles.grid}>
            {serviceTypes.map((s, idx) => (
              <TouchableOpacity
                key={s.id || idx}
                style={[styles.serviceCard, { backgroundColor: PASTELS[Object.keys(PASTELS)[idx % 6] as keyof typeof PASTELS] }]}
                onPress={() => setActiveForm(s)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={s.icon || 'document-outline'} size={22} color="#1A1A1A" />
                </View>
                <Text style={styles.serviceLabel}>{s.label || s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
                  <View style={[styles.statusPill, { backgroundColor: PASTELS.sage }]}>
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
});
