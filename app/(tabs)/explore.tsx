import { IconSymbol } from '@/components/ui/icon-symbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { db } from "../../src/database/db";

const COLORS = {
  bg: "#faebf5",          
  textMain: "#140f07",    
  primary: "#212b49",     
  secondary: "#5960a0",   
  accent: "#9da1fa",      
  cardBg: "#FFFFFF",      
  danger: "#EF4444",      
};

type TotalResult = {
  total: number | null;
};

type SessionRecord = {
  id: number;
  category: string;
  duration: number;
  distractions: number;
  created_at: string;
};

export default function Explore() {
  const screenWidth = Dimensions.get("window").width - 32;

  const [todayTotal, setTodayTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [totalDistractions, setTotalDistractions] = useState(0);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  
  const chartLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false);  
  const [historyList, setHistoryList] = useState<SessionRecord[]>([]); 

  useFocusEffect(
    useCallback(() => {
      loadReports();
      loadHistory(selectedDate); 
    }, [])
  );

  useEffect(() => {
    loadHistory(selectedDate);
  }, [selectedDate]);

  const loadReports = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // 1. GENEL TOPLAMLAR
    const todayResult = db.getAllSync<TotalResult>(`SELECT SUM(duration) as total FROM sessions WHERE created_at LIKE ?`, [`${todayStr}%`]);
    setTodayTotal(todayResult[0]?.total ?? 0);

    const allTimeResult = db.getAllSync<TotalResult>(`SELECT SUM(duration) as total FROM sessions`);
    setAllTimeTotal(allTimeResult[0]?.total ?? 0);

    const distractionResult = db.getAllSync<TotalResult>(`SELECT SUM(distractions) as total FROM sessions`);
    setTotalDistractions(distractionResult[0]?.total ?? 0);

    
    const curr = new Date(); 
    const day = curr.getDay() || 7; 
    curr.setHours(0, 0, 0, 0);
    
    curr.setDate(curr.getDate() - day + 1); 
    const mondayStr = curr.toISOString().slice(0, 10);

    
    const weeklyResult = db.getAllSync<{ day: string; total: number }>(`
      SELECT DATE(created_at) as day, SUM(duration) as total 
      FROM sessions 
      WHERE created_at >= ? 
      GROUP BY day
    `, [mondayStr]);

   
    const weekData = new Array(7).fill(0);

    
    weeklyResult.forEach((r) => {
        const date = new Date(r.day);
        
        const dayIndex = (date.getDay() + 6) % 7;
        weekData[dayIndex] = Math.round((r.total ?? 0) / 60);
    });

    setWeeklyData(weekData);


  
    const categories = db.getAllSync<{ category: string; total: number }>(`SELECT category, SUM(duration) as total FROM sessions GROUP BY category`);
    const chartColors = [COLORS.primary, COLORS.secondary, COLORS.accent, "#140f07", "#F59E0B"];
    setCategoryData(categories.map((c, i) => ({
        name: c.category,
        population: Math.round((c.total ?? 0) / 60),
        color: chartColors[i % chartColors.length],
        legendFontColor: COLORS.textMain,
        legendFontSize: 12,
    })));
  };

  const loadHistory = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    try {
        const results = db.getAllSync<SessionRecord>(
            `SELECT * FROM sessions WHERE created_at LIKE ? ORDER BY created_at DESC`,
            [`${dateStr}%`]
        );
        setHistoryList(results);
    } catch (e) {
        console.log("Geçmiş hatası", e);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const formatDateTR = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTimeOnly = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      return `${m} dk ${sec % 60} sn`;
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Raporlar</Text>

        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Bugün</Text>
            <Text style={styles.cardValue}>{Math.round(todayTotal / 60)} <Text style={styles.unit}>dk</Text></Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Toplam</Text>
            <Text style={styles.cardValue}>{Math.round(allTimeTotal / 60)} <Text style={styles.unit}>dk</Text></Text>
          </View>
        </View>

        <View style={styles.cardFull}>
          <Text style={styles.cardLabel}>Toplam Dikkat Dağınıklığı</Text>
          <Text style={[styles.cardValue, { color: COLORS.danger }]}>{totalDistractions}</Text>
        </View>

        {}
        <Text style={styles.sectionTitle}>Haftalık Özet (Dakika)</Text>
        <BarChart
          data={{
            labels: chartLabels, 
            datasets: [{ data: weeklyData }]
          }}
          width={screenWidth} height={220} yAxisLabel="" yAxisSuffix="" fromZero
          chartConfig={{
            backgroundColor: COLORS.cardBg, backgroundGradientFrom: COLORS.cardBg, backgroundGradientTo: COLORS.cardBg,
            decimalPlaces: 0, color: (opacity = 1) => `rgba(33, 43, 73, ${opacity})`, labelColor: () => COLORS.textMain,
            barPercentage: 0.7,
            propsForBackgroundLines: { strokeWidth: 1, stroke: "#e3e3e3", strokeDasharray: "0" },
          }}
          style={styles.chart} showValuesOnTopOfBars
        />

        <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>
        <View style={styles.pieChartContainer}>
            <PieChart
            data={categoryData} width={screenWidth} height={200} accessor="population" backgroundColor="transparent" paddingLeft="15" absolute
            chartConfig={{ color: () => COLORS.textMain }}
            />
        </View>

        <View style={styles.historySection}>
            <Text style={styles.historyTitle}>📅 Geçmiş Kayıtlar</Text>
            
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <IconSymbol name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.dateButtonText}>{formatDateTR(selectedDate)}</Text>
                <IconSymbol name="chevron.down" size={20} color={COLORS.secondary} />
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate} mode="date" display="default" maximumDate={new Date()}
                    onChange={onDateChange}
                />
            )}

            <View style={styles.historyList}>
                {historyList.length === 0 ? (
                    <Text style={styles.noDataText}>Bu tarihte çalışma kaydı yok.</Text>
                ) : (
                    historyList.map((item) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                                <Text style={styles.historyCategory}>{item.category}</Text>
                                <Text style={styles.historyTime}>{formatTimeOnly(item.created_at)}</Text>
                            </View>
                            <View style={styles.historyRight}>
                                <Text style={styles.historyDuration}>{formatDuration(item.duration)}</Text>
                                {item.distractions > 0 && (
                                    <Text style={styles.historyDistraction}>⚠️ {item.distractions}</Text>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 50 : 70, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.textMain, marginBottom: 20, textAlign: "center", letterSpacing: 1 },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#F3E8FF', alignItems: 'center' },
  cardFull: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#F3E8FF', alignItems: 'center' },
  cardLabel: { fontSize: 14, color: COLORS.secondary, fontWeight: '600', marginBottom: 5 },
  cardValue: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  unit: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  sectionTitle: { marginTop: 10, marginBottom: 15, fontSize: 18, fontWeight: "800", color: COLORS.textMain, marginLeft: 5 },
  chart: { borderRadius: 20, marginVertical: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  pieChartContainer: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, alignItems: 'center', borderWidth: 1, borderColor: '#F3E8FF' },
  historySection: { marginTop: 30, marginBottom: 20 },
  historyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textMain, marginBottom: 15 },
  dateButton: { flexDirection: 'row', backgroundColor: COLORS.cardBg, padding: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.accent, marginBottom: 15 },
  dateButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  historyList: { gap: 10 },
  historyItem: { backgroundColor: COLORS.cardBg, padding: 15, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  historyLeft: { gap: 4 },
  historyCategory: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  historyTime: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyDuration: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  historyDistraction: { fontSize: 12, color: COLORS.danger, fontWeight: '700' },
  noDataText: { textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', marginTop: 10 },
});