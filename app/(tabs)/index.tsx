import { AntDesign } from '@expo/vector-icons'; // <--- BUNU EKLEDİK (Garanti İkon)
import { Picker } from "@react-native-picker/picker";
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db, initDB } from "../../src/database/db";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 375;

const COLORS = {
  bg: "#faebf5",          
  textMain: "#140f07",    
  primary: "#212b49",     
  secondary: "#5960a0",   
  accent: "#9da1fa",      
  cardBg: "#FFFFFF",      
  danger: "#EF4444",      
  success: "#10B981",     
};

type StatItem = {
  category: string;
  totalDuration: number;
};

type TimerMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now.getTime() - offset);
  return localTime.toISOString();
};

export default function Index() {
  const [mode, setMode] = useState<TimerMode>('FOCUS');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState("Ders Çalışma");
  const [distractions, setDistractions] = useState(0);
  
  const [dailyStats, setDailyStats] = useState<StatItem[]>([]);
  const [totalDailyTime, setTotalDailyTime] = useState(0);

  const [sound, setSound] = useState<Audio.Sound>();

  const isRunningRef = useRef(isRunning);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    initDB();
    fetchDailyStats();
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    if (!isRunning) {
        setTime(selectedMinutes * 60);
    }
  }, [selectedMinutes]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            onSessionFinish(true); // Otomatik bitti
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" && isRunningRef.current && mode === 'FOCUS') {
        setIsRunning(false);
        setDistractions((prev) => prev + 1);
        setTimeout(() => {
            Alert.alert(
                "⚠️ Dikkat Dağıldı!",
                "Uygulamadan çıktığınız için süre durduruldu.\n\nDevam etmek ister misiniz?",
                [
                    { text: "Hayır", style: "cancel" },
                    { text: "Evet, Devam Et", onPress: () => setIsRunning(true) }
                ]
            );
        }, 500);
      }
    });
    return () => sub.remove();
  }, [mode]);

  const playSound = async () => {
    try {
        const { sound } = await Audio.Sound.createAsync(
            require('../../assets/alarm.mp3.wav') 
        );
        setSound(sound);
        await sound.playAsync();
    } catch (error) {
        console.log("Ses hatası:", error);
    }
  };

  const fetchDailyStats = () => {
    try {
      const todayDate = getLocalISOString().split('T')[0];
      const statsResult = db.getAllSync(
        `SELECT category, SUM(duration) as totalDuration 
         FROM sessions 
         WHERE created_at LIKE ? 
         GROUP BY category`,
        [`${todayDate}%`]
      ) as StatItem[];
      setDailyStats(statsResult);

      const totalResult: any = db.getFirstSync(
        `SELECT SUM(duration) as total 
         FROM sessions 
         WHERE created_at LIKE ?`,
        [`${todayDate}%`]
      );
      setTotalDailyTime(totalResult?.total || 0);
    } catch (error) {
      console.log(error);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    
    let newTime = 25;
    if (newMode === 'SHORT_BREAK') newTime = 5;
    if (newMode === 'LONG_BREAK') newTime = 15;
    
    setSelectedMinutes(newTime);
    setTime(newTime * 60);
  };

  const onSessionFinish = async (isAuto = false) => {
    await playSound();

    if (mode !== 'FOCUS') {
        Alert.alert("☕ Mola Bitti!", "Hadi tekrar odaklanma zamanı! 🚀");
        switchMode('FOCUS');
        return;
    }

    const duration = isAuto 
        ? (selectedMinutes * 60) 
        : (selectedMinutes * 60) - time;

    if (duration <= 0) return;

    try {
      db.execSync(`
        INSERT INTO sessions (category, duration, distractions, created_at)
        VALUES ('${category}', ${duration}, ${distractions}, '${getLocalISOString()}');
      `);
    } catch (e) {
      console.log("Kayıt Hatası:", e);
    }

    fetchDailyStats();
    Alert.alert("🎉 Harikasın!", `Seans bitti. \nOdaklanılan Süre: ${formatTime(duration)}`);
    resetTimer();
  };

  const handleFinishManually = () => {
    if (time === selectedMinutes * 60) return;
    
    if (mode !== 'FOCUS') {
        setIsRunning(false);
        switchMode('FOCUS');
        return;
    }

    Alert.alert("Seansı Bitir", "Mevcut ilerlemeyi kaydedip bitirmek istiyor musun?", [
        { text: "Vazgeç", style: "cancel" },
        { text: "Kaydet ve Bitir", onPress: () => { setIsRunning(false); onSessionFinish(); }}
    ])
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(selectedMinutes * 60);
    setDistractions(0);
  };

  const increaseTime = () => {
    if (!isRunning) setSelectedMinutes((prev) => prev + 5);
  };

  const decreaseTime = () => {
    if (!isRunning && selectedMinutes > 5) setSelectedMinutes((prev) => prev - 5);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDurationText = (sec: number) => {
    const m = Math.floor(sec / 60);
    return m > 0 ? `${m} dk ${sec % 60} sn` : `${sec} sn`;
  };

  const currentThemeColor = mode === 'FOCUS' ? COLORS.primary : COLORS.secondary;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.appTitle}>OdanklanmaTakip</Text>
        
        <View style={[styles.timerCard, { borderColor: mode === 'FOCUS' ? '#F3E8FF' : COLORS.accent }]}>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, mode === 'FOCUS' && { backgroundColor: COLORS.primary }]} 
                onPress={() => switchMode('FOCUS')}>
                <Text style={[styles.tabText, mode === 'FOCUS' && { color: 'white' }]}>Odaklan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.tabButton, mode === 'SHORT_BREAK' && { backgroundColor: COLORS.secondary }]} 
                onPress={() => switchMode('SHORT_BREAK')}>
                <Text style={[styles.tabText, mode === 'SHORT_BREAK' && { color: 'white' }]}>Kısa Ara</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.tabButton, mode === 'LONG_BREAK' && { backgroundColor: COLORS.secondary }]} 
                onPress={() => switchMode('LONG_BREAK')}>
                <Text style={[styles.tabText, mode === 'LONG_BREAK' && { color: 'white' }]}>Uzun Ara</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.timerText, { color: isRunning ? currentThemeColor : COLORS.textMain }]}>
            {formatTime(time)}
          </Text>
          
          {mode === 'FOCUS' ? (
             <View style={styles.distractionContainer}>
                <Text style={styles.distractionLabel}>
                Dikkat Dağınıklığı: <Text style={{fontWeight: 'bold', color: COLORS.danger}}> {distractions}</Text>
                </Text>
             </View>
          ) : (
            <Text style={{marginTop: 10, color: COLORS.secondary, fontStyle: 'italic'}}>☕ İyi dinlenmeler...</Text>
          )}
        </View>

        <View style={styles.settingsRow}>
            <View style={[styles.settingBox, { opacity: mode === 'FOCUS' ? 1 : 0.3 }]}>
                <Text style={styles.settingLabel}>Kategori</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={category}
                        enabled={!isRunning && mode === 'FOCUS'}
                        style={styles.picker}
                        onValueChange={(v) => setCategory(v)}
                    >
                        <Picker.Item label=" Ders" value="Ders Çalışma" />
                        <Picker.Item label=" Kodlama" value="Kodlama" />
                        <Picker.Item label=" Proje" value="Proje" />
                        <Picker.Item label=" Kitap" value="Kitap" />
                    </Picker>
                </View>
            </View>

            <View style={styles.settingBox}>
                <Text style={styles.settingLabel}>Süre (dk)</Text>
                <View style={styles.timeControlWrapper}>
                    {/* EKSİ BUTONU */}
                    <TouchableOpacity 
                        style={[styles.timeBtn, { opacity: isRunning || selectedMinutes <= 1 ? 0.3 : 1 }]} 
                        onPress={decreaseTime}
                        disabled={isRunning || selectedMinutes <= 1}
                    >
                        <AntDesign name="minus" size={24} color="black" />
                    </TouchableOpacity>

                    <Text style={styles.timeValueText}>{selectedMinutes}</Text>

                    {/* ARTI BUTONU */}
                    <TouchableOpacity 
                        style={[styles.timeBtn, { opacity: isRunning ? 0.3 : 1 }]} 
                        onPress={increaseTime}
                        disabled={isRunning}
                    >
                        <AntDesign name="plus" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity 
              activeOpacity={0.8}
              style={[
                  styles.mainButton, 
                  { backgroundColor: isRunning ? COLORS.secondary : currentThemeColor }
              ]}
              onPress={() => setIsRunning(!isRunning)}
          >
              <Text style={styles.mainButtonText}>
                  {isRunning ? "DURAKLAT" : (time < selectedMinutes * 60 ? "DEVAM ET" : "BAŞLAT")}
              </Text>
          </TouchableOpacity>

          <View style={styles.subButtonRow}>
            <TouchableOpacity 
                style={[styles.subButton, { borderColor: COLORS.success, opacity: mode === 'FOCUS' ? 1 : 0.5 }]} 
                onPress={handleFinishManually}
                disabled={mode !== 'FOCUS'}
            >
                <Text style={[styles.subButtonText, { color: COLORS.success }]}>KAYDET</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.subButton, { borderColor: COLORS.danger }]} 
                onPress={resetTimer}
            >
                <Text style={[styles.subButtonText, { color: COLORS.danger }]}>SIFIRLA</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Günün Raporu</Text>
          {dailyStats.length === 0 ? (
              <Text style={styles.noData}>Henüz bir kayıt yok.</Text>
          ) : (
              dailyStats.map((item, index) => (
              <View key={index} style={styles.statRow}>
                  <Text style={styles.statLabel}>{item.category}</Text>
                  <Text style={styles.statValue}>{formatDurationText(item.totalDuration)}</Text>
              </View>
              ))
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOPLAM ODAK</Text>
            <Text style={[styles.totalValue, { color: COLORS.primary }]}>
              {formatDurationText(totalDailyTime)}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  scrollContainer: { paddingVertical: Platform.OS === 'ios' ? 60 : 40, alignItems: "center", paddingHorizontal: 20, paddingBottom: 100 },
  appTitle: { fontSize: isSmallScreen ? 24 : 28, fontWeight: "900", color: COLORS.textMain, marginBottom: 20, letterSpacing: 1 },
  
  timerCard: { backgroundColor: COLORS.cardBg, width: '100%', paddingVertical: 25, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8, marginBottom: 25, borderWidth: 1 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },

  timerText: { fontSize: width * 0.22, fontWeight: '800', fontVariant: ['tabular-nums'], includeFontPadding: false },
  distractionContainer: { marginTop: 15, backgroundColor: '#FEF2F2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  distractionLabel: { fontSize: 14, color: COLORS.textMain, fontWeight: '600' },
  
  settingsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 25, gap: 15 },
  settingBox: { flex: 1 },
  settingLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMain, marginBottom: 8, marginLeft: 5, opacity: 0.7 },
  pickerWrapper: { backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.accent, height: 55, justifyContent: 'center', overflow: 'hidden' },
  picker: { width: '100%', height: 55, color: COLORS.textMain },
  
  timeControlWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.accent, height: 55, paddingHorizontal: 5 },
  timeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 12 },
  timeValueText: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },

  buttonSection: { width: '100%', gap: 15, marginBottom: 30 },
  mainButton: { width: '100%', height: 65, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  mainButtonText: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  subButtonRow: { flexDirection: 'row', gap: 15 },
  subButton: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: COLORS.cardBg },
  subButtonText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  statsCard: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: COLORS.accent, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statsTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginBottom: 15 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { fontSize: 15, color: COLORS.textMain, fontWeight: '500', opacity: 0.8 },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
  noData: { color: COLORS.secondary, fontStyle: 'italic', fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.accent, marginVertical: 12, opacity: 0.3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: COLORS.textMain },
  totalValue: { fontSize: 16, fontWeight: '900' },
});