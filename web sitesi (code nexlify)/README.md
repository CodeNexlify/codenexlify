# CodeNexlify Web Sitesi

CodeNexlify şirketi için oluşturulan modern, responsive ve profesyonel web sitesi.

## 📋 Proje Açıklaması

Bu proje, CodeNexlify markası için özel olarak tasarlanmış, yenilikçi teknoloji çözümleri sunan bir şirketin kurumsal web sitesidir. Site, AI odaklı hizmetler, web/mobil/masaüstü geliştirme ve danışmanlık hizmetlerini tanıtan kapsamlı bir platform olarak tasarlanmıştır.

## 🎯 Özellikler

- **Modern Tasarım**: Gradient renkler ve modern UI/UX prensipleri
- **Responsive**: Tüm cihazlarda mükemmel görüntüleme
- **SEO Uyumlu**: Arama motoru optimizasyonu
- **Hızlı**: Optimize edilmiş CSS ve JavaScript
- **Türkçe Destek**: Tamamen Türkçe içerik ve arayüz
- **Etkileşimli**: Smooth animations ve hover efektleri

## 📁 Dosya Yapısı

```
/
├── index.html          # Ana sayfa
├── about.html          # Hakkımızda sayfası
├── services.html       # Hizmetler sayfası
├── contact.html        # İletişim sayfası
├── blog.html          # Blog sayfası
├── css/
│   └── style.css      # Ana stil dosyası
├── js/
│   └── script.js      # JavaScript dosyası
└── README.md          # Bu dosya
```

## 🛠️ Teknolojiler

- **HTML5**: Semantic markup
- **CSS3**: Grid, Flexbox, Animations
- **JavaScript**: ES6+, DOM manipulation
- **Font Awesome**: İkonlar için
- **Google Fonts**: Typography için

## 🚀 Kurulum ve Kullanım

1. Dosyaları web sunucunuza yükleyin
2. `index.html` dosyasını ana dizine yerleştirin
3. Tarayıcınızda siteyi açın

### Yerel Geliştirme

```bash
# Basit HTTP sunucusu başlatın (Python)
python -m http.server 8000

# Veya Node.js ile
npx serve .

# Tarayıcıda açın: http://localhost:8000
```

## 📱 Sayfa Yapısı

### Ana Sayfa (index.html)
- Hero section
- Hizmetler özeti
- Neden CodeNexlify?
- İstatistikler
- Call-to-action

### Hakkımızda (about.html)
- Şirket vizyonu ve misyonu
- Değerler
- Ekip tanıtımı
- Şirket hikayesi (timeline)

### Hizmetler (services.html)
- Web geliştirme
- Mobil uygulamalar
- Masaüstü uygulamaları
- AI eklentileri
- Danışmanlık hizmetleri

### İletişim (contact.html)
- İletişim formu
- İletişim bilgileri
- Sık sorulan sorular
- Harita (opsiyonel)

### Blog (blog.html)
- Teknoloji makaleleri
- Sayfalama
- Newsletter kayıt formu

## 🎨 Tasarım Sistemi

### Renkler
- **Birincil**: #2563eb (Mavi)
- **İkincil**: #667eea (Açık Mavi)
- **Vurgu**: #764ba2 (Mor)
- **Metin**: #1e293b (Koyu Gri)
- **Yardımcı**: #64748b (Orta Gri)

### Typography
- **Ana Font**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Başlık Boyutları**: 2rem - 3.5rem
- **Metin Boyutu**: 1rem
- **Satır Yüksekliği**: 1.6

## 📧 İletişim Formu

Form şu alanları içerir:
- Ad Soyad (zorunlu)
- E-posta (zorunlu)
- Telefon
- Hizmet türü seçimi
- Bütçe aralığı
- Mesaj (zorunlu)

Form JavaScript ile client-side validation yapılır.

## 🔧 Özelleştirme

### Renkleri Değiştirme
`css/style.css` dosyasında CSS custom properties kullanarak renkleri kolayca değiştirebilirsiniz.

### İçerik Güncelleme
HTML dosyalarındaki metinleri direkt düzenleyerek içeriği güncelleyebilirsiniz.

### Yeni Sayfa Ekleme
Mevcut sayfalardan birini kopyalayıp düzenleyerek yeni sayfa ekleyebilirsiniz.

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 767px ve altı

## ⚡ Performans

- Optimize edilmiş görsel boyutları
- Minified CSS (production için)
- Lazy loading hazır
- Web vitals için optimize edilmiş

## 🔒 Güvenlik

- XSS koruması
- CSRF token hazırlığı
- Güvenli form validation

## 📝 Lisans

Bu proje CodeNexlify şirketi için özel olarak geliştirilmiştir.

## 👥 Geliştirici

Bu web sitesi, modern web standartları kullanılarak geliştirilmiştir ve tüm popüler tarayıcılarda test edilmiştir.

---

**Not**: Bu site tamamen statik HTML/CSS/JavaScript kullanılarak oluşturulmuştur ve herhangi bir backend teknolojisi gerektirmez. Form işlemleri için ayrı bir backend entegrasyonu gerekebilir. 