import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenBackground } from '../components/ScreenBackground';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { isVerified } from '../utils/verification';
import { useToast } from '../components/Toast';
import {
  Briefcase,
  Card,
  DocumentText,
  Heart,
  Scroll,
  ClipboardText,
  Location,
  ArrowLeft2,
  TickCircle,
  Document,
  ShieldTick,
} from 'iconsax-react-native';

const OFFICE_ICONS: Record<string, any> = {
  'BPLO': Briefcase,
  "Treasurer's Office": Card,
  'Civil Registrar': DocumentText,
  'MSWDO': Heart,
  "Mayor's Office": Scroll,
  'Health Office': ClipboardText,
  'Municipal Planning and Development Office': Location,
};

export function ServicesScreen({ navigation }: any) {
  const { T, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { selectedLgu, profile } = useAuth();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'requests'>('services');

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
      setActiveTab('requests');
      refreshRequests();
    }
  };

  const officeGroups = catalog.reduce((acc: Record<string, any[]>, s) => {
    (acc[s.office_name] = acc[s.office_name] || []).push(s);
    return acc;
  }, {});

  const getStatusBadge = (status: string) => {
    let bgColor = '#E5E7EB';
    let textColor = '#374151';

    switch (status?.toLowerCase()) {
      case 'submitted':
        bgColor = '#E0F2FE';
        textColor = '#0369A1';
        break;
      case 'in progress':
      case 'processing':
        bgColor = '#FEF3C7';
        textColor = '#D97706';
        break;
      case 'resolved':
      case 'completed':
      case 'approved':
        bgColor = '#D1FAE5';
        textColor = '#059669';
        break;
      case 'rejected':
      case 'cancelled':
        bgColor = '#FEE2E2';
        textColor = '#DC2626';
        break;
    }

    return (
      <View style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: bgColor,
      }}>
        <Text style={{
          fontSize: 9,
          fontFamily: 'Octarine-Bold',
          color: textColor,
          textTransform: 'uppercase',
        }}>{status}</Text>
      </View>
    );
  };

  // ── Application form ────────────────────────────────────────────────────
  if (showForm && selectedService) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={{ marginBottom: 16 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setShowForm(false)}
          >
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>

          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 28, lineHeight: 32 }}>{selectedService.name}</Text>
          <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 4, marginBottom: 24, fontSize: 13 }}>
            Application form · {selectedService.fee_note}
          </Text>

          {!verified && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              backgroundColor: '#FEF3C7',
              borderWidth: 1,
              borderColor: '#F59E0B',
              marginBottom: 16,
              gap: 10,
            }}>
              <ShieldTick size={24} color="#B45309" variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#92400E', fontFamily: 'Octarine-Bold', fontSize: 14 }}>Verification Required</Text>
                <Text style={{ color: '#A16207', fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 2 }}>Verify your identity to submit service applications.</Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#B45309',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
                onPress={() => navigation.navigate('VerifyIdentity')}
              >
                <Text style={{ color: '#fff', fontFamily: 'Octarine-Bold', fontSize: 12 }}>Verify</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{
            backgroundColor: T.card,
            borderWidth: 1,
            borderColor: T.border,
            borderRadius: 24,
            padding: 20,
          }}>
            <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>FULL NAME</Text>
            <TextInput
              style={{
                height: 48,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.cardAlt,
                color: T.text,
                fontFamily: 'Inter-Medium',
                paddingHorizontal: 16,
                fontSize: 14,
                marginBottom: 16,
              }}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={T.textMuted}
            />

            <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>PURPOSE</Text>
            <TextInput
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.cardAlt,
                color: T.text,
                fontFamily: 'Inter-Medium',
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                height: 96,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. For employment"
              placeholderTextColor={T.textMuted}
              multiline
            />

            <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 6 }}>COPIES</Text>
            <TextInput
              style={{
                height: 48,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.cardAlt,
                color: T.text,
                fontFamily: 'Inter-Medium',
                paddingHorizontal: 16,
                fontSize: 14,
                marginBottom: 20,
              }}
              value={copies}
              onChangeText={setCopies}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={{
                height: 52,
                borderRadius: 999, // pill shape
                backgroundColor: !verified ? '#D1D5DB' : '#292929', // black button or disabled grey
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={verified ? submitApplication : () => navigation.navigate('VerifyIdentity')}
              disabled={!verified}
            >
              <Text style={{
                color: !verified ? '#9CA3AF' : '#FFFCF5',
                fontFamily: 'Octarine-Bold',
                fontSize: 15,
              }}>
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={{ marginBottom: 16 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setSelectedService(null)}
          >
            <ArrowLeft2 size={30} color={T.text} variant="Outline" />
          </TouchableOpacity>

          <Text style={{ color: T.textMuted, fontSize: 13, fontFamily: 'Inter-Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{selectedService.office_name}</Text>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 28, lineHeight: 32, marginBottom: 12 }}>{selectedService.name}</Text>
          {!!selectedService.description && (
            <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>{selectedService.description}</Text>
          )}

          <View style={{
            backgroundColor: T.card,
            borderWidth: 1,
            borderColor: T.border,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 4 }}>FEE</Text>
                <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, fontWeight: '700' }}>{selectedService.fee_note}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 4 }}>PROCESSING TIME</Text>
                <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, fontWeight: '700' }}>{selectedService.processing_time || 'Varies'}</Text>
              </View>
            </View>

            {requirements.length > 0 && (
              <>
                <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginBottom: 10 }}>REQUIREMENTS TO BRING</Text>
                {requirements.map((req, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <TickCircle size={18} color={T.accent} variant="Bold" style={{ marginRight: 8, marginTop: 1 }} />
                    <Text style={{ color: T.text, fontFamily: 'Inter-Medium', fontSize: 14, flex: 1, lineHeight: 18 }}>{req}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          <TouchableOpacity
            style={{
              height: 52,
              borderRadius: 999,
              backgroundColor: '#292929',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowForm(true)}
          >
            <Text style={{
              color: '#FFFCF5',
              fontFamily: 'Octarine-Bold',
              fontSize: 15,
            }}>
              Request this document
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Catalog list ─────────────────────────────────────────────────────────
  return (
    <ScreenBackground>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={{ fontFamily: 'Octarine-Bold', color: T.text, fontSize: 32 }}>Services.</Text>
          <Text style={{ fontFamily: 'Inter-Medium', color: T.text, marginTop: 4, fontSize: 14, lineHeight: 18 }}>
            Quick guide and downloadable forms for other essential city services.
          </Text>
        </View>

        {/* Tab navigation under title */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginTop: 8,
          marginBottom: 12,
          gap: 36,
        }}>
          <TouchableOpacity
            onPress={() => setActiveTab('services')}
            activeOpacity={0.8}
            style={{ paddingBottom: 6 }}
          >
            <Text style={{
              color: activeTab === 'services' ? T.text : T.textMuted,
              fontFamily: 'Octarine-Bold',
              fontSize: 18,
            }}>
              Services
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            activeOpacity={0.8}
            style={{ paddingBottom: 6 }}
          >
            <Text style={{
              color: activeTab === 'requests' ? T.text : T.textMuted,
              fontFamily: 'Octarine-Bold',
              fontSize: 18,
            }}>
              My Requests
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'services' ? (
            /* Catalog grid */
            catalog.length === 0 ? (
              <Text style={{ color: T.textMuted, fontFamily: 'Inter-Medium', fontSize: 14 }}>No services are available yet. Please check back later.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {catalog.map((s) => {
                  const IconComp = OFFICE_ICONS[s.office_name] || Document;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={{
                        width: '48%',
                        backgroundColor: T.card,
                        borderWidth: 1,
                        borderColor: T.border,
                        borderRadius: 20,
                        padding: 16,
                        marginBottom: 12,
                      }}
                      onPress={() => setSelectedService(s)}
                    >
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: T.accentSoft,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}>
                        <IconComp size={18} color="#292929" variant="Bold" />
                      </View>
                      <Text style={{ fontSize: 15, fontFamily: 'Octarine-Bold', color: T.text, lineHeight: 18 }}>{s.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            /* Requests list */
            myRequests.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ClipboardText size={48} color={T.textMuted} variant="Linear" />
                <Text style={{ fontFamily: 'Inter-Medium', color: T.textMuted, marginTop: 12, textAlign: 'center' }}>
                  You haven't submitted any service applications yet.
                </Text>
              </View>
            ) : (
              myRequests.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={{
                    flexDirection: 'row',
                    padding: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: T.border,
                    backgroundColor: T.card,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                  onPress={() => {
                    navigation.navigate('TrackingDetail', { id: r.id, type: 'service' });
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: T.textMuted, fontSize: 11, fontFamily: 'Inter-Medium' }}>{r.reference_number}</Text>
                    <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Octarine-Bold', marginTop: 2 }} numberOfLines={1}>{r.service_type}</Text>
                  </View>
                  {r.status === 'Submitted' && (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: T.border,
                        marginRight: 8,
                        backgroundColor: T.cardAlt,
                      }}
                      onPress={(e) => { e.stopPropagation(); withdrawRequest(r.id); }}
                    >
                      <Text style={{ color: '#DC2626', fontSize: 11, fontFamily: 'Octarine-Bold' }}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                  {getStatusBadge(r.status)}
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
    </ScreenBackground>
  );
}
