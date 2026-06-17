import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { AgappLogo } from '../components/AgappLogo';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export function ChatbotScreen() {
  const { T } = useTheme();
  const { selectedLgu, session } = useAuth();
  const navigation = useNavigation<any>();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { sender: 'bot', text: 'Hi! I\'m your AGAPP assistant. Ask me about document applications, permits, or community concerns.' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = 85;
  }

  // Scroll to bottom when messages list or loading state updates
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading]);

  const getRedirectIcon = (screen: string) => {
    switch (screen) {
      case 'ReportsTab':
        return 'camera-outline';
      case 'ServicesTab':
        return 'grid-outline';
      case 'MapTab':
        return 'map-outline';
      case 'Forum':
        return 'people-outline';
      case 'Profile':
        return 'person-outline';
      default:
        return 'navigate-outline';
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride ?? chatInput;
    if (!text.trim() || !selectedLgu) return;
    
    // Prepare history context: send last 4 messages to preserve context
    const historyContext = messages.slice(-4).map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/chatbot/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lguId: selectedLgu.id,
          query: text,
          history: historyContext
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.answer || "I'm having trouble understanding right now.",
          redirect: data.redirect || null
        }
      ]);
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError' 
        ? "The server took too long to respond. Ensure the backend is running." 
        : "I couldn't reach the server or an error occurred. Please try again later.";
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg, redirect: null }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      { sender: 'bot', text: 'Hi! I\'m your AGAPP assistant. Ask me about document applications, permits, or community concerns.' }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[globalStyles.screen, { backgroundColor: T.bg }]}>
          {/* Header Bar */}
          <View style={{ padding: 20, paddingBottom: 12 }}>
            <View style={styles.chatHeader}>
              <AgappLogo size={24} bgColor="#1A1A1A" textColor="#FFFFFF" showText={false} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.chatHeaderTitle, { color: T.text }]}>AGAPP Assistant</Text>
                <Text style={[styles.chatHeaderSubtitle, { color: T.textMuted }]} numberOfLines={1}>
                  Online · {selectedLgu?.name.replace('Municipality of ', '')}
                </Text>
              </View>
              {messages.length > 1 && (
                <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { borderColor: T.border }]}>
                  <Ionicons name="refresh" size={14} color={T.textMuted} />
                  <Text style={{ fontSize: 12, color: T.textMuted, marginLeft: 4, fontWeight: '500' }}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Chat Messaging Area */}
          <View style={[styles.chatArea, { backgroundColor: T.card, borderColor: T.border }]}>
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }} 
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Claude-style Welcome Dashboard */}
              {messages.length === 1 && (
                <View style={styles.welcomeContainer}>
                  <View style={[styles.welcomeAvatar, { backgroundColor: ACCENT }]}>
                    <Ionicons name="sparkles" size={26} color="#1A1A1A" />
                  </View>
                  <Text style={[globalStyles.serif, styles.welcomeTitle, { color: T.text }]}>
                    How can I help you today?
                  </Text>
                  <Text style={[styles.welcomeSubtitle, { color: T.textMuted }]}>
                    Ask about municipal services, reports, or town news. Tap a topic below to start.
                  </Text>

                  <View style={styles.suggestionsGrid}>
                    {[
                      {
                        title: 'Business Permit',
                        desc: 'Apply or renew business permit',
                        icon: 'business-outline',
                        color: PASTELS.sage,
                        text: 'How do I apply for a business permit?'
                      },
                      {
                        title: 'Birth Certificate',
                        desc: 'Request civil registry documents',
                        icon: 'document-text-outline',
                        color: PASTELS.blue,
                        text: 'How do I request a birth certificate?'
                      },
                      {
                        title: 'Report Pothole',
                        desc: 'Flag road issues for engineering',
                        icon: 'construct-outline',
                        color: PASTELS.pink,
                        text: 'Report a pothole'
                      },
                      {
                        title: 'Municipal Hall',
                        desc: 'Where is the town hall located?',
                        icon: 'map-outline',
                        color: PASTELS.cream,
                        text: 'Where is the Municipal Hall?'
                      },
                      {
                        title: 'Community Forum',
                        desc: 'Talk or collaborate with citizens',
                        icon: 'people-outline',
                        color: PASTELS.lilac,
                        text: 'How can I participate in the community forum?'
                      },
                      {
                        title: 'Track Status',
                        desc: 'Lookup report SLA and progress',
                        icon: 'search-outline',
                        color: PASTELS.butter,
                        text: 'Track my report status'
                      }
                    ].map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.suggestionCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}
                        onPress={() => sendMessage(item.text)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.suggestionIconWrapper, { backgroundColor: item.color }]}>
                          <Ionicons name={item.icon as any} size={15} color="#1A1A1A" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.suggestionCardTitle, { color: T.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={[styles.suggestionCardDesc, { color: T.textMuted }]} numberOfLines={1}>
                            {item.desc}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={14} color={T.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Render Chat Messages */}
              {messages.map((m, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.chatBubble, 
                    m.sender === 'user' 
                      ? [styles.userBubble, { backgroundColor: T.text }] 
                      : [styles.botBubble, { backgroundColor: T.cardAlt, borderColor: T.border }]
                  ]}
                >
                  <Text style={{ color: m.sender === 'user' ? T.bg : T.text, fontSize: 15, lineHeight: 22 }}>
                    {m.text}
                  </Text>
                  {m.redirect && (
                    <TouchableOpacity
                      style={[styles.redirectBtn, { backgroundColor: T.card, borderColor: T.border }]}
                      onPress={() => navigation.navigate(m.redirect.screen)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={getRedirectIcon(m.redirect.screen) as any}
                        size={16}
                        color={ACCENT}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.redirectBtnText, { color: T.text }]} numberOfLines={1}>
                        {m.redirect.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={T.textMuted} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {loading && (
                <View style={[styles.chatBubble, styles.botBubble, { backgroundColor: T.cardAlt, borderColor: T.border, alignSelf: 'flex-start', width: 60, alignItems: 'center' }]}>
                  <Text style={{ color: T.text }}>•••</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Slim Horizontal Quick Suggestions Bar */}
          {messages.length > 1 && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chatSuggestionsRow}>
                {[
                  'Business permit application',
                  'Report a road concern',
                  'Track my existing report',
                  'Where is the municipal hall?'
                ].map((s, idx) => (
                  <TouchableOpacity key={idx} style={[styles.chatSuggestionChip, { backgroundColor: T.card, borderColor: T.border }]} onPress={() => sendMessage(s)}>
                    <Text style={{ color: T.text, fontSize: 13, fontWeight: '500' }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Claude-style Floating Prompt Box */}
          <View style={[styles.chatInputBar, { backgroundColor: T.bg }]}>
            <View style={[styles.chatInputCard, { backgroundColor: T.card, borderColor: T.border }]}>
              <TouchableOpacity style={styles.chatAttachBtnInner}>
                <Ionicons name="add-circle" size={24} color={T.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={[styles.chatInput, { color: T.text }]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything…"
                placeholderTextColor={T.textMuted}
                onSubmitEditing={() => sendMessage()}
                multiline
              />
              <TouchableOpacity 
                style={[
                  styles.chatSendInner, 
                  { backgroundColor: chatInput.trim() ? T.text : T.cardAlt }
                ]} 
                onPress={() => sendMessage()} 
                disabled={loading || !chatInput.trim()}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={16} 
                  color={chatInput.trim() ? T.bg : T.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chatHeader: { flexDirection: 'row', alignItems: 'center' },
  chatHeaderTitle: { fontSize: 18, fontWeight: '700' },
  chatHeaderSubtitle: { fontSize: 13, fontWeight: '500' },
  chatArea: { flex: 1, borderTopWidth: 1, borderBottomWidth: 1 },
  chatBubble: { 
    padding: 16, 
    borderRadius: 20, 
    maxWidth: '85%', 
    marginBottom: 16,
  },
  userBubble: { 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 4,
  },
  botBubble: { 
    alignSelf: 'flex-start', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  chatSuggestionsRow: { flexDirection: 'row', padding: 12, paddingHorizontal: 20, gap: 8 },
  chatSuggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  chatInputBar: { 
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chatInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  chatAttachBtnInner: {
    padding: 4,
    marginRight: 6,
  },
  chatInput: { 
    flex: 1, 
    fontSize: 15,
    paddingVertical: 6,
    maxHeight: 80,
  },
  chatSendInner: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8,
  },
  redirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    width: '100%'
  },
  redirectBtnText: {
    fontSize: 13,
    fontWeight: '600'
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  welcomeContainer: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  suggestionsGrid: {
    width: '100%',
    gap: 10,
  },
  suggestionCard: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionCardDesc: {
    fontSize: 11,
  },
});
