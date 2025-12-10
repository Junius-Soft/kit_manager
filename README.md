# Kit Manager

ERPNext/Frappe uygulaması için geliştirilmiş kapsamlı kit (aksesuar seti) yönetim sistemi.

## 📋 Genel Bakış

Kit Manager, aksesuar setlerinin (kit) yönetilmesini, fiyatlandırılmasını ve otomatik fiyat güncellemelerini sağlayan bir Frappe uygulamasıdır. Sistem, kit ürünlerinin ve içlerindeki normal ürünlerin fiyatlarını takip eder, otomatik hesaplamalar yapar ve bayi kit fiyatı listesini güncel tutar.

## ✨ Özellikler

### 🎯 Temel Özellikler

- **Kit Yönetimi**: Aksesuar setlerini (kit ürünleri) kolayca oluşturun ve yönetin
- **Ürün Bağlantısı**: Kit'leri mevcut `custom_kit=1` işaretli Item kayıtlarına bağlayın
- **Normal Ürün Ekleme**: Kit'lere normal ürünler ekleyin (miktar, birim fiyat, toplam)
- **Otomatik Birim**: Ürün seçildiğinde UOM (birim) otomatik çekilir

### 💰 Fiyatlandırma Özellikleri

#### Otomatik Hesaplamalar:
1. **Toplam Tutar**: Kit items toplamı
2. **İndirim**: Yüzde bazlı indirim hesaplaması
3. **Vergi (KDV)**: Varsayılan %18, özelleştirilebilir
4. **Ek Maliyetler** (Genel toplam üzerinden):
   - Kar %
   - Genel Gider %
   - İşçilik %
   - Yılsonu Primi %
5. **Nihai Toplam**: Tüm maliyetler dahil son fiyat

#### Fiyat Yönetimi:
- **Standard Buying**: Kit items için Standard Buying fiyat listesinden otomatik fiyat çekme
- **Bayi Kit Fiyatı**: Kit kaydedildiğinde otomatik olarak "Bayi Kit Fiyatı" listesine ekleme/güncelleme
- **Otomatik Güncelleme**: Ürün fiyatları değiştiğinde kit fiyatlarını otomatik güncelleme

### 🔄 Otomatik İşlemler

#### Kit Kaydedildiğinde:
✅ Kit fiyatı otomatik hesaplanır  
✅ Bayi Kit Fiyatı listesine Item Price eklenir/güncellenir  
✅ Kullanıcıya bildirim gösterilir  

#### Item Price Değiştiğinde (Standard Buying):
✅ İlgili tüm Kit'ler otomatik bulunur  
✅ Kit fiyatları yeniden hesaplanır  
✅ Bayi Kit Fiyatı otomatik güncellenir  
✅ Kullanıcıya hangi Kit'lerin güncellendiği bildirilir  

#### Kit Silindiğinde:
✅ Kit belgesi silinir  
✅ Bayi Kit Fiyatı listesinden Item Price otomatik silinir  

### 📊 Dinamik Hesaplama

- **Anlık Güncelleme**: Miktar veya fiyat değiştiğinde tutar anında hesaplanır
- **Otomatik Toplam**: Alt toplamlar ve nihai toplam otomatik güncellenir
- **Grid Optimizasyonu**: Tüm sütunlar dengeli genişlikte görünür (10 puan sistemi)

## 📦 Kurulum

### Gereksinimler

- Frappe Framework v15+
- ERPNext v15+ (opsiyonel ama önerilir)
- Python 3.10+

### Kurulum Adımları

1. **Bench dizinine gidin:**
```bash
cd /path/to/your/bench
```

2. **Uygulamayı kurun:**
```bash
# ZIP dosyasından
unzip kit_manager.zip
mv kit_manager apps/
source env/bin/activate
pip install -e apps/kit_manager

# Veya Git'ten (eğer repo varsa)
bench get-app https://github.com/yourrepo/kit_manager --branch develop
```

3. **sites/apps.txt dosyasına ekleyin:**
```bash
echo "kit_manager" >> sites/apps.txt
```

4. **Site'a kurun:**
```bash
bench --site your-site.com install-app kit_manager
```

5. **Migrate edin:**
```bash
bench --site your-site.com migrate
```

6. **Build yapın:**
```bash
bench clear-cache
bench build --app kit_manager
```

## 🚀 Kullanım

### 1. Kit Oluşturma

1. **Kit List** sayfasına gidin
2. **New** butonuna tıklayın
3. **Kit Name** seçin (sadece `custom_kit=1` işaretli ürünler görünür)
4. **Description** otomatik doldurulacaktır
5. **Kit Items** tablosuna ürünler ekleyin:
   - Ürün Kodu seçin
   - Miktar girin
   - Birim otomatik gelir
   - Birim Fiyatı Standard Buying'den otomatik çekilir
   - Tutar otomatik hesaplanır

### 2. Fiyatlandırma

#### Temel Fiyatlandırma:
- **İndirim %**: İsteğe bağlı indirim oranı
- **Vergi (KDV) %**: Varsayılan %18

#### Ek Maliyetler:
- **Kar %**: Kar marjı
- **Genel Gider %**: Genel giderler
- **İşçilik %**: İşçilik maliyeti
- **Yılsonu Primi %**: Yıl sonu primi

Tüm değerler **otomatik hesaplanır** ve **Nihai Toplam** gösterilir.

### 3. Otomatik Fiyat Senkronizasyonu

#### Senaryo 1: Kit Kaydedildiğinde
```
Kit: AKS2071
Nihai Toplam: ₺1.784,16

→ Kaydet →

✅ Bayi Kit Fiyatı listesine eklenir
   Item: AKS2071
   Price: ₺1.784,16
```

#### Senaryo 2: Ürün Fiyatı Değiştiğinde
```
Item Price (Standard Buying):
  Item: 10463
  Eski: ₺100
  Yeni: ₺600

→ Otomatik →

✅ İlgili Kit'ler güncellenir
✅ Bayi Kit Fiyatı güncellenir
✅ Bildirim gösterilir:
   "1 Kit güncellendi:
   • AKS2071: ₺1.784,16 → ₺2.784,16 (↑ ₺1.000,00)"
```

## 🏗️ Teknik Detaylar

### DocTypes

#### Kit (Ana DocType)
- **kit_name**: Link → Item (custom_kit=1 olanlar)
- **description**: Small Text (otomatik doldurulur)
- **items**: Table → Kit Item
- **Fiyat alanları**: Currency (read-only, otomatik hesaplanır)

#### Kit Item (Child Table)
- **item_code**: Link → Item (tüm ürünler)
- **item_name**: Data (otomatik)
- **quantity**: Float
- **uom**: Link → UOM (otomatik)
- **rate**: Currency (Standard Buying'den otomatik)
- **amount**: Currency (read-only, quantity × rate)

### Hooks

```python
doc_events = {
    "Item Price": {
        "on_update": "...on_item_price_update",
        "after_insert": "...on_item_price_update"
    }
}
```

### API Metodları

```python
@frappe.whitelist()
def on_item_price_update(doc, method=None)
    # Item Price değişince Kit'leri günceller

@frappe.whitelist()
def get_price_changes_html(kit_name)
    # Fiyat değişikliklerini HTML tablo olarak döner
```

## 📊 Veri Akışı

```
Item Price (Standard Buying) 
    ↓ değişti
Kit Items güncellenir
    ↓
Kit Totals yeniden hesaplanır
    ↓
Kit kaydedilir
    ↓
Bayi Kit Fiyatı Item Price güncellenir
    ↓
Kullanıcıya bildirim
```

## 🎨 Sütun Yapısı (Kit Items)

| Sütun | Genişlik | Özellik |
|-------|----------|---------|
| Ürün Kodu | 2 | Link field |
| Ürün Adı | 2 | Otomatik |
| Miktar | 1 | Editable |
| Birim | 1 | Otomatik |
| Birim Fiyatı | 2 | Otomatik (Standard Buying) |
| Tutar | 2 | Read-only (Miktar × Birim Fiyatı) |
| **Toplam** | **10** | Frappe grid limiti |

## 🌐 Çoklu Dil Desteği

Uygulama Türkçe çevirilerle birlikte gelir:

- ✅ Tüm form alanları
- ✅ Butonlar ve aksiyonlar
- ✅ Bildirim mesajları
- ✅ Hata mesajları

Çeviriler: `kit_manager/translations/tr.csv`

## 🔧 Konfigürasyon

### Gerekli Ayarlar

1. **Item Master'da custom_kit alanı**: Kit ürünlerini işaretlemek için
2. **Price List**: "Standard Buying" (ürün fiyatları için)
3. **Price List**: "Bayi Kit Fiyatı" (otomatik oluşturulur)

### Opsiyonel Ayarlar

- **Varsayılan KDV %**: Kit JSON'da değiştirilebilir (varsayılan: 18%)
- **Ek Maliyet Yüzdeleri**: Her kit için özelleştirilebilir

## 🐛 Sorun Giderme

### "Duplicate entry" Hatası
**Sorun**: Kit kaydederken "Duplicate entry 'AKSXXXX' for key 'PRIMARY'" hatası  
**Çözüm**: Bu düzeltildi. Kit artık mevcut Item kayıtlarına link oluyor, yeni Item oluşturmuyor.

### Fiyatlar Otomatik Gelmiyor
**Sorun**: Ürün seçildiğinde fiyat 0 gösteriliyor  
**Çözüm**: 
- Item'da Standard Buying fiyatı olmalı veya
- Item Price tablosunda Standard Buying kaydı olmalı

### Tutar Hesaplanmıyor
**Sorun**: Miktar değişince tutar güncellenmiyor  
**Çözüm**: Hard reload yapın (Ctrl+Shift+R). Kod artık dinamik çalışıyor.

### Toplam Tutar 0
**Sorun**: Alt kısımda Toplam Tutar 0 gösteriliyor  
**Çözüm**: Kaydet butonuna tıklayın, server-side hesaplama yapılacak.

## 📝 Önemli Notlar

### Kit Ürünleri
- Sadece `custom_kit=1` işaretli Item'lar Kit Name olarak seçilebilir
- Bu ürünler genellikle aksesuar setleridir (AKS kodu ile başlar)

### Normal Ürünler
- Kit Items tablosuna TÜM ürünler eklenebilir
- Filtre yoktur, herhangi bir Item seçilebilir

### Fiyat Güncellemeleri
- Otomatik güncelleme sadece Standard Buying fiyat listesi için çalışır
- Diğer price list'ler Kit'leri etkilemez
- Güncelleme işlemi background'da çalışır

### Hesaplama Sırası
```
1. Items Toplamı
2. - İndirim
3. + KDV
   = Genel Toplam
4. + Kar
5. + Genel Gider
6. + İşçilik
7. + Yılsonu Primi
   = Nihai Toplam (Kit Price)
```

## 🔐 İzinler

Kit DocType için System Manager rolü varsayılan olarak tüm izinlere sahiptir. Gerekirse Role Permissions'dan özelleştirilebilir.

## 🛠️ Geliştirme

### Pre-commit Kurulumu

```bash
cd apps/kit_manager
pre-commit install
```

Pre-commit araçları:
- **ruff**: Python linting ve formatting
- **eslint**: JavaScript linting
- **prettier**: JavaScript formatting
- **pyupgrade**: Python syntax modernization

### Build

```bash
bench clear-cache
bench build --app kit_manager
```

### Migrate

```bash
bench --site your-site.com migrate
```

## 📚 API Referansı

### Whitelisted Methods

#### `on_item_price_update(doc, method=None)`
Item Price değiştiğinde otomatik çağrılır. İlgili Kit'leri günceller.

**Parametreler:**
- `doc`: Item Price belgesi
- `method`: Hook metodu (on_update/after_insert)

**Returns:** None  
**Side Effects:** Kit'leri günceller, Bayi Kit Fiyatı günceller, bildirim gösterir

#### `get_price_changes_html(kit_name)`
Kit için fiyat değişikliklerini HTML tablo olarak döner.

**Parametreler:**
- `kit_name`: Kit adı

**Returns:** HTML string

## 🗂️ Dosya Yapısı

```
kit_manager/
├── kit_manager/
│   ├── kit_manager/
│   │   ├── doctype/
│   │   │   ├── kit/
│   │   │   │   ├── kit.json       # DocType tanımı
│   │   │   │   ├── kit.py         # Server-side logic
│   │   │   │   └── kit.js         # Client-side logic
│   │   │   └── kit_item/
│   │   │       ├── kit_item.json  # Child table tanımı
│   │   │       ├── kit_item.py    # Validation
│   │   │       └── kit_item.js    # Event handlers
│   ├── translations/
│   │   └── tr.csv                 # Türkçe çeviriler
│   ├── hooks.py                   # App hooks
│   └── modules.txt
├── README.md
├── pyproject.toml
└── license.txt
```

## 🔄 Güncellemeler

### v0.0.1 (İlk Sürüm)
- ✅ Kit ve Kit Item DocType'ları
- ✅ Otomatik fiyat hesaplama
- ✅ Standard Buying fiyat entegrasyonu
- ✅ Bayi Kit Fiyatı otomasyonu
- ✅ Item Price değişikliklerinde otomatik güncelleme
- ✅ Dinamik tutar hesaplama
- ✅ UOM desteği
- ✅ İndirim ve vergi hesaplama
- ✅ Ek maliyet hesaplama (Kar, Genel Gider, İşçilik, Yılsonu Primi)
- ✅ Türkçe dil desteği

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

MIT License. Detaylar için `license.txt` dosyasına bakın.

## 👥 İletişim

- **Geliştirici**: -
- **Email**: ylmzozlem.3461@gmail.com
- **Proje**: Kit Manager

## 🙏 Teşekkürler

Bu uygulama [Frappe Framework](https://frappeframework.com/) ve [ERPNext](https://erpnext.com/) kullanılarak geliştirilmiştir.

---

**Not**: Bu uygulama Özerpan ERP sistemi için özel olarak geliştirilmiştir ve üretim ortamında aktif olarak kullanılmaktadır.
