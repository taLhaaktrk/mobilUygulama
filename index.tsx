import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';



export default function Index() {
  const [time, setTime] = useState(25 * 60); // 25 dakika
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState("Ders Çalışma");

const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // Sayaç çalışıyorsa geri saysın
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            showSummary();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const showSummary = () => {
    Alert.alert(
      "Seans Tamamlandı!",
      `Kategori: ${category}\nSüre: ${formatTime(25 * 60 - time)}`
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current!);
    setTime(25 * 60);
    setIsRunning(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zamanlayıcı</Text>
      <Text style={styles.timer}>{formatTime(time)}</Text>

      {/* Kategori seçimi */}
      <Picker
        selectedValue={category}
        style={{ width: 200, marginVertical: 20 }}
        onValueChange={(itemValue) => setCategory(itemValue)}
      >
        <Picker.Item label="Ders Çalışma" value="Ders Çalışma" />
        <Picker.Item label="Kodlama" value="Kodlama" />
        <Picker.Item label="Proje" value="Proje" />
        <Picker.Item label="Kitap Okuma" value="Kitap Okuma" />
      </Picker>

      {/* Butonlar */}
      <View style={styles.btnRow}>
        <Button
          title={isRunning ? "Duraklat" : "Başlat"}
          onPress={() => setIsRunning(prev => !prev)}
        />
        <Button title="Sıfırla" onPress={resetTimer} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timer: {
    fontSize: 60,
    fontWeight: "bold",
    marginVertical: 20,
  },
  btnRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
  },
});
