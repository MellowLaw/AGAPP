import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

export function ProfileScreen() {
  const { T, isDarkMode, setIsDarkMode } = useTheme();
  const { profile, selectedLgu, signOut } = useAuth();
  const [consentLocation, setConsentLocation] = useState(true);

  // Parse first name/initials
  const name = profile?.name || 'Citizen';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={[globalStyles.serif, { color: T.text, fontSize: 28 }]}>Profile.</Text>
        <Text style={[globalStyles.muted, { color: T.textMuted, marginTop: 6, marginBottom: 22 }]}>
          Account · settings · privacy
        </Text>

        <View style={[styles.profileCard, { backgroundColor: selectedLgu?.color || PASTELS.sage }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileMeta}>{profile?.email}</Text>
          <View style={styles.profileBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#1A1A1A" />
            <Text style={styles.profileBadgeText}>Citizen · Verified</Text>
          </View>
        </View>

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
          <TouchableOpacity style={styles.menuRow} onPress={() => setIsDarkMode(!isDarkMode)}>
            <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="moon-outline" size={18} color={T.text} /></View>
            <Text style={[styles.menuLabel, { color: T.text }]}>Dark mode</Text>
            <View style={[styles.toggleTrack, { backgroundColor: isDarkMode ? '#F497A2' : T.chip }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isDarkMode ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: T.border }]} />
          
          <TouchableOpacity style={styles.menuRow} onPress={() => setConsentLocation(!consentLocation)}>
            <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name="location-outline" size={18} color={T.text} /></View>
            <Text style={[styles.menuLabel, { color: T.text }]}>GPS geofence access</Text>
            <View style={[styles.toggleTrack, { backgroundColor: consentLocation ? '#F497A2' : T.chip }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: consentLocation ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[globalStyles.card, { backgroundColor: T.card, borderColor: T.border, padding: 4 }]}>
          {[
            { icon: 'document-text-outline', label: 'Privacy notice (RA 10173)' },
            { icon: 'help-circle-outline', label: 'Help & support' },
            { icon: 'log-out-outline',     label: 'Sign out', onPress: signOut },
          ].map((m, i, arr) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.menuRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}
              onPress={m.onPress}
            >
              <View style={[styles.menuIcon, { backgroundColor: T.cardAlt }]}><Ionicons name={m.icon as any} size={18} color={T.text} /></View>
              <Text style={[styles.menuLabel, { color: T.text }]}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[globalStyles.muted, { color: T.textMuted, textAlign: 'center', marginTop: 16, fontSize: 11 }]}>
          AGAPP · v1.0.0 · Compliant with RA 10173
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: { padding: 32, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  profileInitials: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  profileName: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  profileMeta: { fontSize: 14, fontWeight: '500', color: 'rgba(26,26,26,0.6)', marginBottom: 12 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  profileBadgeText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginLeft: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  divider: { height: 1, marginLeft: 68 },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
});
