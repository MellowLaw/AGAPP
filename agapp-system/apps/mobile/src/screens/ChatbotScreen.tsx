import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { globalStyles, ACCENT, PASTELS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { AgappLogo } from '../components/AgappLogo';
import { useNavigation } from '@react-navigation/native';

const ThinkingIndicator = ({ T }: { T: any }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <View style={styles.botMessageRow}>
      <View style={[styles.botAvatar, { backgroundColor: '#1A1A1A' }]}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <AgappLogo size={12} bgColor="#1A1A1A" textColor="#FFFFFF" showText={false} />
        </Animated.View>
      </View>
      <View style={[styles.botMessageContent, { flexDirection: 'row', alignItems: 'center' }]}>
        <Text style={{ color: T.textMuted, fontSize: 13, fontStyle: 'italic' }}>Thinking...</Text>
      </View>
    </View>
  );
};

const TypeWriter = ({ text, color }: { text: string, color: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const step = Math.max(1, Math.floor(text.length / 50)); // Completes in ~50 frames
    const interval = setInterval(() => {
      i += step;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text]);
  return <Text style={{ color, fontSize: 15, lineHeight: 22 }}>{displayedText || ' '}</Text>;
};

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
    <SafeAreaView style={{ flex: 1, backgroundColor: T.card }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[globalStyles.screen, { backgroundColor: T.card }]}>
          {/* Header Bar */}
          <View style={{ padding: 20, paddingBottom: 12, backgroundColor: T.card }}>
            <View style={styles.chatHeader}>
              <AgappLogo size={24} bgColor="#1A1A1A" textColor="#FFFFFF" showText={false} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.chatHeaderTitle, { color: T.text }]}>AGAPP Assistant</Text>
                <Text style={[styles.chatHeaderSubtitle, { color: T.textMuted }]} numberOfLines={1}>
                  Online · {selectedLgu?.name.replace('Municipality of ', '')}
                </Text>
              </View>
              {messages.length > 1 && (
                <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { borderColor: T.border, backgroundColor: T.card }]}>
                  <Ionicons name="refresh" size={14} color={T.textMuted} />
                  <Text style={{ fontSize: 12, color: T.textMuted, marginLeft: 4, fontWeight: '500' }}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Chat Messaging Area */}
          <View style={[styles.chatArea, { backgroundColor: T.card, borderTopWidth: 0, borderBottomWidth: 0 }]}>
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }} 
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {/* ChatGPT-style Welcome Dashboard */}
              {messages.length === 1 && (
                <View style={styles.welcomeContainer}>
                  <Text style={[styles.welcomeTitle, { color: T.text }]}>
                    What are you thinking this afternoon?
                  </Text>

                  <View style={styles.suggestionsGrid}>
                    {[
                      { title: 'How do I apply for a business permit?' },
                      { title: 'How much is a cedula?' },
                      { title: 'How do I get a barangay clearance?' },
                      { title: 'How do I report a pothole?' },
                      { title: 'What are the office hours of the Municipal Hall?' }
                    ].map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.chatSuggestionCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}
                        onPress={() => sendMessage(item.title)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chatSuggestionText, { color: T.text }]} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Render Chat Messages (ChatGPT Style) */}
              {messages.map((m, idx) => {
                if (m.sender === 'user') {
                  return (
                    <View key={idx} style={styles.userMessageRow}>
                      <View style={[styles.userBubble, { backgroundColor: T.cardAlt }]}>
                        <Text style={{ color: T.text, fontSize: 15, lineHeight: 22 }}>
                          {m.text}
                        </Text>
                      </View>
                    </View>
                  );
                } else {
                  return (
                    <View key={idx} style={styles.botMessageRow}>
                      {/* Avatar */}
                      <View style={[styles.botAvatar, { backgroundColor: '#1A1A1A' }]}>
                        <AgappLogo size={12} bgColor="#1A1A1A" textColor="#FFFFFF" showText={false} />
                      </View>
                      
                      {/* Message Content */}
                      <View style={styles.botMessageContent}>
                        {idx === 0 ? (
                          <Text style={{ color: T.text, fontSize: 15, lineHeight: 22 }}>
                            {m.text}
                          </Text>
                        ) : (
                          <TypeWriter text={m.text} color={T.text} />
                        )}
                        
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
                    </View>
                  );
                }
              })}
              {loading && <ThinkingIndicator T={T} />}
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

          {/* ChatGPT-style Input Box */}
          <View style={[styles.chatInputBar, { backgroundColor: T.card }]}>
            <View style={[styles.chatInputCard, { backgroundColor: T.cardAlt, borderColor: T.border }]}>
              <TextInput
                style={[styles.chatInput, { color: T.text }]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything…"
                placeholderTextColor={T.textMuted}
                onSubmitEditing={() => sendMessage()}
                multiline
              />
              <View style={styles.inputActions}>
                <TouchableOpacity style={styles.micBtnInner}>
                  <Ionicons name="mic-outline" size={24} color={T.text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.chatSendInner, 
                    { backgroundColor: chatInput.trim() ? T.text : 'rgba(0,0,0,0.05)' }
                  ]} 
                  onPress={() => sendMessage()} 
                  disabled={loading || !chatInput.trim()}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={18} 
                    color={chatInput.trim() ? T.bg : T.textMuted} 
                  />
                </TouchableOpacity>
              </View>
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
  chatArea: { flex: 1 },
  chatSuggestionsRow: { flexDirection: 'row', padding: 12, paddingHorizontal: 20, gap: 8 },
  chatSuggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  chatInputBar: { 
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  chatInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    width: '100%',
  },
  chatInput: { 
    flex: 1, 
    fontSize: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micBtnInner: {
    padding: 4,
  },
  chatSendInner: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'left',
    lineHeight: 34,
  },
  suggestionsGrid: {
    width: '100%',
    gap: 12,
  },
  chatSuggestionCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  chatSuggestionText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  userMessageRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  botMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 24,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  botMessageContent: {
    flex: 1,
    marginLeft: 12,
  },
});
