import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, 
  Image, Switch, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Camera, CameraView } from 'expo-camera';
import { 
  House, Bell, User, MapPin, Phone, 
  Chat, FileText, Camera as CameraIcon, Warning, PaperPlaneRight, CheckCircle,
  ArrowLeft, MagnifyingGlass, Question, Star,
  Newspaper, CaretRight, X
} from 'phosphor-react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// Mock DB Local Fallbacks (Muted Dusty Pastels matching design guidelines)
const LOCAL_LGUS = [
  {
    id: 'liliw-laguna',
    name: 'Municipality of Liliw',
    logo: 'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    primaryColor: '#A2B59F', // Sage Green
    secondaryColor: '#D9CDB8',
    latitude: 13.9297,
    longitude: 121.4644,
    featureFlags: { chatbot: true, potholeDetection: true, forum: true }
  },
  {
    id: 'nagcarlan-laguna',
    name: 'Municipality of Nagcarlan',
    logo: 'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
    primaryColor: '#9FADB5', // Dusty Blue
    secondaryColor: '#CAD3D9',
    latitude: 13.9214,
    longitude: 121.4157,
    featureFlags: { chatbot: false, potholeDetection: true, forum: false }
  }
];

export default function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [screen, setScreen] = useState('login'); // login, lgu-select, main
  const [activeTab, setActiveTab] = useState('home'); // home, services, reports, chatbot, settings
  
  // Theme & Settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLgu, setSelectedLgu] = useState<any>(LOCAL_LGUS[0]);
  const [citizen, setCitizen] = useState<any>({
    id: 'usr-citizen',
    email: 'lawrence@email.com',
    name: 'Lawrence Alcantara',
    role: 'CITIZEN',
    lguId: 'liliw-laguna',
    barangay: 'Poblacion'
  });

  // Inputs
  const [email, setEmail] = useState('lawrence@email.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Consents & Permissions
  const [consentLocation, setConsentLocation] = useState(true);
  const [consentPush, setConsentPush] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Forms
  const [reportCategory, setReportCategory] = useState('pothole');
  const [reportDesc, setReportDesc] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);
  const [mlConfidence, setMlConfidence] = useState<number | null>(null);

  // Chatbot Q&A
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'bot', text: 'Hello! I am your AGAPP Chatbot. Ask me anything about document applications or trash pick-up guidelines.' }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Request native hardware permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus === 'granted');

    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(locationStatus === 'granted');
  };

  const handleRequestOtp = () => {
    setOtpSent(true);
    Alert.alert('Simulated OTP', 'One-Time Passcode sent to email. Enter "123456" to proceed.');
  };

  const handleVerifyOtp = async () => {
    if (otpCode === '123456' || otpCode === '') {
      await requestPermissions();
      // Store token securely
      try {
        await SecureStore.setItemAsync('agapp_session_token', 'mock-jwt-stored-token');
      } catch (err) {}
      setScreen('lgu-select');
    } else {
      Alert.alert('Invalid Code', 'Please enter "123456" or leave blank for development bypass.');
    }
  };

  const handleSelectLgu = (lgu: any) => {
    setSelectedLgu(lgu);
    setAppLoading(true);
    setTimeout(() => {
      setAppLoading(false);
      setScreen('main');
    }, 1200);
  };

  const handleCameraSnap = () => {
    setCameraActive(false);
    // Simulate image capture & on-device YOLO detection
    const isPothole = reportCategory === 'pothole';
    setSnappedPhoto(isPothole ? 'https://placehold.co/400x300/57534e/ffffff?text=Pothole+Detected' : 'https://placehold.co/400x300/1e293b/ffffff?text=No+Damage');
    setMlConfidence(isPothole ? 0.94 : 0.12);
    
    if (isPothole) {
      Alert.alert('On-Device ML Result', 'YOLOv11: Pothole detected with 94% confidence.');
    } else {
      Alert.alert('On-Device ML Result', 'YOLOv11: No road damage detected. Marked as Low Credibility.');
    }
  };

  const submitReport = () => {
    if (!snappedPhoto) {
      Alert.alert('Missing Photo', 'Please snap a photo of the concern first.');
      return;
    }
    const newRep = {
      id: `rep-${Date.now()}`,
      referenceNumber: `REP-2026-${String(reports.length + 1).padStart(4, '0')}`,
      category: reportCategory,
      description: reportDesc,
      photoUrl: snappedPhoto,
      status: 'Submitted',
      mlConfidence: mlConfidence || 1.0,
      createdAt: new Date().toISOString()
    };
    setReports([newRep, ...reports]);
    setReportDesc('');
    setSnappedPhoto(null);
    setMlConfidence(null);
    setActiveTab('reports');
    Alert.alert('Success', 'Your report has been successfully submitted to ' + selectedLgu.name);
  };

  const submitServiceRequest = (type: string) => {
    const newReq = {
      id: `req-${Date.now()}`,
      referenceNumber: `REQ-2026-${String(serviceRequests.length + 1).padStart(4, '0')}`,
      serviceType: type,
      status: 'Submitted',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026',
      createdAt: new Date().toISOString()
    };
    setServiceRequests([newReq, ...serviceRequests]);
    setActiveTab('reports');
    Alert.alert('Application Submitted', 'Pay and pick up your documents over the counter at Liliw Municipal Hall.');
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    
    // Simple response matcher
    let botReply = "I am sorry, I couldn't find details in the FAQ. Would you like to file a ticket?";
    if (chatInput.toLowerCase().includes('permit') || chatInput.toLowerCase().includes('bplo')) {
      botReply = "BPLO Permit guidelines: Present barangay clearance & pay the assessment fee at the Municipal Treasurer.";
    } else if (chatInput.toLowerCase().includes('birth') || chatInput.toLowerCase().includes('civil')) {
      botReply = "Birth Certificate requests require a valid ID. Present your QR code at the Civil Registrar counter.";
    }

    setChatMessages(prev => [...prev, userMsg, { sender: 'bot', text: botReply }]);
    setChatInput('');
  };

  const styles = getStyles(isDarkMode);

  // 1. LOADING SCREEN
  if (appLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>Agapp<Text style={{ color: selectedLgu?.primaryColor || '#F497A2' }}>.</Text></Text>
        </View>
        <ActivityIndicator size="small" color={selectedLgu?.primaryColor || '#F497A2'} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // 2. LOGIN SCREEN
  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.loginHeader}>
            <Text style={styles.brandLogo}>Agapp.</Text>
            <Text style={styles.loginSubtitle}>Liliw Local Government Portal</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail}
              placeholder="lawrence@email.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

            {otpSent && (
              <>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput 
                  style={styles.input} 
                  value={otpCode} 
                  onChangeText={setOtpCode}
                  placeholder="123456"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </>
            )}

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={otpSent ? handleVerifyOtp : handleRequestOtp}
            >
              <Text style={styles.primaryButtonText}>
                {otpSent ? 'Login' : 'Send Passcode'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Permissions & Consent</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>GPS Geofence Tracking</Text>
              <Switch value={consentLocation} onValueChange={setConsentLocation} trackColor={{ true: '#F497A2' }} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Emergency Push Notifications</Text>
              <Switch value={consentPush} onValueChange={setConsentPush} trackColor={{ true: '#F497A2' }} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. LGU SELECTOR SCREEN
  if (screen === 'lgu-select') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.container}>
          <Text style={styles.sectionHeader}>Select LGU Jurisdiction</Text>
          <Text style={styles.sectionSubtitle}>Please select your resident municipality</Text>

          {LOCAL_LGUS.map(lgu => (
            <TouchableOpacity 
              key={lgu.id}
              style={[styles.lguCard, { borderLeftColor: lgu.primaryColor, borderLeftWidth: 6 }]}
              onPress={() => handleSelectLgu(lgu)}
            >
              <View style={styles.lguCardBody}>
                <Text style={styles.lguCardName}>{lgu.name}</Text>
                <Text style={styles.lguCardDetails}>Laguna, Region IV-A</Text>
              </View>
              <CaretRight size={20} color="#777" />
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // 4. MAIN DASHBOARD WITH TAB BAR
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{selectedLgu.name}</Text>
        </View>
        <TouchableOpacity onPress={() => setScreen('lgu-select')}>
          <Text style={{ color: selectedLgu.primaryColor, fontWeight: '600' }}>Switch LGU</Text>
        </TouchableOpacity>
      </View>

      {/* Camera Panel Overlay */}
      {cameraActive && (
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back">
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.closeCameraButton} onPress={() => setCameraActive(false)}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={handleCameraSnap}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>CAPTURE</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {/* Tabs */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === 'home' && (
          <View>
            <View style={[styles.heroBanner, { backgroundColor: selectedLgu.primaryColor }]}>
              <Text style={styles.heroText}>Bayan ng Liliw</Text>
              <Text style={styles.heroSubText}>Citizen Service & Governance Portal</Text>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>E-Services</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('services')}>
                <FileText size={24} color={selectedLgu.primaryColor} />
                <Text style={styles.actionText}>Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => { setReportCategory('pothole'); setActiveTab('reports'); }}>
                <Warning size={24} color={selectedLgu.primaryColor} />
                <Text style={styles.actionText}>Potholes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('chatbot')}>
                <Chat size={24} color={selectedLgu.primaryColor} />
                <Text style={styles.actionText}>AI Assistant</Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={styles.sectionTitle}>Emergency Access</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.emergencyRow} onPress={() => Alert.alert('Calling Police', 'Dialing Liliw PNP Hotline...')} >
                <Phone size={20} color="#F497A2" />
                <Text style={styles.emergencyLabel}>Police Department (PNP)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emergencyRow} onPress={() => Alert.alert('Calling Fire Dept', 'Dialing Liliw Bureau of Fire...')} >
                <Phone size={20} color="#F497A2" />
                <Text style={styles.emergencyLabel}>Fire Protection Bureau</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'services' && (
          <View>
            <Text style={styles.sectionTitle}>Online Document Requests</Text>
            <Text style={styles.sectionSubtitle}>Select document to apply. Present QR code at Treasurer counter for payment.</Text>

            <TouchableOpacity style={styles.documentCard} onPress={() => submitServiceRequest('Birth Certificate')} >
              <View style={{ flex: 1 }}>
                <Text style={styles.documentTitle}>Birth Certificate Request</Text>
                <Text style={styles.documentDesc}>LCR processing. SLA: 3 working days.</Text>
              </View>
              <CaretRight size={20} color="#777" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.documentCard} onPress={() => submitServiceRequest('Business Permit Renewal')} >
              <View style={{ flex: 1 }}>
                <Text style={styles.documentTitle}>Business Permit Renewal</Text>
                <Text style={styles.documentDesc}>BPLO clearance. SLA: 3 working days.</Text>
              </View>
              <CaretRight size={20} color="#777" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>Report Community Concern</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Select Category</Text>
              <View style={styles.categorySelector}>
                {['pothole', 'clogged_drainage', 'stray_animal'].map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.categoryPill, reportCategory === cat && { backgroundColor: selectedLgu.primaryColor }]}
                    onPress={() => setReportCategory(cat)}
                  >
                    <Text style={[styles.categoryText, reportCategory === cat && { color: '#1A1A1A', fontWeight: '600' }]}>{cat.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={styles.textArea} 
                value={reportDesc} 
                onChangeText={setReportDesc} 
                placeholder="Details of the road damage, stray animal, etc."
                placeholderTextColor="#999"
                multiline
              />

              <TouchableOpacity style={styles.cameraButton} onPress={() => setCameraActive(true)}>
                <CameraIcon size={20} color="#FFF" />
                <Text style={{ color: '#FFF', marginLeft: 8, fontWeight: '600' }}>Snap Photo (Run YOLOv11)</Text>
              </TouchableOpacity>

              {snappedPhoto && (
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <Image source={{ uri: snappedPhoto }} style={styles.previewImage} />
                  <Text style={{ marginTop: 4, color: '#888' }}>ML Confidence: {(mlConfidence || 0 * 100).toFixed(0)}%</Text>
                </View>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={submitReport}>
                <Text style={styles.primaryButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>

            {/* List Submitted Reports */}
            {reports.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Reports Queue</Text>
                {reports.map((rep: any) => (
                  <View key={rep.id} style={styles.reportItemCard}>
                    <Text style={styles.reportItemRef}>{rep.referenceNumber}</Text>
                    <Text style={styles.reportItemDesc}>{rep.description || 'No description provided'}</Text>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Status: <Text style={{ color: selectedLgu.primaryColor, fontWeight: '700' }}>{rep.status}</Text></Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {activeTab === 'chatbot' && (
          <View style={{ height: 450 }}>
            <Text style={styles.sectionTitle}>FAQ Chatbot Assistant</Text>
            <ScrollView style={styles.chatArea}>
              {chatMessages.map((msg, idx) => (
                <View key={idx} style={[styles.chatBubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={{ color: msg.sender === 'user' ? '#FFF' : '#1A1A1A' }}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput 
                style={styles.chatInput} 
                value={chatInput} 
                onChangeText={setChatInput} 
                placeholder="Ask about Cedula, Permits..." 
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.chatSendButton} onPress={sendChatMessage}>
                <PaperPlaneRight size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'settings' && (
          <View>
            <Text style={styles.sectionTitle}>App Personalization</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Dark Mode Theme</Text>
                <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ true: '#F497A2' }} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Document Compliance</Text>
            <View style={styles.card}>
              <Text style={{ color: isDarkMode ? '#e8e7e5' : '#1A1A1A', fontSize: 13, lineHeight: 18 }}>
                AGAPP is compliant with the Data Privacy Act of 2012 (Republic Act No. 10173). Citizen coordinates and captured images are processed solely for governance and concern tracking workflows.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Tab bar Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <House size={22} color={activeTab === 'home' ? selectedLgu.primaryColor : '#777'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && { color: selectedLgu.primaryColor }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('services')}>
          <FileText size={22} color={activeTab === 'services' ? selectedLgu.primaryColor : '#777'} />
          <Text style={[styles.tabLabel, activeTab === 'services' && { color: selectedLgu.primaryColor }]}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
          <Warning size={22} color={activeTab === 'reports' ? selectedLgu.primaryColor : '#777'} />
          <Text style={[styles.tabLabel, activeTab === 'reports' && { color: selectedLgu.primaryColor }]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('chatbot')}>
          <Chat size={22} color={activeTab === 'chatbot' ? selectedLgu.primaryColor : '#777'} />
          <Text style={[styles.tabLabel, activeTab === 'chatbot' && { color: selectedLgu.primaryColor }]}>Chatbot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('settings')}>
          <User size={22} color={activeTab === 'settings' ? selectedLgu.primaryColor : '#777'} />
          <Text style={[styles.tabLabel, activeTab === 'settings' && { color: selectedLgu.primaryColor }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getStyles(isDarkMode: boolean) {
  const bgBase = isDarkMode ? '#1A1A1A' : '#e8e7e5';
  const textBase = isDarkMode ? '#e8e7e5' : '#1A1A1A';
  const cardBg = isDarkMode ? '#222' : '#FFF';
  const borderColor = isDarkMode ? '#333' : '#DDD';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: bgBase,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
    },
    logoPill: {
      backgroundColor: '#2A2A2A',
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: '#333',
    },
    logoText: {
      color: '#FFF',
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: -1,
    },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: bgBase,
    },
    scrollContainer: {
      padding: 20,
      paddingBottom: 80,
    },
    loginHeader: {
      alignItems: 'center',
      marginVertical: 40,
    },
    brandLogo: {
      fontSize: 38,
      fontWeight: 'bold',
      color: textBase,
      letterSpacing: -1,
    },
    loginSubtitle: {
      fontSize: 14,
      color: '#777',
      marginTop: 6,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: borderColor,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textBase,
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: '#888',
      marginBottom: 6,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 12,
      paddingHorizontal: 12,
      color: textBase,
      marginBottom: 16,
      fontSize: 14,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f9f9f9',
    },
    primaryButton: {
      height: 48,
      backgroundColor: '#1A1A1A',
      borderColor: '#FFF',
      borderWidth: 0.5,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    primaryButtonText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '600',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    toggleLabel: {
      color: textBase,
      fontSize: 14,
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textBase,
      marginTop: 20,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: '#777',
      marginBottom: 20,
    },
    lguCard: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: borderColor,
    },
    lguCardBody: {
      flex: 1,
    },
    lguCardName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textBase,
    },
    lguCardDetails: {
      fontSize: 12,
      color: '#777',
      marginTop: 2,
    },
    header: {
      height: 56,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      backgroundColor: cardBg,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textBase,
    },
    heroBanner: {
      borderRadius: 18,
      padding: 24,
      marginBottom: 20,
    },
    heroText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1A1A1A',
    },
    heroSubText: {
      fontSize: 12,
      color: '#1A1A1A',
      opacity: 0.8,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textBase,
      marginBottom: 12,
      marginTop: 8,
    },
    horizontalScroll: {
      marginBottom: 20,
    },
    actionCard: {
      backgroundColor: cardBg,
      width: 100,
      height: 90,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    actionText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: textBase,
      marginTop: 8,
    },
    emergencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    emergencyLabel: {
      fontSize: 14,
      color: textBase,
      marginLeft: 12,
    },
    documentCard: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    documentTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: textBase,
    },
    documentDesc: {
      fontSize: 12,
      color: '#777',
      marginTop: 4,
    },
    categorySelector: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    categoryPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      backgroundColor: isDarkMode ? '#2A2A2A' : '#DDD',
      marginRight: 8,
    },
    categoryText: {
      fontSize: 12,
      color: textBase,
    },
    textArea: {
      height: 80,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 12,
      padding: 10,
      color: textBase,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f9f9f9',
      marginBottom: 12,
      fontSize: 14,
    },
    cameraButton: {
      height: 44,
      backgroundColor: '#1A1A1A',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    previewImage: {
      width: 120,
      height: 90,
      borderRadius: 8,
    },
    reportItemCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    reportItemRef: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#777',
    },
    reportItemDesc: {
      fontSize: 14,
      color: textBase,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      paddingTop: 8,
    },
    statusLabel: {
      fontSize: 12,
      color: '#888',
    },
    chatArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#222' : '#F2F1EF',
      borderRadius: 12,
      padding: 10,
      marginBottom: 10,
    },
    chatBubble: {
      padding: 10,
      borderRadius: 12,
      marginVertical: 4,
      maxWidth: '80%',
    },
    userBubble: {
      backgroundColor: '#000',
      alignSelf: 'flex-end',
    },
    botBubble: {
      backgroundColor: '#E3DFDA',
      alignSelf: 'flex-start',
    },
    chatInputRow: {
      flexDirection: 'row',
      height: 48,
    },
    chatInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 12,
      paddingHorizontal: 12,
      color: textBase,
      backgroundColor: cardBg,
      marginRight: 8,
    },
    chatSendButton: {
      width: 48,
      backgroundColor: '#1A1A1A',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: borderColor,
      backgroundColor: cardBg,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tabItem: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    tabLabel: {
      fontSize: 10,
      color: '#777',
      marginTop: 2,
    },
    cameraOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 40,
    },
    closeCameraButton: {
      position: 'absolute',
      top: 40,
      right: 20,
    },
    captureButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
    }
  });
}
