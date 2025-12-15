# Odaklanma Takip Sistemi

Bu proje, React Native ve Expo kullanılarak geliştirilmiş, kişisel verimliliği artırmayı hedefleyen bir mobil uygulamadır. Kullanıcıların belirledikleri sürelerde odaklanmalarını sağlar ve bu süreleri yerel veritabanına kaydederek günlük raporlar sunar.

## Özellikler

* **Zamanlayıcı:** Odaklanma, Kısa Mola ve Uzun Mola modları.
* **Kategoriler:** Ders, Kodlama, Proje ve Kitap Okuma seçenekleri.
* **Veritabanı:** SQLite kullanılarak verilerin telefon hafızasında tutulması (İnternet gerekmez).
* **İstatistikler:** Günlük toplam çalışma süresi ve kategori bazlı dağılım raporu.
* **Sesli Uyarı:** Süre bittiğinde alarm çalması.
* **Arka Plan Kontrolü:** Uygulamadan çıkıldığında süre takibini durdurma ve uyarı verme.

## Kullanılan Teknolojiler

* **Altyapı:** React Native, Expo
* **Dil:** TypeScript
* **Veritabanı:** Expo SQLite
* **Ses:** Expo AV
* **İkonlar:** Expo Vector Icons (AntDesign)

## Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin.

**1. Gerekli Paketleri Yükleyin**
Terminali proje klasöründe açın ve şu komutu çalıştırın:
```bash
npm install
