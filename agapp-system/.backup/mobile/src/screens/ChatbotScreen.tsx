import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PASTELS } from '../theme';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import {
  ArrowLeft2,
  ArrowRight2,
  ArrowUp,
  Microphone,
  Refresh,
  Camera,
  Category2,
  Location,
  People,
  User,
  Discover,
} from 'iconsax-react-native';

const REDIRECT_SCREEN_ALLOWLIST = ['ReportsTab', 'ServicesTab', 'Explore', 'Forum'];

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
    <View style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: 24 }}>
      <Animated.View style={{ opacity: pulseAnim, marginBottom: -20 }}>
        <LottieView
          source={require('../../assets/brand/chatbot-message.json')}
          style={{ width: 120, height: 120 }}
          autoPlay
          loop
          renderMode="HARDWARE"
          colorFilters={[
            { keypath: 'head', color: T.accent },
            { keypath: 'ear', color: T.accent }
          ]}
        />
      </Animated.View>
      <View style={{ width: '100%', paddingLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted, fontSize: 13, fontFamily: 'Inter-Medium', fontStyle: 'italic' }}>Thinking...</Text>
      </View>
    </View>
  );
};

const TypeWriter = ({ text, color }: { text: string, color: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const step = Math.max(1, Math.floor(text.length / 50));
    const interval = setInterval(() => {
      i += step;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text]);
  return <Text style={{ color, fontSize: 15, fontFamily: 'Inter-Medium', lineHeight: 22 }}>{displayedText || ' '}</Text>;
};

export function ChatbotScreen() {
  const { T, isDarkMode } = useTheme();
  const { selectedLgu, session } = useAuth();
  const navigation = useNavigation<any>();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { sender: 'bot', text: 'Hi! I\'m your AGAPP assistant. Ask me about document applications, permits, or community concerns.' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading]);

  const getRedirectIcon = (screen: string) => {
    switch (screen) {
      case 'ReportsTab':
        return Camera;
      case 'ServicesTab':
        return Category2;
      case 'Explore':
        return Location;
      case 'Forum':
        return People;
      case 'Profile':
        return User;
      default:
        return Discover;
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride ?? chatInput;
    if (!text.trim() || !selectedLgu) return;
    
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

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={{ flex: 1 }}>
          {/* Header Bar */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: T.border, backgroundColor: T.bg }}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 8 }}>
                <ArrowLeft2 size={30} color={T.text} variant="Outline" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              {messages.length > 1 && (
                <TouchableOpacity onPress={handleReset} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999, // Pill layout
                  borderWidth: 1,
                  borderColor: T.border,
                  backgroundColor: T.card,
                }}>
                  <Refresh size={14} color={T.textMuted} variant="Bold" />
                  <Text style={{ fontSize: 11, fontFamily: 'Octarine-Bold', color: T.textMuted, marginLeft: 4 }}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Chat Messaging Area */}
          <View style={styles.chatArea}>
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }} 
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 1 && (
                <View style={styles.welcomeContainer}>
                  <Text style={{
                    fontSize: 26,
                    fontFamily: 'Octarine-Bold',
                    color: T.text,
                    marginBottom: 24,
                    lineHeight: 32,
                  }}>
                    What is on your mind today?
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
                        style={{
                          width: '100%',
                          padding: 16,
                          borderRadius: 20, // card radii 20
                          borderWidth: 1,
                          borderColor: T.border,
                          backgroundColor: T.card,
                        }}
                        onPress={() => sendMessage(item.title)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: T.text, lineHeight: 18 }} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {messages.map((m, idx) => {
                if (m.sender === 'user') {
                  return (
                    <View key={idx} style={styles.userMessageRow}>
                      <View style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: T.cardAlt,
                        borderWidth: 1,
                        borderColor: T.border,
                        maxWidth: '85%',
                      }}>
                        <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-Medium', lineHeight: 22 }}>
                          {m.text}
                        </Text>
                      </View>
                    </View>
                  );
                } else {
                  const RedirectIcon = m.redirect ? getRedirectIcon(m.redirect.screen) : null;
                  return (
                    <View key={idx} style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: 24 }}>
                      <LottieView
                        source={require('../../assets/brand/chatbot-message.json')}
                        style={{ width: 120, height: 120, marginBottom: -20 }}
                        autoPlay
                        loop={idx === messages.length - 1}
                        renderMode="HARDWARE"
                        colorFilters={[
                          { keypath: 'head', color: T.accent },
                          { keypath: 'ear', color: T.accent }
                        ]}
                      />
                      
                      <View style={{ width: '100%', paddingLeft: 4 }}>
                        {idx === 0 ? (
                          <Text style={{ color: T.text, fontSize: 15, fontFamily: 'Inter-Medium', lineHeight: 22 }}>
                            {m.text}
                          </Text>
                        ) : (
                          <TypeWriter text={m.text} color={T.text} />
                        )}
                        
                        {m.redirect && RedirectIcon && (
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: T.border,
                              backgroundColor: T.card,
                              marginTop: 12,
                              width: '100%',
                            }}
                            onPress={() => {
                              if (REDIRECT_SCREEN_ALLOWLIST.includes(m.redirect.screen)) {
                                navigation.navigate(m.redirect.screen);
                              }
                            }}
                            activeOpacity={0.85}
                          >
                            <RedirectIcon
                              size={18}
                              color={T.accent}
                              variant="Bold"
                              style={{ marginRight: 8 }}
                            />
                            <Text style={{ fontSize: 13, fontFamily: 'Octarine-Bold', color: T.text, flex: 1 }} numberOfLines={1}>
                              {m.redirect.label}
                            </Text>
                            <ArrowRight2 size={16} color={T.textMuted} variant="Bold" />
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
                  <TouchableOpacity 
                    key={idx} 
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999, // Pill layout
                      borderWidth: 1,
                      borderColor: T.border,
                      backgroundColor: T.card,
                    }} 
                    onPress={() => sendMessage(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: T.text, fontSize: 13, fontFamily: 'Inter-Medium' }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ChatGPT-style Input Box */}
          <View style={styles.chatInputBar}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 999, // Pill layout
              borderWidth: 1,
              borderColor: T.border,
              backgroundColor: T.card,
              paddingHorizontal: 16,
              paddingVertical: 6,
              width: '100%',
            }}>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontFamily: 'Inter-Medium',
                  color: T.text,
                  paddingVertical: 8,
                  maxHeight: 100,
                }}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything…"
                placeholderTextColor={T.textMuted}
                onSubmitEditing={() => sendMessage()}
                multiline
              />
              <View style={styles.inputActions}>
                <TouchableOpacity style={styles.micBtnInner}>
                  <Microphone size={20} color={T.text} variant="Bold" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{
                    width: 36, 
                    height: 36, 
                    borderRadius: 18, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: chatInput.trim() ? T.text : 'rgba(0,0,0,0.05)',
                  }} 
                  onPress={() => sendMessage()} 
                  disabled={loading || !chatInput.trim()}
                >
                  <ArrowUp
                    size={16}
                    color={chatInput.trim() ? T.bg : T.textMuted}
                    variant="Bold"
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
  chatArea: { flex: 1 },
  chatSuggestionsRow: { flexDirection: 'row', padding: 12, paddingHorizontal: 20, gap: 8 },
  chatInputBar: { 
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micBtnInner: {
    padding: 4,
  },
  welcomeContainer: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  suggestionsGrid: {
    width: '100%',
    gap: 12,
  },
  userMessageRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 16,
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
