import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, RotateCcw,
    Check, Sparkles, Image, Dumbbell, Layers, AlertCircle,
    Upload, Link, ExternalLink, Copy, ZoomIn, X, ArrowUp, ArrowDown,
    Sliders, Megaphone, Layout, Move, HelpCircle, Palette, CheckCircle2,
    Clock, Globe, Star, Sun, Moon, Flame, SlidersHorizontal, Calendar,
    UserCheck, RefreshCw, Zap, Award, ThumbsUp, Search,
    Smartphone, Monitor, Tablet, MessageCircle, Users, Phone
} from 'lucide-react';
import api from '../api/axiosConfig';

const CONTAINER_TYPES = [
    { type: 'HERO', label: 'Hero / Ana Manşet', desc: 'Büyük arka plan görseli, başlık, slogan, 2 aksiyon butonu ve istatistik sayaçları.', icon: '🌟' },
    { type: 'APP_BODY', label: 'İnteraktif Vücut & Mobil App', desc: '3D kas anatomi haritası, mobil uygulama özellikleri ve üye girişi çağrısı.', icon: '🦾' },
    { type: 'ABOUT', label: 'Hakkımızda & Kulüp Felsefesi', desc: 'Salonun vizyonu, felsefesi ve 4 adet ikonlu temel prensip kutusu.', icon: '🛡️' },
    { type: 'BEFORE_AFTER', label: 'Değişim & Öncesi/Sonrası (Slider)', desc: 'Üyelerin başarı ve kilo verme/kas kazanma değişim fotoğrafları ve interaktif sürgü.', icon: '🔄' },
    { type: 'REVIEWS', label: 'Google & Üye Yorumları Vitrini', desc: 'Google Haritalar 4.9 puanı, yıldızlar ve gerçek üye yorumları vitrini.', icon: '⭐' },
    { type: 'TRAINERS', label: 'Eğitmen & Antrenör Kadrosu', desc: 'Salon kurucusu, antrenörler, sertifikalar, uzmanlık alanları ve profiller.', icon: '🥋' },
    { type: 'EQUIPMENT_GALLERY', label: 'Salon & Ekipman Galerisi (Slider)', desc: 'Otomatik dönen salon fotoğrafları sliderı ve kategori bazlı ekipman kartları.', icon: '🏋️' },
    { type: 'HOURS', label: 'Kadınlara Özel & Çalışma Saatleri', desc: 'Kadın seansları, haftalık görsel çalışma takvimi tablosu ve saat bilgi kartları.', icon: '⏰' },
    { type: 'PACKAGES', label: 'Üyelik Paketleri Vitrini', desc: 'Sitede sergilenen güncel üyelik paketlerinin canlı fiyat senkronizasyonlu bloğu.', icon: '💳' },
    { type: 'FAQ', label: 'Sıkça Sorulan Sorular (SSS - Akordeon)', desc: 'Aday üyelerin aklındaki soruları yanıtlayan açılır-kapanır akordeon soru-cevap bloğu.', icon: '❓' },
    { type: 'COUNTDOWN_CAMPAIGN', label: 'Geri Sayım & Aciliyet Sayacı', desc: 'Yeni sezon indirimi veya kampanya bitimine kalan süreyi canlı geri sayan aciliyet bandı.', icon: '⏱️' },
    { type: 'BANNER_CAMPAIGN', label: 'Özel Kampanya / Duyuru Bandı', desc: 'Sayfanın arasına yerleştirilen tam genişlikte görsel ve promosyon afişi.', icon: '📢' },
    { type: 'CONTACT', label: 'İletişim, Ön Kayıt Formu & Lokasyon', desc: 'Salon adresi, ücretsiz tanışma/ön kayıt başvuru formu, telefon ve harita bilgisi.', icon: '📍' },
    { type: 'SPECIAL_CUSTOM', label: 'Özgün & Serbest Blok (Special)', desc: 'Tamamen özgür: Sağlı sollu blog/hikaye, ayarlanabilir kart ızgarası veya tam genişlikte makale.', icon: '✨' }
];

const DEFAULT_WEEKLY_SCHEDULE = [
    { dayName: 'Pazartesi', isWomenDay: false, womenOnlyHours: '-', generalHours: '09:00 - 23:00', note: 'Tam Gün Genel / Karma Antrenman' },
    { dayName: 'Salı', isWomenDay: false, womenOnlyHours: '-', generalHours: '09:00 - 23:00', note: 'Tam Gün Genel / Karma Antrenman' },
    { dayName: 'Çarşamba', isWomenDay: true, womenOnlyHours: '09:00 - 20:00', generalHours: '20:00 - 23:00', note: '🌸 20:00\'a Kadar Kadınlara Özel • Sonrası Genel' },
    { dayName: 'Perşembe', isWomenDay: false, womenOnlyHours: '-', generalHours: '09:00 - 23:00', note: 'Tam Gün Genel / Karma Antrenman' },
    { dayName: 'Cuma', isWomenDay: true, womenOnlyHours: '18:00 - 23:00', generalHours: '09:00 - 18:00', note: '🌸 18:00\'dan Kapanışa Kadar Kadınlara Özel' },
    { dayName: 'Cumartesi', isWomenDay: false, womenOnlyHours: '-', generalHours: '09:00 - 23:00', note: 'Tam Gün Genel / Karma Antrenman' },
    { dayName: 'Pazar', isWomenDay: true, womenOnlyHours: '09:00 - 17:00', generalHours: '17:00 - 23:00', note: '🌸 17:00\'a Kadar Kadınlara Özel • Sonrası Genel' }
];


const QUICK_COLOR_PALETTE = [
    { name: 'N1FIT Kırmızı', value: '#e50914' },
    { name: 'Koyu Kırmızı', value: '#990000' },
    { name: 'Bordo', value: '#800020' },
    { name: 'Altın / Şampiyon', value: '#d97706' },
    { name: 'Kehribar Sarısı', value: '#f59e0b' },
    { name: 'Neon Siber Yeşil', value: '#10b981' },
    { name: 'Zümrüt Doğa', value: '#059669' },
    { name: 'Ateş Turuncusu', value: '#ea580c' },
    { name: 'Elektrik Mavi', value: '#2563eb' },
    { name: 'Siber Cyan', value: '#06b6d4' },
    { name: 'Mor Ametist', value: '#7c3aed' },
    { name: 'Mat Gece Siyahı', value: '#0f1117' }
];

const ColorPalettePicker = ({ label, value, onChange, placeholder = '#e50914' }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {label && <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#c5cad6' }}>{label}</label>}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '2px solid #33394a',
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    backgroundColor: value || placeholder,
                    position: 'relative'
                }}>
                    <input
                        type="color"
                        value={value && value.startsWith('#') && (value.length === 7 || value.length === 4) ? value : '#e50914'}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            opacity: 0,
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                        }}
                        title="Renk Paletini Aç"
                    />
                </div>
                <input
                    type="text"
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        backgroundColor: '#0d0e12',
                        border: '1px solid #282c37',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        outline: 'none'
                    }}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {QUICK_COLOR_PALETTE.map((c) => {
                    const isSelected = value?.toLowerCase() === c.value.toLowerCase();
                    return (
                        <button
                            key={c.value}
                            type="button"
                            title={c.name}
                            onClick={() => onChange(c.value)}
                            style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '7px',
                                backgroundColor: c.value,
                                border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                padding: 0,
                                transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? `0 0 12px ${c.value}` : '0 2px 4px rgba(0,0,0,0.4)'
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const normalizeTr = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ş/g, 'ş')
        .replace(/Ğ/g, 'ğ')
        .replace(/Ü/g, 'ü')
        .replace(/Ö/g, 'ö')
        .replace(/Ç/g, 'ç')
        .toLocaleLowerCase('tr-TR')
        .trim();
};

const compressImageFile = (file, maxWidth = 1920, quality = 0.84) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            return resolve({ file, compressed: false, originalSize: file?.size || 0, newSize: file?.size || 0 });
        }
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const outputType = file.type === 'image/png' ? 'image/jpeg' : file.type;
            canvas.toBlob(
                (blob) => {
                    if (!blob || blob.size >= file.size) {
                        resolve({ file, compressed: false, originalSize: file.size, newSize: file.size });
                    } else {
                        const ext = outputType === 'image/webp' ? '.webp' : '.jpg';
                        const baseName = file.name.replace(/\.[^/.]+$/, '');
                        const compressedFile = new File([blob], `${baseName}_opt${ext}`, {
                            type: outputType,
                            lastModified: Date.now()
                        });
                        resolve({
                            file: compressedFile,
                            compressed: true,
                            originalSize: file.size,
                            newSize: compressedFile.size
                        });
                    }
                },
                outputType,
                quality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ file, compressed: false, originalSize: file.size, newSize: file.size });
        };
        img.src = url;
    });
};

const SiteStudio = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Ana Durumlar
    const [activeTab, setActiveTab] = useState(() => {
        const t = new URLSearchParams(window.location.search).get('tab');
        return ['containers', 'leads', 'theme', 'brand', 'automation', 'popup', 'seo', 'media'].includes(t) ? t : 'containers';
    }); // 'containers', 'popup', 'media', 'leads', etc.
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Stüdyo Verileri
    const [containers, setContainers] = useState([]);
    const [selectedContainerId, setSelectedContainerId] = useState(null);
    const [popupConfig, setPopupConfig] = useState({
        enabled: false,
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        badgeText: '',
        buttonText: '',
        buttonLink: '',
        secondaryButtonText: '',
        showFrequency: 'once_per_day'
    });
    const [brandConfig, setBrandConfig] = useState({
        logoUrl: '/favicon.png',
        brandNamePrefix: 'N1',
        brandNameAccent: 'FIT',
        displayMode: 'logo_and_text',
        instagramUrl: 'https://www.instagram.com/n1fitspormerkezi/',
        whatsAppNumber: '905396078154',
        youTubeUrl: 'https://www.youtube.com/@N1F%C4%B0TSPORMERKEZ%C4%B0',
        floatingWhatsAppEnabled: true,
        floatingWhatsAppText: 'Canlı Destek & Fiyat Al',
        floatingWhatsAppMessage: 'Merhaba, N1FIT web sitesinden yazıyorum. Üyelik paketleri ve salon hakkında bilgi alabilir miyim?',
        floatingWhatsAppShowOnMobile: true
    });
    const [countdownConfig, setCountdownConfig] = useState({
        enabled: false,
        badgeText: 'SINIRLI SÜRE',
        title: 'YENİ SEZON ERKEN KAYIT İNDİRİMİ',
        subtitle: 'Kontenjanlar dolmadan önce avantajlı üyelik fırsatını yakalayın!',
        targetDate: '2026-12-01T23:59:59',
        buttonText: 'Fırsatı Yakala',
        buttonLink: '#packages',
        backgroundColor: '#990000'
    });
    const [topBarConfig, setTopBarConfig] = useState({
        enabled: true,
        badgeText: 'DUYURU',
        text: '🌸 Çarşamba, Cuma ve Pazar günleri Kadınlara Özel Bağımsız Seanslarımız devam ediyor! • 🎁 Ücretsiz vücut analizi ve tanışma antrenmanı için hemen ön kayıt formunu doldurun.',
        scrollingMarquee: false,
        backgroundColor: '#141824',
        textColor: '#ffffff',
        buttonText: 'Ön Kayıt Formu',
        buttonLink: '#contact'
    });
    const [greetingConfig, setGreetingConfig] = useState({
        enabled: true,
        morningGreeting: 'Güne Güçlü ve Enerjik Başla, Gölyaka!',
        afternoonGreeting: 'Günün Zirve Performansını Yakala!',
        eveningGreeting: 'Günün Yorgunluğunu ve Stresini Salonda Bırak!',
        nightGreeting: 'Yarın İçin Hazırlan, Hedeflerinden Asla Vazgeçme!'
    });
    const [seoConfig, setSeoConfig] = useState({
        metaTitle: "N1FIT Spor Merkezi | Gölyaka Fitness & Vücut Geliştirme",
        metaDescription: "Bilimsel antrenman, profesyonel ekipmanlar, kadınlara özel seanslar ve 15 yıllık tecrübeyle Gölyaka'da fitness standartlarını yükseltiyoruz.",
        keywords: "gölyaka spor salonu, düzce fitness, n1fit, vücut geliştirme, kadın seansları, kişisel antrenör",
        ogTitle: "N1FIT Spor Merkezi Gölyaka",
        ogDescription: "Bilimin, disiplinin ve 15 yıllık tecrübenin buluştuğu yer. Hemen keşfedin!",
        ogImageUrl: "/SalonunFotolari/Salon1.jpeg",
        canonicalUrl: "https://n1fit.com.tr",
        structuredDataEnabled: true
    });
    const [themeConfig, setThemeConfig] = useState({
        preset: 'red_power',
        accentColor: '#e50914',
        accentGlow: 'rgba(229, 9, 20, 0.4)',
        backgroundPattern: 'carbon_fiber',
        cornerStyle: 'rounded',
        navbarStyle: 'blur_glass'
    });
    const [availablePhotos, setAvailablePhotos] = useState([]);

    // Yeni Özellik Durumları: Lead Havuzu, Canlı Paket Senkronizasyonu, Görsel Sıkıştırma, Canlı Önizleme
    const [siteLeads, setSiteLeads] = useState([]);
    const [leadFilter, setLeadFilter] = useState('all'); // 'all', 'Bekliyor', 'Görüşüldü', 'Kayıt Oldu'
    const [leadSearch, setLeadSearch] = useState('');
    const [systemPackages, setSystemPackages] = useState([]);
    const [syncingPackages, setSyncingPackages] = useState(false);
    const [autoCompressImages, setAutoCompressImages] = useState(true);
    const [livePreviewModal, setLivePreviewModal] = useState({
        isOpen: false,
        device: 'desktop', // 'desktop', 'tablet', 'mobile'
        refreshKey: 0
    });

    // Medya Seçici Modal
    const [pickerModal, setPickerModal] = useState({
        isOpen: false,
        targetField: null, // 'containerBg', 'popupImg', 'itemImg', 'galleryAdd', 'brandLogo'
        itemId: null
    });

    // Fotoğraf Büyütme Lightbox
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [newContainerModal, setNewContainerModal] = useState(false);

    useEffect(() => {
        fetchStudioData();
        fetchLeadsData();
        fetchPackagesData();
    }, []);

    const fetchLeadsData = async () => {
        try {
            const res = await api.get('/Admin/site-leads');
            if (Array.isArray(res.data)) {
                setSiteLeads(res.data);
            }
        } catch (err) {
            console.error('Web başvuruları çekilemedi:', err);
        }
    };

    const fetchPackagesData = async () => {
        try {
            const res = await api.get('/Admin/packages');
            if (Array.isArray(res.data)) {
                setSystemPackages(res.data);
            }
        } catch (err) {
            console.error('Sistem paketleri çekilemedi:', err);
        }
    };

    const handleSyncPackagesNow = async () => {
        setSyncingPackages(true);
        try {
            const res = await api.get('/Admin/packages');
            if (Array.isArray(res.data)) {
                setSystemPackages(res.data);
                setSaveMessage(`Üyelik paketleri canlı sistemle eşitlendi! (${res.data.filter(p => p.showOnWebsite).length} aktif vitrin paketi)`);
                setTimeout(() => setSaveMessage(null), 3500);
            }
        } catch (err) {
            setErrorMessage('Paketler senkronize edilirken hata oluştu.');
        } finally {
            setSyncingPackages(false);
        }
    };

    const handleTogglePackageOnWebsite = async (pkgId) => {
        try {
            const res = await api.post(`/Admin/packages/${pkgId}/toggle-website`);
            setSystemPackages(prev => prev.map(p => p.id === pkgId ? { ...p, showOnWebsite: res.data?.showOnWebsite ?? !p.showOnWebsite } : p));
            setSaveMessage('Paketin web sitesi vitrin görünürlüğü güncellendi!');
            setTimeout(() => setSaveMessage(null), 2500);
        } catch (err) {
            alert('Paket vitrin durumu değiştirilemedi.');
        }
    };

    const handleUpdateLeadStatus = async (leadId, newStatus) => {
        try {
            const res = await api.put(`/Admin/site-leads/${leadId}/status`, { status: newStatus });
            if (res.data) {
                setSiteLeads(prev => prev.map(l => l.id === leadId ? res.data : l));
                setSaveMessage(`Başvuru durumu "${newStatus}" olarak güncellendi.`);
                setTimeout(() => setSaveMessage(null), 2500);
            }
        } catch (err) {
            alert('Başvuru durumu güncellenemedi.');
        }
    };

    const handleDeleteLead = async (leadId) => {
        if (!window.confirm('Bu ön kayıt / iletişim başvurusunu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/Admin/site-leads/${leadId}`);
            setSiteLeads(prev => prev.filter(l => l.id !== leadId));
            setSaveMessage('Başvuru kaydı silindi.');
            setTimeout(() => setSaveMessage(null), 2500);
        } catch (err) {
            alert('Başvuru silinemedi.');
        }
    };

    const handleReplyLeadWhatsApp = async (lead) => {
        let digits = String(lead.phone || '').replace(/\D/g, '');
        if (digits.startsWith('0')) digits = '90' + digits.slice(1);
        else if (digits.length === 10 && digits.startsWith('5')) digits = '90' + digits;

        const msg = encodeURIComponent(
            `Merhaba ${lead.fullName}, N1FIT Spor Merkezi web sitemiz üzerinden bıraktığınız "${lead.goal || 'Ücretsiz Tanışma & Üyelik'}" başvurunuz için iletişime geçiyoruz. Size nasıl yardımcı olabiliriz? 💪`
        );
        window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');

        if (lead.status === 'Bekliyor') {
            handleUpdateLeadStatus(lead.id, 'Görüşüldü');
        }
    };

    const fetchStudioData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Admin/site-studio');
            if (res.data) {
                const fetchedContainers = (res.data.containers || []).sort((a, b) => a.order - b.order);
                setContainers(fetchedContainers);
                if (fetchedContainers.length > 0 && !selectedContainerId) {
                    setSelectedContainerId(fetchedContainers[0].id);
                }
                if (res.data.popupConfig) {
                    setPopupConfig(res.data.popupConfig);
                }
                if (res.data.brandConfig) {
                    setBrandConfig(prev => ({ ...prev, ...res.data.brandConfig }));
                }
                if (res.data.countdownConfig) {
                    setCountdownConfig(res.data.countdownConfig);
                }
                if (res.data.topBarConfig) {
                    setTopBarConfig(prev => ({ ...prev, ...res.data.topBarConfig }));
                }
                if (res.data.greetingConfig) {
                    setGreetingConfig(res.data.greetingConfig);
                }
                if (res.data.seoConfig) {
                    setSeoConfig(res.data.seoConfig);
                }
                if (res.data.themeConfig) {
                    setThemeConfig(res.data.themeConfig);
                }
                if (res.data.availablePhotos) {
                    setAvailablePhotos(res.data.availablePhotos);
                }
            }
        } catch (err) {
            console.error('Stüdyo verisi çekilemedi:', err);
            setErrorMessage('Stüdyo verileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async (refreshPreviewAfterSave = false) => {
        setSaving(true);
        setSaveMessage(null);
        setErrorMessage(null);

        try {
            // Konteynır sıralamasını düzenle
            const normalizedContainers = containers.map((c, idx) => ({
                ...c,
                order: idx + 1
            }));

            const payload = {
                containers: normalizedContainers,
                popupConfig: popupConfig,
                brandConfig: brandConfig,
                countdownConfig: countdownConfig,
                topBarConfig: topBarConfig,
                greetingConfig: greetingConfig,
                seoConfig: seoConfig,
                themeConfig: themeConfig,
                availablePhotos: availablePhotos
            };

            const res = await api.post('/Admin/site-studio', payload);
            if (res.data) {
                setContainers(res.data.containers || normalizedContainers);
                setPopupConfig(res.data.popupConfig || popupConfig);
                if (res.data.brandConfig) {
                    setBrandConfig(prev => ({ ...prev, ...res.data.brandConfig }));
                }
                if (res.data.countdownConfig) setCountdownConfig(res.data.countdownConfig);
                if (res.data.topBarConfig) setTopBarConfig(prev => ({ ...prev, ...res.data.topBarConfig }));
                if (res.data.greetingConfig) setGreetingConfig(res.data.greetingConfig);
                if (res.data.seoConfig) setSeoConfig(res.data.seoConfig);
                if (res.data.themeConfig) setThemeConfig(res.data.themeConfig);
                setAvailablePhotos(res.data.availablePhotos || availablePhotos);
                setSaveMessage('Tüm site yapılandırması ve değişiklikler başarıyla kaydedildi!');
                if (refreshPreviewAfterSave || livePreviewModal.isOpen) {
                    setLivePreviewModal(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
                }
                setTimeout(() => setSaveMessage(null), 4000);
            }
        } catch (err) {
            console.error('Kaydetme hatası:', err);
            setErrorMessage('Değişiklikler kaydedilemedi. Lütfen bağlantınızı kontrol edin.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = async () => {
        if (!window.confirm('Tüm web sitesi konteynırları ve pop-up ayarları fabrika varsayılanlarına sıfırlanacak. Onaylıyor musunuz?')) {
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/Admin/site-studio/reset');
            if (res.data) {
                setContainers(res.data.containers || []);
                setPopupConfig(res.data.popupConfig || {});
                if (res.data.brandConfig) setBrandConfig(prev => ({ ...prev, ...res.data.brandConfig }));
                if (res.data.countdownConfig) setCountdownConfig(res.data.countdownConfig);
                if (res.data.topBarConfig) setTopBarConfig(prev => ({ ...prev, ...res.data.topBarConfig }));
                if (res.data.greetingConfig) setGreetingConfig(res.data.greetingConfig);
                if (res.data.seoConfig) setSeoConfig(res.data.seoConfig);
                if (res.data.themeConfig) setThemeConfig(res.data.themeConfig);
                setAvailablePhotos(res.data.availablePhotos || []);
                if (res.data.containers?.length > 0) {
                    setSelectedContainerId(res.data.containers[0].id);
                }
                setSaveMessage('Sistem varsayılan şablona başarıyla sıfırlandı.');
                setTimeout(() => setSaveMessage(null), 4000);
            }
        } catch (err) {
            console.error('Sıfırlama hatası:', err);
            setErrorMessage('Varsayılanlara sıfırlama başarısız oldu.');
        } finally {
            setSaving(false);
        }
    };

    // --- KONTEYNIR YÖNETİMİ ---
    const handleMoveContainer = (index, direction) => {
        const newContainers = [...containers];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newContainers.length) return;

        const temp = newContainers[index];
        newContainers[index] = newContainers[targetIndex];
        newContainers[targetIndex] = temp;

        setContainers(newContainers);
    };

    const handleToggleContainerActive = (id, e) => {
        e.stopPropagation();
        setContainers(containers.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    };

    const handleDeleteContainer = (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Bu konteynırı sayfadan silmek istediğinize emin misiniz?')) return;

        const updated = containers.filter(c => c.id !== id);
        setContainers(updated);
        if (selectedContainerId === id) {
            setSelectedContainerId(updated.length > 0 ? updated[0].id : null);
        }
    };

    const handleAddContainer = (type) => {
        const typeInfo = CONTAINER_TYPES.find(t => t.type === type);
        const newId = `${type.toLowerCase()}-${Date.now()}`;
        const isSpecial = type === 'SPECIAL_CUSTOM';
        const isBeforeAfter = type === 'BEFORE_AFTER';
        const isReviews = type === 'REVIEWS';
        const isTrainers = type === 'TRAINERS';
        const isCountdown = type === 'COUNTDOWN_CAMPAIGN';
        const isFaq = type === 'FAQ';
        const isHours = type === 'HOURS';

        let defaultItems = [];
        let defaultTitle = `Yeni ${typeInfo ? typeInfo.label : 'Bölüm'}`;
        let defaultSubtitle = 'Bölüm alt başlığı buraya gelecek';
        let defaultBadge = 'YENİ BÖLÜM';

        if (isSpecial) {
            defaultTitle = 'Yeni Özgün & Serbest Blok';
            defaultSubtitle = 'Özgün blok alt başlığı veya tanıtım metni...';
            defaultBadge = 'ÖZEL BÖLÜM';
            defaultItems = [
                { id: Date.now(), title: 'Örnek Kart Başlığı', subtitle: 'Kategori / Rozet', description: 'Bu alana dilediğiniz blog yazısını veya açıklama metnini yazabilirsiniz.', imageUrl: '', tag: 'Öne Çıkan', extraInfo: '', buttonText: 'İncele', buttonLink: '#' }
            ];
        } else if (isBeforeAfter) {
            defaultTitle = 'DEĞİŞİM HİKAYELERİ & BAŞARI';
            defaultSubtitle = 'Disiplin ve doğru programlamayla elde edilen gerçek üye sonuçları';
            defaultBadge = 'ÖNCESİ / SONRASI';
            defaultItems = [
                { id: Date.now(), title: 'Murat S. - 3 Ayda 14 Kg Yağ Kaybı', tag: 'Definasyon & Sıkılaşma', description: 'Kişisel beslenme ve haftada 4 gün hipertrofi programı ile ulaşılan başarı hikayesi.', imageUrl: '/SalonunFotolari/Salon2.jpeg', extraInfo: '/SalonunFotolari/Salon3.jpeg', buttonText: 'Hikayeyi Oku', buttonLink: '#packages' }
            ];
        } else if (isReviews) {
            defaultTitle = 'ÜYELERİMİZ NELER SÖYLÜYOR?';
            defaultSubtitle = 'Google Haritalar 4.9 Puan ve 150+ Gerçek Üye Değerlendirmesi';
            defaultBadge = 'GERÇEK KULLANICI DENEYİMLERİ';
            defaultItems = [
                { id: Date.now(), title: 'Ahmet Karadeniz', subtitle: '1 Yıldır N1FIT Üyesi', tag: 'Google Doğrulanmış', extraInfo: '5', description: 'Gölyaka bölgesinde ekipman kalitesi ve temizlik anlamında rakipsiz. Antrenörlerin ilgisi harika.', imageUrl: '' },
                { id: Date.now() + 1, title: 'Zeynep Yılmaz', subtitle: 'Kadın Seansı Üyesi', tag: 'Google Doğrulanmış', extraInfo: '5', description: 'Kadınlara özel seans saatleri çok rahat ve güvenli. Tesis çok havadar ve hijyenik.', imageUrl: '' }
            ];
        } else if (isTrainers) {
            defaultTitle = 'UZMAN ANTRENÖR KADROMUZ';
            defaultSubtitle = 'Biyomekanik, hipertrofi ve postür alanında akademik yaklaşımlı koçlar';
            defaultBadge = 'PROFESYONEL EKİP';
            defaultItems = [
                { id: Date.now(), title: 'Berkay İsak', subtitle: 'Baş Antrenör & Kurucu', tag: 'Biyomekanik • Hipertrofi', description: '15 yıllık saha tecrübesi, yarışma hazırlığı ve sporcu anatomisi uzmanlığı.', imageUrl: '/SalonunFotolari/Salon1.jpeg', buttonText: 'Instagram: @berkayisak', buttonLink: 'https://instagram.com' }
            ];
        } else if (isCountdown) {
            defaultTitle = 'YENİ SEZON İNDİRİMLERİ BİTİYOR';
            defaultSubtitle = 'Avantajlı paket fiyatlarımız için kalan süreyi kaçırmayın!';
            defaultBadge = 'ACELE EDİN';
        } else if (isFaq) {
            defaultTitle = 'SIKÇA SORULAN SORULAR (SSS)';
            defaultSubtitle = 'Salona kayıt olmadan önce aklınıza takılan tüm soruların şeffaf ve net yanıtları.';
            defaultBadge = 'MERAK EDİLENLER';
            defaultItems = [
                { id: Date.now(), title: 'Kadınlara özel seanslarda erkek üye veya personel bulunuyor mu?', tag: 'Kadın Seansları', description: 'Hayır. Kadınlara özel seanslarımızda (Çarşamba 09:00-20:00, Cuma 18:00-23:00 ve Pazar 09:00-17:00) salonumuz tamamen kadın üyelerimize tahsis edilir ve yalnızca kadın eğitmenimiz görev yapar.' },
                { id: Date.now() + 1, title: 'Spora yeni başlıyorum, antrenman ve beslenme programı veriyor musunuz?', tag: 'Program & Diyet', description: 'Evet! Kayıt olduğunuz ilk gün vücut analiziniz yapılır; hedefinize uygun kişisel antrenman ve Mifflin-St Jeor bazal metabolizma hesabına dayalı beslenme programınız N1FIT Mobil Uygulamanıza tanımlanır.' },
                { id: Date.now() + 2, title: 'Üyeliğimi dondurma (askıya alma) hakkım var mı?', tag: 'Üyelik İşlemleri', description: 'Evet, uzun süreli seyahat, sağlık veya sınav dönemlerinizde yönetimle görüşerek üyeliğinizi dondurabilir, döndüğünüzde kaldığınız günden devam edebilirsiniz.' }
            ];
        }

        const newContainer = {
            id: newId,
            type: type,
            title: defaultTitle,
            subtitle: defaultSubtitle,
            description: '',
            isActive: true,
            order: containers.length + 1,
            badgeText: defaultBadge,
            backgroundImage: '',
            backgroundColor: '#0a0a0c',
            layoutMode: isSpecial ? 'card_grid' : 'card_grid',
            columns: 3,
            primaryButtonText: isCountdown ? 'Fırsatı Yakala' : (isSpecial || isFaq ? '' : 'İncele'),
            primaryButtonLink: '#packages',
            secondaryButtonText: '',
            secondaryButtonLink: '',
            items: defaultItems,
            galleryPhotos: [],
            autoSyncPackages: true,
            showWeeklyTable: isHours ? true : true,
            weeklySchedule: isHours ? [...DEFAULT_WEEKLY_SCHEDULE] : []
        };

        const updated = [...containers, newContainer];
        setContainers(updated);
        setSelectedContainerId(newId);
        setNewContainerModal(false);
    };

    const updateSelectedContainer = (field, value) => {
        setContainers(containers.map(c => {
            if (c.id === selectedContainerId) {
                return { ...c, [field]: value };
            }
            return c;
        }));
    };

    // --- ALT ÖĞELER (ITEMS) YÖNETİMİ ---
    const handleAddItem = () => {
        const selected = containers.find(c => c.id === selectedContainerId);
        if (!selected) return;

        const isFaq = selected.type === 'FAQ';
        const newItem = {
            id: Date.now(),
            title: isFaq ? 'Yeni Soru Başlığı?' : 'Yeni Öğe Başlığı',
            subtitle: '',
            description: isFaq ? 'Sorunun detaylı cevabını buraya yazın...' : 'Açıklama metni...',
            imageUrl: '',
            tag: isFaq ? 'Genel' : '',
            extraInfo: '',
            buttonText: '',
            buttonLink: ''
        };

        updateSelectedContainer('items', [...(selected.items || []), newItem]);
    };

    const handleUpdateItem = (itemId, field, value) => {
        const selected = containers.find(c => c.id === selectedContainerId);
        if (!selected) return;

        const updatedItems = (selected.items || []).map(item => {
            if (item.id === itemId) {
                return { ...item, [field]: value };
            }
            return item;
        });

        updateSelectedContainer('items', updatedItems);
    };

    const handleDeleteItem = (itemId) => {
        const selected = containers.find(c => c.id === selectedContainerId);
        if (!selected) return;

        const updatedItems = (selected.items || []).filter(item => item.id !== itemId);
        updateSelectedContainer('items', updatedItems);
    };

    // --- MEDYA SEÇİCİ MODAL AKIŞI ---
    const openMediaPicker = (targetField, itemId = null) => {
        setPickerModal({
            isOpen: true,
            targetField,
            itemId
        });
    };

    const handleSelectPhotoFromPicker = (photoUrl) => {
        const { targetField, itemId } = pickerModal;

        if (targetField === 'containerBg') {
            updateSelectedContainer('backgroundImage', photoUrl);
        } else if (targetField === 'brandLogo') {
            setBrandConfig(prev => ({ ...prev, logoUrl: photoUrl }));
        } else if (targetField === 'seoOgImg') {
            setSeoConfig(prev => ({ ...prev, ogImageUrl: photoUrl }));
        } else if (targetField === 'popupImg') {
            setPopupConfig({ ...popupConfig, imageUrl: photoUrl });
        } else if (targetField === 'itemImg' && itemId) {
            handleUpdateItem(itemId, 'imageUrl', photoUrl);
        } else if (targetField === 'itemBeforeImg' && itemId) {
            handleUpdateItem(itemId, 'imageUrl', photoUrl);
        } else if (targetField === 'itemAfterImg' && itemId) {
            handleUpdateItem(itemId, 'extraInfo', photoUrl);
        } else if (targetField === 'galleryAdd') {
            const selected = containers.find(c => c.id === selectedContainerId);
            if (selected) {
                const defaultPhotos = [
                    '/SalonunFotolari/Salon1.jpeg',
                    '/SalonunFotolari/Salon2.jpeg',
                    '/SalonunFotolari/Salon3.jpeg',
                    '/SalonunFotolari/Salon4.jpeg',
                    '/SalonunFotolari/Salon5.jpeg',
                    '/SalonunFotolari/Salon6.jpeg',
                    '/SalonunFotolari/Salon7.jpeg',
                    '/SalonunFotolari/Salon8.jpeg',
                    '/SalonunFotolari/Salon9.jpeg',
                    '/SalonunFotolari/Salon10.jpeg'
                ];
                const currentGallery = (Array.isArray(selected.galleryPhotos) && selected.galleryPhotos.length > 0)
                    ? selected.galleryPhotos
                    : defaultPhotos;
                if (!currentGallery.includes(photoUrl)) {
                    updateSelectedContainer('galleryPhotos', [...currentGallery, photoUrl]);
                }
            }
        }

        setPickerModal({ isOpen: false, targetField: null, itemId: null });
    };

    // --- FOTOĞRAF YÜKLEME & OTOMATİK SIKIŞTIRMA (MOBİL HIZLANDIRMA) ---
    const handleFileUpload = async (e) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        if (!rawFile.type.startsWith('image/')) {
            alert('Lütfen sadece resim dosyası seçin (PNG, JPG, WEBP, vb.)');
            return;
        }

        setUploading(true);
        let fileToUpload = rawFile;
        let compressionInfoText = '';

        if (autoCompressImages) {
            const compResult = await compressImageFile(rawFile, 1920, 0.84);
            fileToUpload = compResult.file;
            if (compResult.compressed && compResult.originalSize > 0) {
                const origKB = Math.round(compResult.originalSize / 1024);
                const newKB = Math.round(compResult.newSize / 1024);
                const savedPct = Math.round(((compResult.originalSize - compResult.newSize) / compResult.originalSize) * 100);
                compressionInfoText = ` (⚡ Mobil Hızlandırma: ${origKB} KB ➔ ${newKB} KB, %${savedPct} tasarruf)`;
            }
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);

        try {
            const res = await api.post('/Admin/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.url) {
                const newPhoto = {
                    id: Date.now(),
                    url: res.data.url,
                    label: res.data.fileName || 'Yeni Yüklenen Fotoğraf',
                    isDefault: false,
                    createdDate: new Date().toISOString()
                };

                const updated = [newPhoto, ...availablePhotos];
                setAvailablePhotos(updated);

                // Eğer medya seçici açıksa doğrudan seçilen alana ata
                if (pickerModal.isOpen) {
                    handleSelectPhotoFromPicker(newPhoto.url);
                }

                setSaveMessage(`Fotoğraf başarıyla yüklendi!${compressionInfoText}`);
                setTimeout(() => setSaveMessage(null), 4500);
            }
        } catch (err) {
            console.error('Yükleme hatası:', err);
            alert('Fotoğraf yüklenemedi. ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhotoFromDisk = async (photo, e) => {
        if (e) e.stopPropagation();

        if (photo.isDefault) {
            alert('Varsayılan sistem fotoğrafları güvenlik gerekçesiyle diskten silinemez.');
            return;
        }

        if (!window.confirm(`"${photo.label || photo.url}" görseli sunucu diskinden kalıcı olarak silinecek. Onaylıyor musunuz?`)) {
            return;
        }

        try {
            await api.post('/Admin/delete-photo', { url: photo.url });
            setAvailablePhotos(availablePhotos.filter(p => p.url !== photo.url));
            setSaveMessage('Fotoğraf diskten kalıcı olarak temizlendi.');
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
            console.error('Silme hatası:', err);
            alert('Fotoğraf silinemedi: ' + (err.response?.data?.message || err.message));
        }
    };

    const selectedContainer = containers.find(c => c.id === selectedContainerId);
    const pendingLeadsCount = siteLeads.filter(l => l.status === 'Bekliyor').length;

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={{ color: '#aaa', marginTop: 16 }}>N1FIT Web Stüdyosu Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* ÜST BAŞLIK & BUTONLAR */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <button type="button" onClick={() => navigate('/admin')} style={styles.backBtn}>
                        <ArrowLeft size={18} /> Admin Paneli
                    </button>
                    <div>
                        <div style={styles.headerBadge}>
                            <Sparkles size={14} color="#e50914" /> N1FIT DİJİTAL WEB STÜDYOSU
                        </div>
                        <h1 style={styles.headerTitle}>Web Sitesi & Görsel Yönetim Merkezi</h1>
                    </div>
                </div>

                <div style={styles.headerActions}>
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        disabled={saving}
                        style={styles.resetBtn}
                        title="Sayfayı varsayılan şablona döndür"
                    >
                        <RotateCcw size={16} /> Varsayılana Sıfırla
                    </button>

                    <button
                        type="button"
                        onClick={() => setLivePreviewModal(prev => ({ ...prev, isOpen: true }))}
                        style={{
                            ...styles.viewSiteBtn,
                            backgroundColor: 'rgba(16, 185, 129, 0.14)',
                            border: '1px solid rgba(16, 185, 129, 0.45)',
                            color: '#34d399',
                            fontWeight: '800'
                        }}
                        title="Stüdyodan çıkmadan Masaüstü, Tablet ve Mobil görünümü canlı simüle et"
                    >
                        <Smartphone size={16} /> 📱💻 Canlı Önizleme
                    </button>

                    <button
                        type="button"
                        onClick={() => window.open('/', '_blank')}
                        style={styles.viewSiteBtn}
                    >
                        <ExternalLink size={16} /> Canlı Siteyi Aç
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSaveAll(false)}
                        disabled={saving}
                        style={styles.saveBtn}
                    >
                        {saving ? (
                            <>Kaydediliyor...</>
                        ) : (
                            <>
                                <Save size={18} /> Değişiklikleri Canlıya Al
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* BİLDİRİM MESAJLARI */}
            {saveMessage && (
                <div style={styles.alertSuccess}>
                    <CheckCircle2 size={18} /> {saveMessage}
                </div>
            )}
            {errorMessage && (
                <div style={styles.alertError}>
                    <AlertCircle size={18} /> {errorMessage}
                </div>
            )}

            {/* ANA SEKMELER */}
            <div style={{ ...styles.tabBar, flexWrap: 'wrap' }}>
                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'containers' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('containers')}
                >
                    <Layers size={17} />
                    <span>🧱 Sayfa Blokları</span>
                    <span style={styles.tabCountBadge}>{containers.length}</span>
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'leads' ? styles.tabBtnActive : {}) }}
                    onClick={() => { setActiveTab('leads'); fetchLeadsData(); }}
                >
                    <Users size={17} />
                    <span>📋 Web Başvuruları (Lead Havuzu)</span>
                    <span style={{
                        ...styles.tabCountBadge,
                        backgroundColor: pendingLeadsCount > 0 ? '#e50914' : '#272b38',
                        color: '#fff'
                    }}>
                        {pendingLeadsCount > 0 ? `${pendingLeadsCount} Yeni` : siteLeads.length}
                    </span>
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'theme' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('theme')}
                >
                    <Palette size={17} />
                    <span>🎨 Tema & Renk Paleti</span>
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'brand' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('brand')}
                >
                    <Sparkles size={17} />
                    <span>🏷️ Logo, Marka & WhatsApp Widget</span>
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'automation' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('automation')}
                >
                    <Clock size={17} />
                    <span>⏱️ Üst Duyuru Bandı & Sayaç</span>
                    {(countdownConfig.enabled || topBarConfig.enabled) && <span style={styles.activeDot} />}
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'popup' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('popup')}
                >
                    <Megaphone size={17} />
                    <span>🎁 Karşılama Pop-Up'ı</span>
                    {popupConfig.enabled && <span style={styles.activeDot} />}
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'seo' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('seo')}
                >
                    <Globe size={17} />
                    <span>🔍 SEO & Paylaşım</span>
                </button>

                <button
                    type="button"
                    style={{ ...styles.tabBtn, ...(activeTab === 'media' ? styles.tabBtnActive : {}) }}
                    onClick={() => setActiveTab('media')}
                >
                    <Image size={17} />
                    <span>📸 Medya Kasası</span>
                    <span style={styles.tabCountBadge}>{availablePhotos.length}</span>
                </button>
            </div>

            {/* SEKME 1: KONTEYNIR YÖNETİCİSİ (PAGE BUILDER) */}
            {activeTab === 'containers' && (
                <div style={styles.builderLayout}>
                    {/* SOL PANEL: KONTEYNIR LİSTESİ */}
                    <div style={styles.sidebar}>
                        <div style={styles.sidebarHeader}>
                            <h3 style={styles.sidebarTitle}>Sayfa Akışı (Sıralama)</h3>
                            <button
                                type="button"
                                style={styles.addBlockBtn}
                                onClick={() => setNewContainerModal(true)}
                            >
                                <Plus size={16} /> Yeni Konteynır
                            </button>
                        </div>

                        <div style={styles.containerList}>
                            {containers.map((container, index) => {
                                const isSelected = container.id === selectedContainerId;
                                const typeObj = CONTAINER_TYPES.find(t => t.type === container.type);

                                return (
                                    <div
                                        key={container.id}
                                        style={{
                                            ...styles.containerCard,
                                            ...(isSelected ? styles.containerCardSelected : {}),
                                            opacity: container.isActive ? 1 : 0.6
                                        }}
                                        onClick={() => setSelectedContainerId(container.id)}
                                    >
                                        <div style={styles.cardOrderArea}>
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={(e) => { e.stopPropagation(); handleMoveContainer(index, 'up'); }}
                                                style={{ ...styles.moveBtn, opacity: index === 0 ? 0.3 : 1 }}
                                                title="Yukarı Taşı"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <span style={styles.orderNumber}>{index + 1}</span>
                                            <button
                                                type="button"
                                                disabled={index === containers.length - 1}
                                                onClick={(e) => { e.stopPropagation(); handleMoveContainer(index, 'down'); }}
                                                style={{ ...styles.moveBtn, opacity: index === containers.length - 1 ? 0.3 : 1 }}
                                                title="Aşağı Taşı"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>

                                        <div style={styles.cardInfo}>
                                            <div style={styles.cardHeaderRow}>
                                                <span style={styles.cardTypeBadge}>
                                                    {typeObj ? typeObj.icon : '📦'} {typeObj ? typeObj.label : container.type}
                                                </span>
                                            </div>
                                            <div style={styles.cardTitle}>{container.title || '(Başlıksız Blok)'}</div>
                                        </div>

                                        <div style={styles.cardActions}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleContainerActive(container.id, e)}
                                                style={{
                                                    ...styles.toggleBtn,
                                                    color: container.isActive ? '#10b981' : '#6b7280'
                                                }}
                                                title={container.isActive ? 'Sitede Yayında (Gizlemek için tıkla)' : 'Gizli (Yayına almak için tıkla)'}
                                            >
                                                {container.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteContainer(container.id, e)}
                                                style={styles.deleteCardBtn}
                                                title="Konteynırı Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SAĞ PANEL: SEÇİLİ KONTEYNIR DÜZENLEME FORMU */}
                    <div style={styles.editorPanel}>
                        {selectedContainer ? (
                            <div>
                                <div style={styles.editorHeader}>
                                    <div>
                                        <div style={styles.editorEyebrow}>
                                            {CONTAINER_TYPES.find(t => t.type === selectedContainer.type)?.label || selectedContainer.type} DÜZENLEME
                                        </div>
                                        <h2 style={styles.editorMainTitle}>{selectedContainer.title}</h2>
                                    </div>

                                    <div style={styles.statusToggleGroup}>
                                        <label style={styles.statusLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedContainer.isActive}
                                                onChange={(e) => updateSelectedContainer('isActive', e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span>Bu Blok Sitede Aktif / Yayında</span>
                                        </label>
                                    </div>
                                </div>

                                {/* TEMEL METİN ALANLARI */}
                                <div style={styles.formSection}>
                                    <h4 style={styles.formSectionTitle}>Metin & Başlık Ayarları</h4>
                                    <div style={styles.formGrid}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Konteynır Başlığı</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.title || ''}
                                                onChange={(e) => updateSelectedContainer('title', e.target.value)}
                                                placeholder="Örn: BİLİMSEL SPORUN MERKEZİ"
                                            />
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Üst Rozet / Etiket (Badge)</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.badgeText || ''}
                                                onChange={(e) => updateSelectedContainer('badgeText', e.target.value)}
                                                placeholder="Örn: GÖLYAKA'NIN EN BÜYÜK SALONU"
                                            />
                                        </div>

                                        <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                            <label style={styles.label}>Alt Başlık / Slogan</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.subtitle || ''}
                                                onChange={(e) => updateSelectedContainer('subtitle', e.target.value)}
                                                placeholder="Örn: Bilimin, disiplinin ve 15 yıllık tecrübenin buluştuğu yer..."
                                            />
                                        </div>

                                        <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                            <label style={styles.label}>Detaylı Açıklama / Paragraf</label>
                                            <textarea
                                                style={styles.textarea}
                                                rows={3}
                                                value={selectedContainer.description || ''}
                                                onChange={(e) => updateSelectedContainer('description', e.target.value)}
                                                placeholder="Bölümle ilgili detaylı tanıtım yazısı..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* GÖRSEL VE AKSİYON BUTONLARI */}
                                <div style={styles.formSection}>
                                    <h4 style={styles.formSectionTitle}>Görsel & Buton Ayarları</h4>
                                    <div style={styles.formGrid}>
                                        <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                            <label style={styles.label}>Arka Plan / Kapak Fotoğrafı</label>
                                            <div style={styles.imagePickerRow}>
                                                {selectedContainer.backgroundImage ? (
                                                    <div style={styles.previewThumbWrapper}>
                                                        <img
                                                            src={selectedContainer.backgroundImage}
                                                            alt="Seçili Görsel"
                                                            style={styles.previewThumb}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={styles.noThumbBox}>Fotoğraf Yok</div>
                                                )}

                                                <div style={{ flex: 1 }}>
                                                    <input
                                                        type="text"
                                                        style={styles.input}
                                                        value={selectedContainer.backgroundImage || ''}
                                                        onChange={(e) => updateSelectedContainer('backgroundImage', e.target.value)}
                                                        placeholder="/SalonunFotolari/Salon1.jpeg veya https://..."
                                                    />
                                                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                                        <button
                                                            type="button"
                                                            style={styles.pickerBtn}
                                                            onClick={() => openMediaPicker('containerBg')}
                                                        >
                                                            <Image size={15} /> Kütüphaneden Seç
                                                        </button>
                                                        {selectedContainer.backgroundImage && (
                                                            <button
                                                                type="button"
                                                                style={styles.clearBtn}
                                                                onClick={() => updateSelectedContainer('backgroundImage', '')}
                                                            >
                                                                Kaldır
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Buton 1 */}
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Birincil Buton Metni</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.primaryButtonText || ''}
                                                onChange={(e) => updateSelectedContainer('primaryButtonText', e.target.value)}
                                                placeholder="Örn: Kulübü Keşfet"
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Birincil Buton Hedef Linki</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.primaryButtonLink || ''}
                                                onChange={(e) => updateSelectedContainer('primaryButtonLink', e.target.value)}
                                                placeholder="Örn: #packages veya /login"
                                            />
                                        </div>

                                        {/* Buton 2 */}
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>İkincil Buton Metni (Opsiyonel)</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.secondaryButtonText || ''}
                                                onChange={(e) => updateSelectedContainer('secondaryButtonText', e.target.value)}
                                                placeholder="Örn: Uygulamayı İndir"
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>İkincil Buton Hedef Linki</label>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={selectedContainer.secondaryButtonLink || ''}
                                                onChange={(e) => updateSelectedContainer('secondaryButtonLink', e.target.value)}
                                                placeholder="Örn: #app-section"
                                            />
                                        </div>

                                        {/* Blok Arka Plan Rengi */}
                                        <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                            <ColorPalettePicker
                                                label="Blok Özel Arka Plan Rengi (Opsiyonel / Renk Paleti)"
                                                value={selectedContainer.backgroundColor || ''}
                                                onChange={(val) => updateSelectedContainer('backgroundColor', val)}
                                                placeholder="#0a0a0c"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ÖZGÜN / SERBEST BLOK YERLEŞİM AYARLARI */}
                                {selectedContainer.type === 'SPECIAL_CUSTOM' && (
                                    <div style={styles.formSection}>
                                        <h4 style={styles.formSectionTitle}>✨ Özgün Blok Yerleşim & Yapı Seçenekleri</h4>
                                        <div style={styles.formGrid}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Sayfa Düzeni Tipi (Layout Mode)</label>
                                                <select
                                                    style={styles.select}
                                                    value={selectedContainer.layoutMode || 'card_grid'}
                                                    onChange={(e) => updateSelectedContainer('layoutMode', e.target.value)}
                                                >
                                                    <option value="card_grid">🗂️ Kart Izgarası (Grid / Boyutlandırılabilir)</option>
                                                    <option value="two_column">⚖️ Sağlı Sollu Yerleşim (Blog / Hikaye / Görsel + Yazı)</option>
                                                    <option value="full_text">📄 Geniş Metin & Makale (Tam Genişlik)</option>
                                                </select>
                                                <span style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>
                                                    {selectedContainer.layoutMode === 'two_column' && 'Bir tarafta metin ve hikaye maddeleri, diğer tarafta büyük görsel veya iki eşit sütun görünümü.'}
                                                    {selectedContainer.layoutMode === 'card_grid' && 'İçine ekleyeceğiniz kartlar seçtiğiniz sütun sayısına göre yan yana sıralanır.'}
                                                    {selectedContainer.layoutMode === 'full_text' && 'Dergi/blog tarzında merkezlenmiş okuma metni ve makale düzeni.'}
                                                </span>
                                            </div>

                                            {selectedContainer.layoutMode === 'card_grid' && (
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Sütun Sayısı (Boyutlandırma)</label>
                                                    <select
                                                        style={styles.select}
                                                        value={selectedContainer.columns || 3}
                                                        onChange={(e) => updateSelectedContainer('columns', parseInt(e.target.value, 10))}
                                                    >
                                                        <option value={1}>1 Sütun (Büyük Tek Kartlar - Tam Genişlik)</option>
                                                        <option value={2}>2 Sütun (Geniş İkili Kartlar)</option>
                                                        <option value={3}>3 Sütun (Standart 3'lü Vitrin)</option>
                                                        <option value={4}>4 Sütun (Kompakt 4'lü Izgara)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* SALON FOTOĞRAFLARI & OTOMATİK SLIDER VİTRİNİ (EQUIPMENT_GALLERY) */}
                                {selectedContainer.type === 'EQUIPMENT_GALLERY' && (
                                    <div style={styles.formSection}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                            <div>
                                                <h4 style={{ ...styles.formSectionTitle, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Sparkles size={18} color="#e50914" />
                                                    Salon Fotoğrafları & Otomatik Slider Vitrini
                                                </h4>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                                                    Sitede otomatik kayan salon fotoğraflarını yönetin, yeni görsel ekleyin veya slider konumunu değiştirin.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                style={styles.pickerBtn}
                                                onClick={() => openMediaPicker('galleryAdd')}
                                            >
                                                <Plus size={15} /> + Slider'a Fotoğraf Ekle
                                            </button>
                                        </div>

                                        <div style={{ ...styles.formGrid, marginBottom: 18 }}>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Slider Görünümü</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#fff', fontSize: '0.88rem', height: 42 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContainer.showSlider !== false}
                                                        onChange={(e) => updateSelectedContainer('showSlider', e.target.checked)}
                                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                                    />
                                                    <span>Slider'ı Sitede Aktif Göster</span>
                                                </label>
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Slider Sayfa Konumu</label>
                                                <select
                                                    style={styles.select}
                                                    value={selectedContainer.sliderPosition || 'bottom'}
                                                    onChange={(e) => updateSelectedContainer('sliderPosition', e.target.value)}
                                                >
                                                    <option value="bottom">Ekipman Kartlarının Altında (Varsayılan)</option>
                                                    <option value="top">Ekipman Kartlarının Üstünde (Sayfa Başında)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Fotoğraf Grid */}
                                        <div style={{ backgroundColor: '#0d0f14', padding: 16, borderRadius: 12, border: '1px solid #1f2330', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                                                    Slider'da Dönen Fotoğraflar ({((selectedContainer.galleryPhotos && selectedContainer.galleryPhotos.length > 0) ? selectedContainer.galleryPhotos : [
                                                        '/SalonunFotolari/Salon1.jpeg',
                                                        '/SalonunFotolari/Salon2.jpeg',
                                                        '/SalonunFotolari/Salon3.jpeg',
                                                        '/SalonunFotolari/Salon4.jpeg',
                                                        '/SalonunFotolari/Salon5.jpeg',
                                                        '/SalonunFotolari/Salon6.jpeg',
                                                        '/SalonunFotolari/Salon7.jpeg',
                                                        '/SalonunFotolari/Salon8.jpeg',
                                                        '/SalonunFotolari/Salon9.jpeg',
                                                        '/SalonunFotolari/Salon10.jpeg'
                                                    ]).length} Adet)
                                                </span>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const defaultList = Array.from({ length: 10 }, (_, i) => `/SalonunFotolari/Salon${i + 1}.jpeg`);
                                                            updateSelectedContainer('galleryPhotos', defaultList);
                                                        }}
                                                        style={{ ...styles.clearBtn, padding: '5px 12px', fontSize: '0.78rem' }}
                                                    >
                                                        Tüm Varsayılanları Yükle (10 Foto)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSelectedContainer('galleryPhotos', [])}
                                                        style={{ ...styles.clearBtn, padding: '5px 12px', fontSize: '0.78rem', color: '#f87171' }}
                                                    >
                                                        Tümünü Temizle
                                                    </button>
                                                </div>
                                            </div>

                                            {(() => {
                                                const defaultList = [
                                                    '/SalonunFotolari/Salon1.jpeg',
                                                    '/SalonunFotolari/Salon2.jpeg',
                                                    '/SalonunFotolari/Salon3.jpeg',
                                                    '/SalonunFotolari/Salon4.jpeg',
                                                    '/SalonunFotolari/Salon5.jpeg',
                                                    '/SalonunFotolari/Salon6.jpeg',
                                                    '/SalonunFotolari/Salon7.jpeg',
                                                    '/SalonunFotolari/Salon8.jpeg',
                                                    '/SalonunFotolari/Salon9.jpeg',
                                                    '/SalonunFotolari/Salon10.jpeg'
                                                ];
                                                const currentPhotos = (selectedContainer.galleryPhotos && selectedContainer.galleryPhotos.length > 0)
                                                    ? selectedContainer.galleryPhotos
                                                    : (selectedContainer.galleryPhotos === undefined ? defaultList : []);

                                                if (currentPhotos.length === 0) {
                                                    return (
                                                        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#888', fontSize: '0.88rem' }}>
                                                            Slider için seçili fotoğraf bulunmuyor. "+ Slider'a Fotoğraf Ekle" butonuna basarak medya kütüphanesinden dilediğiniz görselleri ekleyebilirsiniz.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                                                        {currentPhotos.map((photoUrl, pIdx) => (
                                                            <div key={pIdx} style={{
                                                                position: 'relative',
                                                                borderRadius: 8,
                                                                overflow: 'hidden',
                                                                border: '1px solid #282d3b',
                                                                backgroundColor: '#161922',
                                                                aspectRatio: '4/3'
                                                            }}>
                                                                <img
                                                                    src={photoUrl}
                                                                    alt={`Slider Fotoğrafı #${pIdx + 1}`}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: 4,
                                                                    left: 4,
                                                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                                                    color: '#fff',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 'bold',
                                                                    padding: '2px 6px',
                                                                    borderRadius: 4
                                                                }}>
                                                                    #{pIdx + 1}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = currentPhotos.filter((_, idx) => idx !== pIdx);
                                                                        updateSelectedContainer('galleryPhotos', updated);
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: 4,
                                                                        right: 4,
                                                                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                                                        border: 'none',
                                                                        color: '#fff',
                                                                        borderRadius: 4,
                                                                        width: 22,
                                                                        height: 22,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Slider'dan Kaldır"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* KADINLARA ÖZEL SAATLER & HAFTALIK GÖRSEL ÇALIŞMA TAKVİMİ (HOURS) */}
                                {selectedContainer.type === 'HOURS' && (
                                    <div style={styles.formSection}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                                            <div>
                                                <h4 style={{ ...styles.formSectionTitle, margin: 0, border: 'none', padding: 0 }}>
                                                    🗓️ Haftalık Kadınlara Özel & Genel Çalışma Takvimi Tablosu
                                                </h4>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                                                    Ziyaretçilerin hangi gün hangi saatlerde kadın seansı veya genel/karma seans olduğunu tek bakışta gördüğü görsel tablo.
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#34d399', fontSize: '0.85rem', fontWeight: '700' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContainer.showWeeklyTable !== false}
                                                        onChange={(e) => updateSelectedContainer('showWeeklyTable', e.target.checked)}
                                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                                    />
                                                    <span>Haftalık Görsel Tabloyu Göster</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => updateSelectedContainer('weeklySchedule', [...DEFAULT_WEEKLY_SCHEDULE])}
                                                    style={{ ...styles.clearBtn, padding: '6px 12px', fontSize: '0.78rem' }}
                                                >
                                                    Varsayılan 7 Günlük Takvimi Yükle
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {((selectedContainer.weeklySchedule && selectedContainer.weeklySchedule.length > 0)
                                                ? selectedContainer.weeklySchedule
                                                : DEFAULT_WEEKLY_SCHEDULE
                                            ).map((dayRow, dIdx) => {
                                                const currentSchedule = (selectedContainer.weeklySchedule && selectedContainer.weeklySchedule.length > 0)
                                                    ? selectedContainer.weeklySchedule
                                                    : DEFAULT_WEEKLY_SCHEDULE;

                                                const updateDayField = (field, val) => {
                                                    const updated = currentSchedule.map((r, i) => i === dIdx ? { ...r, [field]: val } : r);
                                                    updateSelectedContainer('weeklySchedule', updated);
                                                };

                                                return (
                                                    <div
                                                        key={dayRow.dayName || dIdx}
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '110px 130px 1fr 1fr 1.3fr',
                                                            gap: 10,
                                                            alignItems: 'center',
                                                            backgroundColor: dayRow.isWomenDay ? 'rgba(229, 9, 20, 0.08)' : '#0d0f14',
                                                            border: dayRow.isWomenDay ? '1px solid rgba(229, 9, 20, 0.35)' : '1px solid #1f2330',
                                                            borderRadius: 10,
                                                            padding: '10px 12px'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.88rem' }}>
                                                            {dayRow.dayName}
                                                        </div>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: dayRow.isWomenDay ? '#ff4d6d' : '#9ca3af', fontWeight: '700' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(dayRow.isWomenDay)}
                                                                onChange={(e) => updateDayField('isWomenDay', e.target.checked)}
                                                            />
                                                            <span>🌸 Kadın Günü</span>
                                                        </label>
                                                        <div>
                                                            <label style={{ fontSize: '0.68rem', color: '#f472b6', display: 'block', marginBottom: 2 }}>Kadın Seansı Saati</label>
                                                            <input
                                                                type="text"
                                                                style={{ ...styles.subInput, padding: '6px 8px', fontSize: '0.8rem' }}
                                                                value={dayRow.womenOnlyHours || ''}
                                                                onChange={(e) => updateDayField('womenOnlyHours', e.target.value)}
                                                                placeholder="Örn: 09:00 - 20:00 veya -"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.68rem', color: '#60a5fa', display: 'block', marginBottom: 2 }}>Genel / Karma Saat</label>
                                                            <input
                                                                type="text"
                                                                style={{ ...styles.subInput, padding: '6px 8px', fontSize: '0.8rem' }}
                                                                value={dayRow.generalHours || ''}
                                                                onChange={(e) => updateDayField('generalHours', e.target.value)}
                                                                placeholder="Örn: 09:00 - 23:00"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block', marginBottom: 2 }}>Açıklama / Gün Notu</label>
                                                            <input
                                                                type="text"
                                                                style={{ ...styles.subInput, padding: '6px 8px', fontSize: '0.8rem' }}
                                                                value={dayRow.note || ''}
                                                                onChange={(e) => updateDayField('note', e.target.value)}
                                                                placeholder="Örn: 20:00'a Kadar Kadınlara Özel"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ÜYELİK PAKETLERİ CANLI FİYAT VE VİTRİN SENKRONİZASYONU (PACKAGES) */}
                                {selectedContainer.type === 'PACKAGES' && (
                                    <div style={styles.formSection}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                                            <div>
                                                <h4 style={{ ...styles.formSectionTitle, margin: 0, border: 'none', padding: 0 }}>
                                                    💎 Canlı Üyelik Paketleri & Fiyat Senkronizasyonu
                                                </h4>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                                                    Ana Admin Panelindeki paket fiyatlarınız web sitesiyle canlı eşzamanlanır. Hangi paketin sitede görüneceğini buradan da tek tıkla açıp kapatabilirsiniz.
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#34d399', fontSize: '0.84rem', fontWeight: '700' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContainer.autoSyncPackages !== false}
                                                        onChange={(e) => updateSelectedContainer('autoSyncPackages', e.target.checked)}
                                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                                    />
                                                    <span>Fiyatları Otomatik Eşitle</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleSyncPackagesNow}
                                                    disabled={syncingPackages}
                                                    style={styles.pickerBtn}
                                                >
                                                    <RefreshCw size={14} /> {syncingPackages ? 'Eşitleniyor...' : '🔄 Paketleri Şimdi Eşitle'}
                                                </button>
                                            </div>
                                        </div>

                                        {systemPackages.length === 0 ? (
                                            <div style={styles.emptyItemsBox}>
                                                Sistemde tanımlı üyelik paketi bulunamadı. Admin Paneli &gt; Paketler sekmesinden paket ekleyebilirsiniz.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                                                {systemPackages.map((pkg) => (
                                                    <div
                                                        key={pkg.id}
                                                        style={{
                                                            backgroundColor: pkg.showOnWebsite ? 'rgba(16, 185, 129, 0.08)' : '#0d0f14',
                                                            border: pkg.showOnWebsite ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #232733',
                                                            borderRadius: 12,
                                                            padding: '14px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between',
                                                            gap: 10
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                                <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem' }}>{pkg.name}</span>
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: '800',
                                                                    padding: '2px 8px',
                                                                    borderRadius: 10,
                                                                    backgroundColor: pkg.showOnWebsite ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                                                                    color: pkg.showOnWebsite ? '#34d399' : '#9ca3af'
                                                                }}>
                                                                    {pkg.showOnWebsite ? 'VİTRİNDE AKTİF' : 'GİZLİ'}
                                                                </span>
                                                            </div>
                                                            <div style={{ color: '#e50914', fontSize: '1.35rem', fontWeight: '900' }}>
                                                                {pkg.price} TL <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: '600' }}>/ {pkg.durationMonths} Ay</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePackageOnWebsite(pkg.id)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                borderRadius: 8,
                                                                border: pkg.showOnWebsite ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(16,185,129,0.4)',
                                                                backgroundColor: pkg.showOnWebsite ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.15)',
                                                                color: pkg.showOnWebsite ? '#f87171' : '#34d399',
                                                                fontSize: '0.78rem',
                                                                fontWeight: '800',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {pkg.showOnWebsite ? 'Vitrinden Gizle' : '+ Web Vitrininde Göster'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* BLOK İÇİ ELEMANLAR / KARTLAR (ITEMS) */}
                                <div style={styles.formSection}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <h4 style={{ ...styles.formSectionTitle, margin: 0 }}>
                                            {selectedContainer.type === 'FAQ'
                                                ? `❓ Sıkça Sorulan Sorular & Cevapları (${selectedContainer.items?.length || 0})`
                                                : `Konteynır İçi Kartlar & Maddeler (${selectedContainer.items?.length || 0})`}
                                        </h4>
                                        <button
                                            type="button"
                                            style={styles.addItemBtn}
                                            onClick={handleAddItem}
                                        >
                                            <Plus size={15} /> {selectedContainer.type === 'FAQ' ? 'Yeni Soru-Cevap Ekle' : 'Yeni Kart Ekle'}
                                        </button>
                                    </div>

                                    {(!selectedContainer.items || selectedContainer.items.length === 0) ? (
                                        <div style={styles.emptyItemsBox}>
                                            Bu konteynırda henüz özel bir alt kart veya madde bulunmuyor. Dilerseniz yukarıdaki butonla ekleyebilirsiniz.
                                        </div>
                                    ) : (
                                        <div style={styles.itemsGrid}>
                                            {selectedContainer.items.map((item, idx) => (
                                                <div key={item.id || idx} style={styles.subItemCard}>
                                                    <div style={styles.subItemHeader}>
                                                        <span style={styles.subItemIndex}>
                                                            {selectedContainer.type === 'FAQ' ? `SORU #${idx + 1}` : `#${idx + 1}`}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            style={styles.subItemDelete}
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            title="Bu öğeyi sil"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        <div>
                                                            <label style={styles.subLabel}>
                                                                {selectedContainer.type === 'FAQ' ? '❓ Soru Başlığı' : 'Başlık / Sayaç'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                style={styles.subInput}
                                                                value={item.title || ''}
                                                                onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                                                                placeholder={selectedContainer.type === 'FAQ' ? 'Örn: Üyeliğimi dondurma hakkım var mı?' : 'Kart başlığı veya sayaç'}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label style={styles.subLabel}>
                                                                {selectedContainer.type === 'FAQ' ? '🏷️ Konu / Kategori Rozeti' : 'Etiket / Kategori / Vurgu'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                style={styles.subInput}
                                                                value={item.tag || item.extraInfo || ''}
                                                                onChange={(e) => {
                                                                    handleUpdateItem(item.id, 'tag', e.target.value);
                                                                    handleUpdateItem(item.id, 'extraInfo', e.target.value);
                                                                }}
                                                                placeholder={selectedContainer.type === 'FAQ' ? 'Örn: Kadın Seansları / Üyelik' : 'Örn: 1000m² veya Serbest Ağırlık'}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label style={styles.subLabel}>
                                                                {selectedContainer.type === 'FAQ' ? '💬 Detaylı Cevap Metni' : 'Açıklama'}
                                                            </label>
                                                            <textarea
                                                                style={styles.subTextarea}
                                                                rows={selectedContainer.type === 'FAQ' ? 3 : 2}
                                                                value={item.description || ''}
                                                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                                                placeholder={selectedContainer.type === 'FAQ' ? 'Sorunun net ve açıklayıcı cevabı...' : 'Kart açıklaması...'}
                                                            />
                                                        </div>

                                                        {/* Fotoğraf Alanı: Normal veya Öncesi / Sonrası (FAQ ise gizle) */}
                                                        {selectedContainer.type !== 'FAQ' && (
                                                            selectedContainer.type === 'BEFORE_AFTER' ? (
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, backgroundColor: '#0d0f14', padding: 10, borderRadius: 10, border: '1px solid #232733' }}>
                                                                    <div>
                                                                        <label style={{ ...styles.subLabel, color: '#f87171' }}>1. Öncesi (Before) Fotoğrafı</label>
                                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                                                            {item.imageUrl && (
                                                                                <img src={item.imageUrl} alt="Öncesi" style={styles.miniItemThumb} />
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                style={styles.miniPickerBtn}
                                                                                onClick={() => openMediaPicker('itemBeforeImg', item.id)}
                                                                            >
                                                                                <Image size={13} /> {item.imageUrl ? 'Değiştir' : 'Foto Seç'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ ...styles.subLabel, color: '#4ade80' }}>2. Sonrası (After) Fotoğrafı</label>
                                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                                                            {item.extraInfo && (
                                                                                <img src={item.extraInfo} alt="Sonrası" style={styles.miniItemThumb} />
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                style={styles.miniPickerBtn}
                                                                                onClick={() => openMediaPicker('itemAfterImg', item.id)}
                                                                            >
                                                                                <Image size={13} /> {item.extraInfo ? 'Değiştir' : 'Foto Seç'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <label style={styles.subLabel}>Fotoğraf (Opsiyonel)</label>
                                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                        {item.imageUrl && (
                                                                            <img src={item.imageUrl} alt="" style={styles.miniItemThumb} />
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            style={styles.miniPickerBtn}
                                                                            onClick={() => openMediaPicker('itemImg', item.id)}
                                                                        >
                                                                            <Image size={13} /> {item.imageUrl ? 'Değiştir' : 'Fotoğraf Seç'}
                                                                        </button>
                                                                        {item.imageUrl && (
                                                                            <button
                                                                                type="button"
                                                                                style={styles.clearBtn}
                                                                                onClick={() => handleUpdateItem(item.id, 'imageUrl', '')}
                                                                            >
                                                                                Kaldır
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}

                                                        {selectedContainer.type !== 'FAQ' && (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                                                                <div>
                                                                    <label style={styles.subLabel}>Kart Buton Metni (Opsiyonel)</label>
                                                                    <input
                                                                        type="text"
                                                                        style={styles.subInput}
                                                                        value={item.buttonText || ''}
                                                                        onChange={(e) => handleUpdateItem(item.id, 'buttonText', e.target.value)}
                                                                        placeholder="Örn: İncele / Detay"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={styles.subLabel}>Kart Buton Linki</label>
                                                                    <input
                                                                        type="text"
                                                                        style={styles.subInput}
                                                                        value={item.buttonLink || ''}
                                                                        onChange={(e) => handleUpdateItem(item.id, 'buttonLink', e.target.value)}
                                                                        placeholder="Örn: #packages veya /login"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={styles.noSelectionBox}>
                                <Layers size={48} color="#444" />
                                <p style={{ color: '#888', marginTop: 14 }}>Düzenlemek için sol taraftan bir konteynır seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SEKME 2: AÇILIŞ POP-UP'I (KAMPANYA YÖNETİCİSİ) */}
            {activeTab === 'popup' && (
                <div style={styles.popupLayout}>
                    <div style={styles.popupFormCol}>
                        <div style={styles.popupActiveToggle}>
                            <div>
                                <h3 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1.25rem' }}>
                                    Ziyaretçi Karşılama Pop-Up'ı
                                </h3>
                                <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.9rem' }}>
                                    Web sitesine giren kullanıcılara indirim, duyuru veya özel kampanya afişi gösterir.
                                </p>
                            </div>
                            <label style={styles.switchLabel}>
                                <input
                                    type="checkbox"
                                    checked={popupConfig.enabled}
                                    onChange={(e) => setPopupConfig({ ...popupConfig, enabled: e.target.checked })}
                                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: '700', color: popupConfig.enabled ? '#10b981' : '#ef4444' }}>
                                    {popupConfig.enabled ? 'YAYINDA' : 'KAPALI'}
                                </span>
                            </label>
                        </div>

                        <div style={styles.formSection}>
                            <h4 style={styles.formSectionTitle}>Pop-Up İçerik Bilgileri</h4>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Pop-Up Başlığı</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={popupConfig.title || ''}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, title: e.target.value })}
                                        placeholder="Örn: N1FIT'te Yeni Sezon Avantajları!"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Üst Rozet Metni</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={popupConfig.badgeText || ''}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, badgeText: e.target.value })}
                                        placeholder="Örn: ÖZEL KAMPANYA"
                                    />
                                </div>

                                <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                    <label style={styles.label}>Alt Başlık</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={popupConfig.subtitle || ''}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, subtitle: e.target.value })}
                                        placeholder="Örn: Yıllık Kayıtlarda Kaçırılmayacak Fırsat"
                                    />
                                </div>

                                <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                    <label style={styles.label}>Detaylı Mesaj</label>
                                    <textarea
                                        style={styles.textarea}
                                        rows={3}
                                        value={popupConfig.description || ''}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, description: e.target.value })}
                                        placeholder="Kampanya detayları..."
                                    />
                                </div>

                                <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                    <label style={styles.label}>Kampanya Afiş Görseli</label>
                                    <div style={styles.imagePickerRow}>
                                        {popupConfig.imageUrl ? (
                                            <div style={styles.previewThumbWrapper}>
                                                <img src={popupConfig.imageUrl} alt="" style={styles.previewThumb} />
                                            </div>
                                        ) : (
                                            <div style={styles.noThumbBox}>Görsel Yok</div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                style={styles.input}
                                                value={popupConfig.imageUrl || ''}
                                                onChange={(e) => setPopupConfig({ ...popupConfig, imageUrl: e.target.value })}
                                                placeholder="/SalonunFotolari/Salon1.jpeg veya https://..."
                                            />
                                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                                <button
                                                    type="button"
                                                    style={styles.pickerBtn}
                                                    onClick={() => openMediaPicker('popupImg')}
                                                >
                                                    <Image size={15} /> Kütüphaneden Seç
                                                </button>
                                                {popupConfig.imageUrl && (
                                                    <button
                                                        type="button"
                                                        style={styles.clearBtn}
                                                        onClick={() => setPopupConfig({ ...popupConfig, imageUrl: '' })}
                                                    >
                                                        Kaldır
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Aksiyon Buton Metni</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={popupConfig.buttonText || ''}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, buttonText: e.target.value })}
                                        placeholder="Örn: Fırsatı İncele"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Aksiyon Buton Linki</label>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        value={popupConfig.buttonLink || ''}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, buttonLink: e.target.value })}
                                        placeholder="Örn: #packages veya WhatsApp linki"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Gösterim Sıklığı</label>
                                    <select
                                        style={styles.select}
                                        value={popupConfig.showFrequency || 'once_per_day'}
                                        onChange={(e) => setPopupConfig({ ...popupConfig, showFrequency: e.target.value })}
                                    >
                                        <option value="once_per_day">Günde 1 Kez (Kapatınca 24 saat çıkmaz - Önerilen)</option>
                                        <option value="every_visit">Her Girişte (Sayfa her açıldığında)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ PANEL: CANLI MİNİ ÖNİZLEME (PREVIEW) */}
                    <div style={styles.popupPreviewCol}>
                        <div style={styles.previewHeader}>
                            <Eye size={16} /> Canlı Ziyaretçi Görünümü
                        </div>
                        <div style={styles.previewMockupBox}>
                            <div style={styles.mockupModal}>
                                {popupConfig.imageUrl && (
                                    <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative' }}>
                                        <img src={popupConfig.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, #0e1015, transparent)' }} />
                                    </div>
                                )}
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    {popupConfig.badgeText && (
                                        <span style={{ fontSize: '0.72rem', color: '#ff4d5a', fontWeight: '800', background: 'rgba(229,9,20,0.15)', padding: '3px 10px', borderRadius: 12 }}>
                                            {popupConfig.badgeText}
                                        </span>
                                    )}
                                    <h3 style={{ color: '#fff', fontSize: '1.25rem', margin: '8px 0 4px 0', fontWeight: '900' }}>
                                        {popupConfig.title || 'Pop-Up Başlığı'}
                                    </h3>
                                    {popupConfig.subtitle && (
                                        <h5 style={{ color: '#e50914', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                                            {popupConfig.subtitle}
                                        </h5>
                                    )}
                                    <p style={{ color: '#9aa0b0', fontSize: '0.82rem', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                                        {popupConfig.description || 'Kampanya açıklaması buraya gelecek.'}
                                    </p>
                                    <button type="button" style={{ width: '100%', padding: '10px', backgroundColor: '#e50914', color: '#fff', border: 'none', borderRadius: 10, fontWeight: '800', fontSize: '0.9rem' }}>
                                        {popupConfig.buttonText || 'Fırsatı İncele'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEKME 5: TEMA & RENK PALETİ MOTORU */}
            {activeTab === 'theme' && (
                <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: '#0f1117', border: '1px solid #1a1d24', borderRadius: '18px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Palette size={22} color={themeConfig.accentColor || '#e50914'} />
                            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                Canlı Tema & Renk Paleti Özelleştirici
                            </h3>
                        </div>
                        <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Web sitenizin tüm butonlarına, vurgulu başlıklarına, rozetlerine ve arka plan atmosferine anında hükmedin.
                        </p>
                    </div>

                    {/* Canlı Önizleme Kartı */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '24px' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Eye size={16} color="#10b981" /> Canlı Tema Simülasyonu
                        </h4>

                        <div style={{
                            backgroundColor: '#0a0b0e',
                            border: `1px solid ${themeConfig.accentColor}40`,
                            borderRadius: themeConfig.cornerStyle === 'sharp' ? '4px' : themeConfig.cornerStyle === 'pill' ? '28px' : '16px',
                            padding: '24px',
                            boxShadow: `0 10px 30px ${themeConfig.accentGlow || 'rgba(229,9,20,0.3)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    backgroundColor: `${themeConfig.accentColor}20`,
                                    color: themeConfig.accentColor,
                                    border: `1px solid ${themeConfig.accentColor}`,
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800'
                                }}>
                                    PREMIUM SEÇİM
                                </span>
                                <span style={{ color: '#888', fontSize: '0.8rem' }}>Atmosfer: {themeConfig.backgroundPattern}</span>
                            </div>

                            <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '900', margin: 0 }}>
                                N1<span style={{ color: themeConfig.accentColor }}>FIT</span> SPOR MERKEZİ
                            </h3>

                            <p style={{ color: '#a0a7b8', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                                Bilimin, biyomekaniğin ve disiplinin bir araya geldiği Gölyaka'nın en büyük fitness tesisi.
                            </p>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button type="button" style={{
                                    backgroundColor: themeConfig.accentColor,
                                    color: '#fff',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: themeConfig.cornerStyle === 'sharp' ? '4px' : themeConfig.cornerStyle === 'pill' ? '20px' : '10px',
                                    fontWeight: '800',
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 15px ${themeConfig.accentGlow}`
                                }}>
                                    Hemen Keşfet
                                </button>
                                <button type="button" style={{
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: `1px solid ${themeConfig.accentColor}60`,
                                    padding: '10px 20px',
                                    borderRadius: themeConfig.cornerStyle === 'sharp' ? '4px' : themeConfig.cornerStyle === 'pill' ? '20px' : '10px',
                                    fontWeight: '700',
                                    fontSize: '0.88rem'
                                }}>
                                    WhatsApp İletişim
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Renk Presetleri */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>1. Hazır Renk Paleti Presetleri</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                            {[
                                { id: 'red_power', name: 'Kırmızı Güç', hex: '#e50914', glow: 'rgba(229, 9, 20, 0.4)' },
                                { id: 'gold_elite', name: 'Altın Şampiyon', hex: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
                                { id: 'neon_cyber', name: 'Neon Siber', hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
                                { id: 'emerald_fit', name: 'Zümrüt Doğa', hex: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
                                { id: 'volcano_orange', name: 'Ateş Turuncusu', hex: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' },
                                { id: 'electric_blue', name: 'Elektrik Mavi', hex: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' }
                            ].map((preset) => (
                                <div
                                    key={preset.id}
                                    data-preset-id={preset.id}
                                    style={{
                                        backgroundColor: '#1b1f29',
                                        border: themeConfig.preset === preset.id ? `2px solid ${preset.hex}` : '1px solid #282d3b',
                                        borderRadius: '12px',
                                        padding: '14px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s ease',
                                        boxShadow: themeConfig.preset === preset.id ? `0 0 16px ${preset.glow}` : 'none'
                                    }}
                                    onClick={() => setThemeConfig(prev => ({
                                        ...prev,
                                        preset: preset.id,
                                        accentColor: preset.hex,
                                        accentGlow: preset.glow
                                    }))}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: preset.hex, margin: '0 auto 8px auto', boxShadow: `0 0 10px ${preset.hex}` }} />
                                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700' }}>{preset.name}</div>
                                </div>
                            ))}
                        </div>

                        {/* Özel Renk Seçici (Color Picker & Hızlı Palet) */}
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #232736' }}>
                            <ColorPalettePicker
                                label="Özel Vurgu Rengi Belirle (Palet veya Hex Kod)"
                                value={themeConfig.accentColor || '#e50914'}
                                onChange={(color) => setThemeConfig({
                                    ...themeConfig,
                                    preset: 'custom',
                                    accentColor: color,
                                    accentGlow: `${color}66`
                                })}
                                placeholder="#e50914"
                            />
                        </div>
                    </div>

                    {/* Arka Plan Atmosferi & Köşe Stili */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>2. Arka Plan Atmosferi & Arayüz Detayları</h4>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Arka Plan Dokusu / Deseni</label>
                                <select
                                    style={styles.select}
                                    value={themeConfig.backgroundPattern || 'carbon_fiber'}
                                    onChange={(e) => { const val = e.target.value; setThemeConfig(prev => ({ ...prev, backgroundPattern: val })); }}
                                >
                                    <option value="carbon_fiber">🏎️ Karbon Fiber (Spor & Atletik Doku)</option>
                                    <option value="mesh_grid">🌐 Mesh Grid (Yüksek Teknoloji Izgara Deseni)</option>
                                    <option value="radial_glow">✨ Radyal Işık (Derin Merkez Aydınlatması)</option>
                                    <option value="pure_dark">🖤 Saf Mat Siyah (Minimalist Jet Black)</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Köşe Yuvarlaklık Stili</label>
                                <select
                                    style={styles.select}
                                    value={themeConfig.cornerStyle || 'rounded'}
                                    onChange={(e) => { const val = e.target.value; setThemeConfig(prev => ({ ...prev, cornerStyle: val })); }}
                                >
                                    <option value="rounded">⚪ Modern Yuvarlak (Standart 16px)</option>
                                    <option value="sharp">📐 Agresif Keskin (Sert Spor Köşeleri - 4px)</option>
                                    <option value="pill">💊 Akıcı Kapsül (Soft Pill - 24px)</option>
                                </select>
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <label style={styles.label}>Üst Gezinme Çubuğu (Navbar) Efekti</label>
                                <select
                                    style={styles.select}
                                    value={themeConfig.navbarStyle || 'blur_glass'}
                                    onChange={(e) => { const val = e.target.value; setThemeConfig(prev => ({ ...prev, navbarStyle: val })); }}
                                >
                                    <option value="blur_glass">🧊 Buzlu Cam Efekti (Backdrop Blur - Yarı Saydam Akışkan)</option>
                                    <option value="solid_black">⬛ Derin Mat Opak Siyah (Solid Black)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEKME 6: ÜST ACİL DUYURU ŞERİDİ, GERİ SAYIM SAYACI & AKILLI KARŞILAMA */}
            {activeTab === 'automation' && (
                <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: '#0f1117', border: '1px solid #1a1d24', borderRadius: '18px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Clock size={22} color="#e50914" />
                            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                En Üst Acil Duyuru Şeridi, Geri Sayım Sayacı & Dinamik Gün Selamlaması
                            </h3>
                        </div>
                        <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Sitenin en tepesinde bayram/tatil çalışma saatlerini veya özel seans duyurularını yayınlayın, aciliyet sayacı açın ve günün saatine göre karşılama mesajlarını yönetin.
                        </p>
                    </div>

                    {/* 0. En Üst Acil Duyuru & Bilgilendirme Şeridi (Top Announcement Bar / Marquee) */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ ...styles.formSectionTitle, margin: 0, border: 'none', padding: 0 }}>
                                📢 En Üst Acil Duyuru & Bilgilendirme Şeridi (Top Bar / Kayan Bant)
                            </h4>
                            <label style={styles.statusLabel}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(topBarConfig.enabled)}
                                    onChange={(e) => setTopBarConfig({ ...topBarConfig, enabled: e.target.checked })}
                                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                                <span>{topBarConfig.enabled ? 'Sitede Yayında' : 'Devre Dışı'}</span>
                            </label>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sol Rozet Metni</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={topBarConfig.badgeText || ''}
                                    onChange={(e) => setTopBarConfig({ ...topBarConfig, badgeText: e.target.value })}
                                    placeholder="Örn: DUYURU veya ÖZEL SEANS"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Görünüm Modu</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#fff', fontSize: '0.88rem', height: 42 }}>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(topBarConfig.scrollingMarquee)}
                                        onChange={(e) => setTopBarConfig({ ...topBarConfig, scrollingMarquee: e.target.checked })}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                    <span>🔄 Kayan Haber Bandı (Marquee) Olarak Akıt</span>
                                </label>
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <label style={styles.label}>Duyuru Metni</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={topBarConfig.text || ''}
                                    onChange={(e) => setTopBarConfig({ ...topBarConfig, text: e.target.value })}
                                    placeholder="Örn: 🌸 Çarşamba, Cuma ve Pazar günleri Kadınlara Özel Seanslarımız devam ediyor!"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sağ Kısa Buton Metni (Opsiyonel)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={topBarConfig.buttonText || ''}
                                    onChange={(e) => setTopBarConfig({ ...topBarConfig, buttonText: e.target.value })}
                                    placeholder="Örn: Ön Kayıt Formu"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Buton Hedef Linki</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={topBarConfig.buttonLink || ''}
                                    onChange={(e) => setTopBarConfig({ ...topBarConfig, buttonLink: e.target.value })}
                                    placeholder="#contact veya #hours"
                                />
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <ColorPalettePicker
                                    label="Duyuru Şeridi Arka Plan Rengi"
                                    value={topBarConfig.backgroundColor || '#141824'}
                                    onChange={(color) => setTopBarConfig({ ...topBarConfig, backgroundColor: color })}
                                    placeholder="#141824"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 1. Geri Sayım Sayacı Bandı */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ ...styles.formSectionTitle, margin: 0, border: 'none', padding: 0 }}>
                                ⏱️ Sayfa Üstü Geri Sayım Bandı
                            </h4>
                            <label style={styles.statusLabel}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(countdownConfig.enabled)}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, enabled: e.target.checked })}
                                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                                <span>{countdownConfig.enabled ? 'Sitede Yayında' : 'Devre Dışı'}</span>
                            </label>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Sayaç Başlığı</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={countdownConfig.title || ''}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, title: e.target.value })}
                                    placeholder="Örn: YENİ SEZON ERKEN KAYIT İNDİRİMİ"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Rozet Metni</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={countdownConfig.badgeText || ''}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, badgeText: e.target.value })}
                                    placeholder="Örn: SINIRLI KONTENJAN"
                                />
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <label style={styles.label}>Açıklama / Slogan</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={countdownConfig.subtitle || ''}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, subtitle: e.target.value })}
                                    placeholder="Kontenjanlar dolmadan önce avantajlı üyelik fırsatını yakalayın!"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Hedef Bitiş Tarihi & Saati</label>
                                <input
                                    type="datetime-local"
                                    style={styles.input}
                                    value={countdownConfig.targetDate ? countdownConfig.targetDate.substring(0, 16) : ''}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, targetDate: e.target.value })}
                                />
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <ColorPalettePicker
                                    label="Sayaç Bandı Arka Plan Vurgu Rengi (Renk Paleti & Kod)"
                                    value={countdownConfig.backgroundColor || '#990000'}
                                    onChange={(color) => setCountdownConfig({ ...countdownConfig, backgroundColor: color })}
                                    placeholder="#990000"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Buton Metni</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={countdownConfig.buttonText || ''}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, buttonText: e.target.value })}
                                    placeholder="Fırsatı Yakala"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Buton Hedef Linki</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={countdownConfig.buttonLink || ''}
                                    onChange={(e) => setCountdownConfig({ ...countdownConfig, buttonLink: e.target.value })}
                                    placeholder="#packages"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Günün Saatine Göre Dinamik Selamlama */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ ...styles.formSectionTitle, margin: 0, border: 'none', padding: 0 }}>
                                ☀️ Günün Saatine Göre Dinamik Selamlama
                            </h4>
                            <label style={styles.statusLabel}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(greetingConfig.enabled)}
                                    onChange={(e) => setGreetingConfig({ ...greetingConfig, enabled: e.target.checked })}
                                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                                <span>{greetingConfig.enabled ? 'Aktif' : 'Devre Dışı'}</span>
                            </label>
                        </div>
                        <p style={{ color: '#888', fontSize: '0.85rem', margin: '-8px 0 16px 0' }}>
                            Kullanıcı web sitesine girdiğinde günün saatine göre hero bölümünün en üstünde kişiselleştirilmiş motivasyon rozeti belirir.
                        </p>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>🌅 Sabah Selamlaması (05:00 - 12:00)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={greetingConfig.morningGreeting || ''}
                                    onChange={(e) => setGreetingConfig({ ...greetingConfig, morningGreeting: e.target.value })}
                                    placeholder="Güne Güçlü ve Enerjik Başla, Gölyaka!"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>☀️ Öğle Selamlaması (12:00 - 17:00)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={greetingConfig.afternoonGreeting || ''}
                                    onChange={(e) => setGreetingConfig({ ...greetingConfig, afternoonGreeting: e.target.value })}
                                    placeholder="Günün Zirve Performansını Yakala!"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>🌇 Akşam Selamlaması (17:00 - 22:00)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={greetingConfig.eveningGreeting || ''}
                                    onChange={(e) => setGreetingConfig({ ...greetingConfig, eveningGreeting: e.target.value })}
                                    placeholder="Günün Yorgunluğunu ve Stresini Salonda Bırak!"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>🌙 Gece Selamlaması (22:00 - 05:00)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={greetingConfig.nightGreeting || ''}
                                    onChange={(e) => setGreetingConfig({ ...greetingConfig, nightGreeting: e.target.value })}
                                    placeholder="Yarın İçin Hazırlan, Hedeflerinden Asla Vazgeçme!"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEKME 7: SEO & SOSYAL MEDYA PAYLAŞIM YÖNETİMİ */}
            {activeTab === 'seo' && (
                <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: '#0f1117', border: '1px solid #1a1d24', borderRadius: '18px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Globe size={22} color="#10b981" />
                            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                Arama Motoru Optimizasyonu (SEO) & Sosyal Paylaşım
                            </h3>
                        </div>
                        <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Google aramalarında Gölyaka ve Düzce bölgesinde 1. sıraya yerleşin; WhatsApp ve Instagram'da sitenizin linki paylaşıldığında profesyonel kapak görseli çıksın.
                        </p>
                    </div>

                    {/* Google SERP Önizleme */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Search size={16} color="#3b82f6" /> Google Arama Sonucu Önizlemesi
                        </h4>
                        <div style={{ backgroundColor: '#202124', border: '1px solid #3c4043', borderRadius: '12px', padding: '16px 20px', fontFamily: 'Arial, sans-serif' }}>
                            <div style={{ fontSize: '0.8rem', color: '#bdc1c6', marginBottom: '4px' }}>
                                https://n1fit.com.tr
                            </div>
                            <div style={{ fontSize: '1.2rem', color: '#8ab4f8', fontWeight: '600', marginBottom: '6px', cursor: 'pointer' }}>
                                {seoConfig.metaTitle || 'N1FIT Spor Merkezi | Gölyaka Fitness & Vücut Geliştirme'}
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#bdc1c6', lineHeight: 1.5 }}>
                                {seoConfig.metaDescription || "Bilimsel antrenman, profesyonel ekipmanlar, kadınlara özel seanslar ve 15 yıllık tecrübeyle Gölyaka'da fitness standartlarını yükseltiyoruz."}
                            </div>
                        </div>
                    </div>

                    {/* Meta Başlık & Açıklama */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>Google Meta Etiketleri</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={styles.formGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label style={styles.label}>Sayfa Başlığı (Meta Title)</label>
                                    <span style={{ fontSize: '0.75rem', color: (seoConfig.metaTitle || '').length > 60 ? '#f87171' : '#10b981' }}>
                                        {(seoConfig.metaTitle || '').length} / 60 karakter
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={seoConfig.metaTitle || ''}
                                    onChange={(e) => setSeoConfig({ ...seoConfig, metaTitle: e.target.value })}
                                    placeholder="N1FIT Spor Merkezi | Gölyaka Fitness & Vücut Geliştirme"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label style={styles.label}>Meta Açıklama (Meta Description)</label>
                                    <span style={{ fontSize: '0.75rem', color: (seoConfig.metaDescription || '').length > 160 ? '#f87171' : '#10b981' }}>
                                        {(seoConfig.metaDescription || '').length} / 160 karakter
                                    </span>
                                </div>
                                <textarea
                                    style={styles.textarea}
                                    rows={3}
                                    value={seoConfig.metaDescription || ''}
                                    onChange={(e) => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
                                    placeholder="Arama motorlarında başlığın altında çıkan tanıtım cümlesi..."
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Anahtar Kelimeler (Keywords - Virgülle ayırın)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={seoConfig.keywords || ''}
                                    onChange={(e) => setSeoConfig({ ...seoConfig, keywords: e.target.value })}
                                    placeholder="gölyaka fitness, düzce spor salonu, n1fit, kadın seansları"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sosyal Medya & WhatsApp Paylaşım Kartı (OpenGraph) */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>Sosyal Medya & WhatsApp Paylaşım Kapak Görseli (Open Graph)</h4>
                        <div style={styles.imagePickerRow}>
                            {seoConfig.ogImageUrl ? (
                                <div style={{ ...styles.previewThumbWrapper, width: '130px', height: '80px' }}>
                                    <img
                                        src={seoConfig.ogImageUrl}
                                        alt="Paylaşım Görseli"
                                        style={styles.previewThumb}
                                    />
                                </div>
                            ) : (
                                <div style={{ ...styles.noThumbBox, width: '130px', height: '80px' }}>Kapak Görseli Yok</div>
                            )}

                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Görsel URL'si</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={seoConfig.ogImageUrl || ''}
                                    onChange={(e) => setSeoConfig({ ...seoConfig, ogImageUrl: e.target.value })}
                                    placeholder="/SalonunFotolari/Salon1.jpeg"
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <button
                                        type="button"
                                        style={styles.pickerBtn}
                                        onClick={() => openMediaPicker('seoOgImg')}
                                    >
                                        <Image size={15} /> Kütüphaneden Kapak Seç
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #232736' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(seoConfig.structuredDataEnabled)}
                                    onChange={(e) => setSeoConfig({ ...seoConfig, structuredDataEnabled: e.target.checked })}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span>Google Harita / Spor Kulübü Schema.org (JSON-LD) Yapılandırılmış Verisini Canlıya Ekle</span>
                            </label>
                            <p style={{ color: '#888', fontSize: '0.8rem', margin: '6px 0 0 28px' }}>
                                Google botlarının salonu "SportsClub" olarak haritada tanımasını ve arama sonuçlarında telefon & çalışma saatlerini zengin snippet olarak göstermesini sağlar.
                            </p>
                        </div>
                    </div>
                </div>
            )}


            {/* SEKME 3: MERKEZİ MEDYA KASASI (PHOTO POOL) */}
            {activeTab === 'media' && (
                <div style={styles.mediaLayout}>
                    <div style={styles.mediaUploadBanner}>
                        <div>
                            <h3 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1.2rem' }}>
                                Yeni Fotoğraf Yükle & Mobil Hızlandırıcı
                            </h3>
                            <p style={{ color: '#9aa0b0', margin: '0 0 10px 0', fontSize: '0.88rem' }}>
                                Salonda çektiğiniz yüksek kaliteli fotoğrafları buraya yükleyin. Sitenin tüm alanlarında tek tıkla kullanabilirsiniz.
                            </p>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '6px 12px', borderRadius: 8, color: '#34d399', fontSize: '0.8rem', fontWeight: '700' }}>
                                <input
                                    type="checkbox"
                                    checked={autoCompressImages}
                                    onChange={(e) => setAutoCompressImages(e.target.checked)}
                                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                                />
                                <span>⚡ Otomatik Mobil Hızlandırma & Akıllı Görsel Sıkıştırma (Max 1920px • %85 Kalite)</span>
                            </label>
                        </div>

                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <button
                                type="button"
                                style={styles.uploadBtn}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload size={18} />
                                {uploading ? 'Optimize Ediliyor & Yükleniyor...' : 'Bilgisayardan Fotoğraf Seç'}
                            </button>
                        </div>
                    </div>

                    <div style={styles.galleryGrid}>
                        {availablePhotos.map((photo) => (
                            <div key={photo.url} style={styles.photoCard}>
                                <div style={styles.photoImgWrapper}>
                                    <img
                                        src={photo.url}
                                        alt={photo.label}
                                        style={styles.photoImg}
                                        onClick={() => setPreviewPhoto(photo)}
                                    />
                                    <button
                                        type="button"
                                        style={styles.photoZoomBtn}
                                        onClick={() => setPreviewPhoto(photo)}
                                        title="Büyük Gör"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                </div>

                                <div style={styles.photoMeta}>
                                    <div style={styles.photoLabel} title={photo.label || photo.url}>
                                        {photo.label || 'Salon Görseli'}
                                    </div>

                                    <div style={styles.photoCardActions}>
                                        <button
                                            type="button"
                                            style={styles.copyUrlBtn}
                                            onClick={() => {
                                                navigator.clipboard.writeText(photo.url);
                                                alert('Fotoğraf URL kopyalandı:\n' + photo.url);
                                            }}
                                            title="URL'yi Kopyala"
                                        >
                                            <Copy size={14} /> URL
                                        </button>

                                        {!photo.isDefault && (
                                            <button
                                                type="button"
                                                style={styles.deletePhotoDiskBtn}
                                                onClick={(e) => handleDeletePhotoFromDisk(photo, e)}
                                                title="Fiziki Diskten Sil"
                                            >
                                                <Trash2 size={14} /> Sil
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEKME 4: LOGO, MARKA & SAĞ ALT SABİT WHATSAPP CANLI DESTEK BALONCUĞU */}
            {activeTab === 'brand' && (
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Giriş Bilgi Kartı */}
                    <div style={{ backgroundColor: '#0f1117', border: '1px solid #1a1d24', borderRadius: '18px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Palette size={22} color="#e50914" />
                            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                Site Logosu, Marka & Sabit WhatsApp Canlı Sohbet Baloncuğu
                            </h3>
                        </div>
                        <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Web sitenizin üst gezinme çubuğundaki (Navbar) marka logosunu, kurumsal adını, sosyal medya butonlarını ve sağ altta sabit duran canlı WhatsApp sohbet baloncuğunu buradan yönetebilirsiniz.
                        </p>
                    </div>

                    {/* 1. Canlı Navbar Önizleme Kartı */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Eye size={16} color="#10b981" /> Canlı Navbar Önizlemesi
                        </h4>
                        <div style={{
                            backgroundColor: 'rgba(8, 9, 10, 0.95)',
                            border: '1px solid #232736',
                            borderRadius: '12px',
                            padding: '14px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {(brandConfig.displayMode === 'logo_only' || brandConfig.displayMode === 'logo_and_text') && brandConfig.logoUrl && (
                                    <img
                                        src={brandConfig.logoUrl}
                                        alt="Logo Önizleme"
                                        style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                {(brandConfig.displayMode === 'text_only' || brandConfig.displayMode === 'logo_and_text' || !brandConfig.logoUrl) && (
                                    <span style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>
                                        {brandConfig.brandNamePrefix || 'N1'}
                                        <span style={{ color: '#e50914' }}>{brandConfig.brandNameAccent || 'FIT'}</span>
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#888', fontSize: '0.85rem' }}>
                                <span style={{ color: '#fff' }}>Hakkımızda</span>
                                <span>Paketler</span>
                                <span>İletişim</span>
                                <button type="button" style={{ backgroundColor: '#25d366', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.78rem', margin: '8px 0 0 0' }}>
                            * Yukarıdaki önizleme kutusu, ziyaretçilerin web sitesinin en üstünde göreceği logoyu canlı simüle eder.
                        </p>
                    </div>

                    {/* 2. Logo Görseli Ayarları */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>Logo Görseli (Dosya / Resim)</h4>
                        <div style={styles.imagePickerRow}>
                            {brandConfig.logoUrl ? (
                                <div style={{ ...styles.previewThumbWrapper, width: '110px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0d12' }}>
                                    <img
                                        src={brandConfig.logoUrl}
                                        alt="Seçili Logo"
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ ...styles.noThumbBox, width: '110px', height: '80px' }}>Logo Görseli Yok</div>
                            )}

                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Logo URL'si</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.logoUrl || ''}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, logoUrl: e.target.value })}
                                    placeholder="/favicon.png veya https://.../logo.png"
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <button
                                        type="button"
                                        style={styles.pickerBtn}
                                        onClick={() => openMediaPicker('brandLogo')}
                                    >
                                        <Image size={15} /> Kütüphaneden Logo Seç
                                    </button>
                                    {brandConfig.logoUrl && (
                                        <button
                                            type="button"
                                            style={styles.clearBtn}
                                            onClick={() => setBrandConfig({ ...brandConfig, logoUrl: '' })}
                                        >
                                            Logoyu Kaldır
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Marka Yazısı & Görünüm Tercihi */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>Marka İsmi & Gösterim Modu</h4>
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Marka Ana İsmi (Ön Ek - Beyaz Yazı)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.brandNamePrefix || ''}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, brandNamePrefix: e.target.value })}
                                    placeholder="Örn: N1"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Vurgulu İsim (Kırmızı Yazı)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.brandNameAccent || ''}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, brandNameAccent: e.target.value })}
                                    placeholder="Örn: FIT"
                                />
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <label style={styles.label}>Navbarda Gösterim Tercihi</label>
                                <select
                                    style={styles.select}
                                    value={brandConfig.displayMode || 'logo_and_text'}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, displayMode: e.target.value })}
                                >
                                    <option value="logo_and_text">✨ Hem Logo Görseli Hem Marka Yazısı Birlikte</option>
                                    <option value="logo_only">🖼️ Sadece Logo Görseli (Yazıyı Gizle)</option>
                                    <option value="text_only">🔤 Sadece Marka Yazısı (Logo Görselini Gizle)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 4. Sosyal Medya & İletişim Bağlantıları */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid #1f2330', borderRadius: '16px', padding: '22px' }}>
                        <h4 style={styles.formSectionTitle}>Sosyal Medya Butonları & İletişim Kanalları</h4>
                        <p style={{ color: '#9aa0b0', fontSize: '0.85rem', margin: '-8px 0 16px 0' }}>
                            Bu linkler sitenin alt kısmındaki (footer) ikonlara ve iletişim butonlarına doğrudan bağlanır.
                        </p>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Instagram Profil Linki</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.instagramUrl || ''}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, instagramUrl: e.target.value })}
                                    placeholder="https://www.instagram.com/n1fitspormerkezi/"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>WhatsApp Numarası (Ülke kodu ile, başında + olmadan)</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.whatsAppNumber || ''}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, whatsAppNumber: e.target.value })}
                                    placeholder="Örn: 905396078154"
                                />
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <label style={styles.label}>YouTube Kanal Linki</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.youTubeUrl || ''}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, youTubeUrl: e.target.value })}
                                    placeholder="https://www.youtube.com/@N1FİTSPORMERKEZİ"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Sağ Alt Sabit WhatsApp Canlı Sohbet Baloncuğu (Floating Widget) */}
                    <div style={{ backgroundColor: '#141720', border: '1px solid rgba(37, 211, 102, 0.35)', borderRadius: '16px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                                <h4 style={{ ...styles.formSectionTitle, margin: 0, border: 'none', padding: 0, color: '#4ade80' }}>
                                    💬 Sağ Alt Sabit WhatsApp Canlı Sohbet Baloncuğu (Floating Widget)
                                </h4>
                                <p style={{ color: '#9aa0b0', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                                    Ziyaretçi sayfayı aşağı kaydırsa bile sağ alt köşede sabit duran, tek tıkla hazır mesajla WhatsApp sohbeti başlatan dikkat çekici baloncuk.
                                </p>
                            </div>
                            <label style={styles.statusLabel}>
                                <input
                                    type="checkbox"
                                    checked={brandConfig.floatingWhatsAppEnabled !== false}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, floatingWhatsAppEnabled: e.target.checked })}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <span>{brandConfig.floatingWhatsAppEnabled !== false ? 'Sitede Aktif' : 'Gizli'}</span>
                            </label>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Baloncuk Üzerindeki Kısa Çağrı Metni</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.floatingWhatsAppText ?? 'Canlı Destek & Fiyat Al'}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, floatingWhatsAppText: e.target.value })}
                                    placeholder="Örn: Canlı Destek & Fiyat Al"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Mobil Görünüm</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#fff', fontSize: '0.88rem', height: 42 }}>
                                    <input
                                        type="checkbox"
                                        checked={brandConfig.floatingWhatsAppShowOnMobile !== false}
                                        onChange={(e) => setBrandConfig({ ...brandConfig, floatingWhatsAppShowOnMobile: e.target.checked })}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                    <span>Mobil Telefonlarda da Göster</span>
                                </label>
                            </div>

                            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                                <label style={styles.label}>Tıklandığında Otomatik Yazılacak Karşılama Mesajı</label>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={brandConfig.floatingWhatsAppMessage ?? 'Merhaba, N1FIT web sitesinden yazıyorum. Üyelik paketleri ve salon hakkında bilgi alabilir miyim?'}
                                    onChange={(e) => setBrandConfig({ ...brandConfig, floatingWhatsAppMessage: e.target.value })}
                                    placeholder="Merhaba, N1FIT web sitesinden yazıyorum..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEKME 8: WEB BAŞVURULARI & ÖN KAYIT HAVUZU (LEADS) */}
            {activeTab === 'leads' && (
                <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        backgroundColor: '#0f1117',
                        border: '1px solid #1a1d24',
                        borderRadius: '18px',
                        padding: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <Users size={22} color="#e50914" />
                                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>
                                    Web Başvuruları & Ücretsiz Tanışma / Ön Kayıt Havuzu
                                </h3>
                            </div>
                            <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.9rem' }}>
                                Web sitenizdeki "Ücretsiz Tanışma Antrenmanı & Ön Kayıt Formu" üzerinden bilgi bırakan potansiyel üyeleri buradan takip edin ve tek tıkla WhatsApp'tan dönüş yapın.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchLeadsData}
                            style={styles.pickerBtn}
                        >
                            <RefreshCw size={15} /> Listeyi Yenile
                        </button>
                    </div>

                    {/* KPI Özet Kartları */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        {[
                            { label: 'Toplam Başvuru', count: siteLeads.length, color: '#fff', bg: '#141720' },
                            { label: '⏳ Bekleyen (Yeni)', count: siteLeads.filter(l => l.status === 'Bekliyor').length, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                            { label: '📞 Görüşülen', count: siteLeads.filter(l => l.status === 'Görüşüldü').length, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                            { label: '✅ Kayda Dönüşen', count: siteLeads.filter(l => l.status === 'Kayıt Oldu').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
                        ].map((stat, idx) => (
                            <div key={idx} style={{ backgroundColor: stat.bg, border: '1px solid #232736', borderRadius: '14px', padding: '18px 20px' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: stat.color }}>{stat.count}</div>
                                <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: '700', marginTop: 4 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Arama ve Durum Filtresi */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        backgroundColor: '#141720',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: '1px solid #1f2330'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { id: 'all', label: 'Tümü' },
                                { id: 'Bekliyor', label: '⏳ Bekliyor' },
                                { id: 'Görüşüldü', label: '📞 Görüşüldü' },
                                { id: 'Kayıt Oldu', label: '✅ Kayıt Oldu' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setLeadFilter(f.id)}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        border: leadFilter === f.id ? '1px solid #e50914' : '1px solid #282d3b',
                                        backgroundColor: leadFilter === f.id ? '#e50914' : '#0d0f14',
                                        color: '#fff',
                                        fontWeight: '700',
                                        fontSize: '0.82rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative', minWidth: '260px', flex: '0 1 340px' }}>
                            <input
                                type="text"
                                style={{ ...styles.input, paddingLeft: '14px' }}
                                placeholder="İsim, telefon veya hedef ara..."
                                value={leadSearch}
                                onChange={(e) => setLeadSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Başvuru Listesi */}
                    {(() => {
                        const q = normalizeTr(leadSearch);
                        const filtered = siteLeads.filter(l => {
                            if (leadFilter !== 'all' && l.status !== leadFilter) return false;
                            if (!q) return true;
                            const haystack = normalizeTr(`${l.fullName} ${l.phone} ${l.goal} ${l.note}`);
                            return haystack.includes(q);
                        });

                        if (filtered.length === 0) {
                            return (
                                <div style={{
                                    backgroundColor: '#141720',
                                    border: '1px dashed #2a2f3d',
                                    borderRadius: '16px',
                                    padding: '48px 24px',
                                    textAlign: 'center',
                                    color: '#8b93a7'
                                }}>
                                    Henüz bu filtreye uygun bir web başvurusu bulunmuyor. Ziyaretçiler ana sayfadaki "Ücretsiz Tanışma & Ön Kayıt Formu"nu doldurduğunda anında buraya düşecektir.
                                </div>
                            );
                        }

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filtered.map((lead) => (
                                    <div
                                        key={lead.id}
                                        style={{
                                            backgroundColor: '#141720',
                                            border: lead.status === 'Bekliyor' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #232736',
                                            borderRadius: '14px',
                                            padding: '18px 22px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '16px'
                                        }}
                                    >
                                        <div style={{ flex: '1 1 340px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                                                    {lead.fullName}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '800',
                                                    padding: '3px 10px',
                                                    borderRadius: '20px',
                                                    backgroundColor: 'rgba(229, 9, 20, 0.15)',
                                                    color: '#ff4d5a',
                                                    border: '1px solid rgba(229, 9, 20, 0.35)'
                                                }}>
                                                    🎯 {lead.goal || 'Genel Bilgi'}
                                                </span>
                                                {lead.preferredTime && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '3px 10px',
                                                        borderRadius: '20px',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                                        color: '#60a5fa'
                                                    }}>
                                                        ⏰ {lead.preferredTime}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString('tr-TR') : ''}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#d1d5db', fontSize: '0.9rem', fontWeight: '700' }}>
                                                <span>📞 {lead.phone}</span>
                                                {lead.note && (
                                                    <span style={{ color: '#9ca3af', fontWeight: '500', fontStyle: 'italic' }}>
                                                        💬 "{lead.note}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <select
                                                value={lead.status || 'Bekliyor'}
                                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                                style={{
                                                    ...styles.select,
                                                    width: 'auto',
                                                    padding: '8px 12px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '800',
                                                    backgroundColor: lead.status === 'Kayıt Oldu' ? 'rgba(16,185,129,0.15)' : lead.status === 'Görüşüldü' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                                                    color: lead.status === 'Kayıt Oldu' ? '#34d399' : lead.status === 'Görüşüldü' ? '#60a5fa' : '#fbbf24'
                                                }}
                                            >
                                                <option value="Bekliyor">⏳ Bekliyor</option>
                                                <option value="Görüşüldü">📞 Görüşüldü</option>
                                                <option value="Kayıt Oldu">✅ Kayıt Oldu</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => handleReplyLeadWhatsApp(lead)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    backgroundColor: '#25D366',
                                                    color: '#000',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    padding: '9px 14px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '900',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <MessageCircle size={15} /> WhatsApp'tan Yaz
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLead(lead.id)}
                                                style={{
                                                    ...styles.deleteCardBtn,
                                                    padding: '8px 10px',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    borderRadius: '8px'
                                                }}
                                                title="Başvuruyu Sil"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* CANLI MASAÜSTÜ / TABLET / MOBİL ÖNİZLEME MODALI (LIVE PREVIEW) */}
            {livePreviewModal.isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(5, 6, 8, 0.92)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 3500,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Önizleme Üst Kontrol Çubuğu */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 24px',
                        backgroundColor: '#0f1117',
                        borderBottom: '1px solid #232736',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Sparkles size={18} color="#34d399" />
                            <span style={{ color: '#fff', fontWeight: '900', fontSize: '1rem' }}>
                                N1FIT Canlı Cihaz Simülatörü & Önizleme
                            </span>
                        </div>

                        {/* Cihaz Seçici Butonlar */}
                        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#161922', padding: '4px', borderRadius: '12px', border: '1px solid #262b38' }}>
                            {[
                                { id: 'desktop', label: '💻 Masaüstü (100%)', icon: Monitor },
                                { id: 'tablet', label: '📟 Tablet (768px)', icon: Tablet },
                                { id: 'mobile', label: '📱 Mobil Telefon (390px)', icon: Smartphone }
                            ].map((dev) => {
                                const IconComp = dev.icon;
                                const active = livePreviewModal.device === dev.id;
                                return (
                                    <button
                                        key={dev.id}
                                        type="button"
                                        onClick={() => setLivePreviewModal(prev => ({ ...prev, device: dev.id }))}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: active ? '#e50914' : 'transparent',
                                            color: active ? '#fff' : '#9ca3af',
                                            fontWeight: '800',
                                            fontSize: '0.82rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <IconComp size={15} /> {dev.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => handleSaveAll(true)}
                                disabled={saving}
                                style={{
                                    ...styles.saveBtn,
                                    padding: '8px 16px',
                                    fontSize: '0.82rem'
                                }}
                            >
                                <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet & Önizlemeyi Güncelle'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setLivePreviewModal(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }))}
                                style={{ ...styles.viewSiteBtn, padding: '8px 12px', fontSize: '0.82rem' }}
                            >
                                <RefreshCw size={14} /> Yenile
                            </button>

                            <button
                                type="button"
                                onClick={() => setLivePreviewModal(prev => ({ ...prev, isOpen: false }))}
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#f87171',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕ Kapat
                            </button>
                        </div>
                    </div>

                    {/* Cihaz Çerçevesi Alanı */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: livePreviewModal.device === 'desktop' ? '0' : '24px',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            width: livePreviewModal.device === 'mobile' ? '390px' : livePreviewModal.device === 'tablet' ? '768px' : '100%',
                            height: livePreviewModal.device === 'mobile' ? '820px' : livePreviewModal.device === 'tablet' ? '92%' : '100%',
                            maxHeight: '100%',
                            backgroundColor: '#08090a',
                            border: livePreviewModal.device === 'desktop' ? 'none' : '10px solid #1e222d',
                            borderRadius: livePreviewModal.device === 'desktop' ? '0' : '32px',
                            boxShadow: livePreviewModal.device === 'desktop' ? 'none' : '0 25px 70px rgba(0,0,0,0.85)',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                        }}>
                            <iframe
                                key={livePreviewModal.refreshKey}
                                src={`/home?preview=${livePreviewModal.refreshKey}`}
                                title="N1FIT Canlı Önizleme"
                                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#08090a' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* YENİ KONTEYNIR EKLEME MODALI */}
            {newContainerModal && (
                <div style={styles.modalBackdrop} onClick={() => setNewContainerModal(false)}>
                    <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>Sayfaya Yeni Konteynır Ekle</h3>
                            <button type="button" style={styles.modalClose} onClick={() => setNewContainerModal(false)}>✕</button>
                        </div>
                        <p style={{ color: '#9aa0b0', fontSize: '0.88rem', margin: '8px 0 20px 0' }}>
                            Web sitenize eklemek istediğiniz blok türünü seçin:
                        </p>

                        <div style={styles.typeSelectorGrid}>
                            {CONTAINER_TYPES.map((t) => (
                                <div
                                    key={t.type}
                                    style={styles.typeOptionCard}
                                    onClick={() => handleAddContainer(t.type)}
                                >
                                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{t.icon}</div>
                                    <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1rem' }}>{t.label}</h4>
                                    <p style={{ color: '#888', margin: 0, fontSize: '0.78rem', lineHeight: 1.4 }}>{t.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MEDYA SEÇİCİ MODAL (PICKER) */}
            {pickerModal.isOpen && (
                <div style={styles.modalBackdrop} onClick={() => setPickerModal({ isOpen: false, targetField: null, itemId: null })}>
                    <div style={{ ...styles.modalCard, maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Image size={20} color="#e50914" />
                                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>Kütüphaneden Fotoğraf Seç</h3>
                            </div>
                            <button
                                type="button"
                                style={styles.modalClose}
                                onClick={() => setPickerModal({ isOpen: false, targetField: null, itemId: null })}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ color: '#9aa0b0', fontSize: '0.88rem', margin: '6px 0 16px 0' }}>
                            Atamak istediğiniz fotoğrafın üzerine tıklayın. Dilerseniz hemen yeni bir görsel de yükleyebilirsiniz.
                        </p>

                        <div style={styles.pickerGrid}>
                            {availablePhotos.map((photo) => (
                                <div
                                    key={photo.url}
                                    style={styles.pickerPhotoCard}
                                    onClick={() => handleSelectPhotoFromPicker(photo.url)}
                                >
                                    <img src={photo.url} alt="" style={styles.pickerThumb} />
                                    <div style={styles.pickerPhotoLabel}>{photo.label || 'Görsel'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* BÜYÜK FOTOĞRAF ÖNİZLEME LIGHTBOX */}
            {previewPhoto && (
                <div style={styles.modalBackdrop} onClick={() => setPreviewPhoto(null)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={previewPhoto.url}
                            alt=""
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}
                        />
                        <button
                            type="button"
                            style={styles.lightboxCloseBtn}
                            onClick={() => setPreviewPhoto(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#07080a',
        color: '#f0f2f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px 32px'
    },
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#07080a'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #222',
        borderTop: '3px solid #e50914',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid #1a1d24',
        marginBottom: '20px'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    backBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#13161c',
        border: '1px solid #252a36',
        borderRadius: '10px',
        color: '#c2c8d6',
        fontSize: '0.88rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    headerBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.72rem',
        fontWeight: '800',
        letterSpacing: '1px',
        color: '#ff4d5a',
        marginBottom: '4px'
    },
    headerTitle: {
        fontSize: '1.6rem',
        fontWeight: '900',
        color: '#ffffff',
        margin: 0,
        letterSpacing: '-0.5px'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    resetBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '10px',
        color: '#f87171',
        fontSize: '0.88rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    viewSiteBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#161922',
        border: '1px solid #2a2e39',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.88rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    saveBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        backgroundColor: '#e50914',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.94rem',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 8px 25px rgba(229, 9, 20, 0.45)',
        transition: 'all 0.2s ease'
    },
    alertSuccess: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 20px',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '12px',
        color: '#34d399',
        fontSize: '0.92rem',
        fontWeight: '600',
        marginBottom: '20px'
    },
    alertError: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 20px',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '12px',
        color: '#f87171',
        fontSize: '0.92rem',
        fontWeight: '600',
        marginBottom: '20px'
    },
    tabBar: {
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid #1a1d24',
        paddingBottom: '14px'
    },
    tabBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px',
        backgroundColor: '#0f1117',
        border: '1px solid #1e222b',
        borderRadius: '12px',
        color: '#8b93a7',
        fontSize: '0.94rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    tabBtnActive: {
        backgroundColor: '#1b1f29',
        border: '1px solid #e50914',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(229, 9, 20, 0.2)'
    },
    tabCountBadge: {
        backgroundColor: '#272b38',
        color: '#fff',
        fontSize: '0.72rem',
        padding: '2px 8px',
        borderRadius: '10px',
        fontWeight: '800'
    },
    activeDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#10b981'
    },
    builderLayout: {
        display: 'grid',
        gridTemplateColumns: '360px 1fr',
        gap: '24px',
        alignItems: 'start'
    },
    sidebar: {
        backgroundColor: '#0f1117',
        border: '1px solid #1a1d24',
        borderRadius: '18px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
    },
    sidebarHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid #1d212b'
    },
    sidebarTitle: {
        fontSize: '1rem',
        fontWeight: '800',
        color: '#fff',
        margin: 0
    },
    addBlockBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: '#e50914',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.78rem',
        fontWeight: '700',
        cursor: 'pointer'
    },
    containerList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    containerCard: {
        backgroundColor: '#151821',
        border: '1px solid #232733',
        borderRadius: '14px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    containerCardSelected: {
        border: '1px solid #e50914',
        backgroundColor: '#1b1e2a',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
    },
    cardOrderArea: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px'
    },
    moveBtn: {
        background: 'none',
        border: 'none',
        color: '#71788a',
        padding: '2px',
        cursor: 'pointer'
    },
    orderNumber: {
        fontSize: '0.75rem',
        fontWeight: '800',
        color: '#8e96a8'
    },
    cardInfo: {
        flex: 1,
        minWidth: 0
    },
    cardHeaderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px'
    },
    cardTypeBadge: {
        fontSize: '0.72rem',
        color: '#9aa0b0',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    cardTitle: {
        fontSize: '0.88rem',
        fontWeight: '800',
        color: '#ffffff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    cardActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    toggleBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px'
    },
    deleteCardBtn: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        padding: '4px',
        opacity: 0.7
    },
    editorPanel: {
        backgroundColor: '#0f1117',
        border: '1px solid #1a1d24',
        borderRadius: '18px',
        padding: '26px'
    },
    editorHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '20px',
        borderBottom: '1px solid #1e222b',
        marginBottom: '24px'
    },
    editorEyebrow: {
        fontSize: '0.75rem',
        fontWeight: '800',
        color: '#e50914',
        letterSpacing: '1px',
        marginBottom: '4px'
    },
    editorMainTitle: {
        fontSize: '1.45rem',
        fontWeight: '900',
        color: '#fff',
        margin: 0
    },
    statusToggleGroup: {
        backgroundColor: '#171a23',
        padding: '10px 16px',
        borderRadius: '12px',
        border: '1px solid #272c3b'
    },
    statusLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.88rem',
        fontWeight: '700',
        color: '#fff',
        cursor: 'pointer'
    },
    formSection: {
        backgroundColor: '#141720',
        border: '1px solid #1f2330',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '22px'
    },
    formSectionTitle: {
        fontSize: '1rem',
        fontWeight: '800',
        color: '#fff',
        margin: '0 0 16px 0',
        borderBottom: '1px solid #232736',
        paddingBottom: '10px'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '0.82rem',
        fontWeight: '700',
        color: '#a0a7b8'
    },
    input: {
        padding: '12px 14px',
        backgroundColor: '#0b0d12',
        border: '1px solid #272c3b',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border 0.2s ease'
    },
    textarea: {
        padding: '12px 14px',
        backgroundColor: '#0b0d12',
        border: '1px solid #272c3b',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.9rem',
        outline: 'none',
        resize: 'vertical'
    },
    select: {
        padding: '12px 14px',
        backgroundColor: '#0b0d12',
        border: '1px solid #272c3b',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.9rem',
        outline: 'none',
        cursor: 'pointer'
    },
    imagePickerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    previewThumbWrapper: {
        width: '90px',
        height: '65px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #2a2e3d'
    },
    previewThumb: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    noThumbBox: {
        width: '90px',
        height: '65px',
        borderRadius: '10px',
        border: '1px dashed #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '0.75rem'
    },
    pickerBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        backgroundColor: '#1d222e',
        border: '1px solid #2d3345',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.82rem',
        fontWeight: '700',
        cursor: 'pointer'
    },
    clearBtn: {
        padding: '8px 12px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ef4444',
        fontSize: '0.82rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    addItemBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        backgroundColor: '#1e2433',
        border: '1px solid #2b3347',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.8rem',
        fontWeight: '700',
        cursor: 'pointer'
    },
    emptyItemsBox: {
        padding: '24px',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.88rem',
        backgroundColor: '#0c0e14',
        borderRadius: '10px',
        border: '1px dashed #222'
    },
    itemsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px'
    },
    subItemCard: {
        backgroundColor: '#0c0e14',
        border: '1px solid #222736',
        borderRadius: '12px',
        padding: '14px'
    },
    subItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
    },
    subItemIndex: {
        fontSize: '0.75rem',
        fontWeight: '800',
        color: '#e50914'
    },
    subItemDelete: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        padding: '2px'
    },
    subLabel: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#8b92a3',
        marginBottom: '4px',
        display: 'block'
    },
    subInput: {
        width: '100%',
        padding: '8px 10px',
        backgroundColor: '#141720',
        border: '1px solid #262b3b',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.82rem',
        boxSizing: 'border-box'
    },
    subTextarea: {
        width: '100%',
        padding: '8px 10px',
        backgroundColor: '#141720',
        border: '1px solid #262b3b',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.82rem',
        boxSizing: 'border-box',
        resize: 'vertical'
    },
    miniItemThumb: {
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        objectFit: 'cover'
    },
    miniPickerBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        backgroundColor: '#1b1f2b',
        border: '1px solid #282f42',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '0.75rem',
        cursor: 'pointer'
    },
    noSelectionBox: {
        minHeight: '350px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    popupLayout: {
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '28px',
        alignItems: 'start'
    },
    popupFormCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    popupActiveToggle: {
        backgroundColor: '#0f1117',
        border: '1px solid #1f2330',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    switchLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer'
    },
    popupPreviewCol: {
        backgroundColor: '#0f1117',
        border: '1px solid #1f2330',
        borderRadius: '16px',
        padding: '24px'
    },
    previewHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#9aa0b0',
        fontSize: '0.88rem',
        fontWeight: '700',
        marginBottom: '16px'
    },
    previewMockupBox: {
        backgroundColor: '#050608',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #1a1d24',
        display: 'flex',
        justifyContent: 'center'
    },
    mockupModal: {
        width: '100%',
        maxWidth: '360px',
        backgroundColor: '#0e1015',
        border: '1px solid #2a2e39',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(229, 9, 20, 0.2)'
    },
    mediaLayout: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    mediaUploadBanner: {
        backgroundColor: '#0f1117',
        border: '1px solid #1f2330',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
    },
    uploadBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 22px',
        backgroundColor: '#e50914',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.92rem',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(229, 9, 20, 0.4)'
    },
    galleryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '18px'
    },
    photoCard: {
        backgroundColor: '#0f1117',
        border: '1px solid #1a1d24',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    photoImgWrapper: {
        position: 'relative',
        width: '100%',
        height: '160px',
        backgroundColor: '#161922',
        cursor: 'pointer'
    },
    photoImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    photoZoomBtn: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        cursor: 'pointer'
    },
    photoMeta: {
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    photoLabel: {
        fontSize: '0.82rem',
        fontWeight: '700',
        color: '#d4d8e3',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    photoCardActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    copyUrlBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        backgroundColor: '#181b24',
        border: '1px solid #282d3d',
        borderRadius: '6px',
        color: '#9aa0b0',
        fontSize: '0.74rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    deletePhotoDiskBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        color: '#f87171',
        fontSize: '0.74rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    modalBackdrop: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
    },
    modalCard: {
        backgroundColor: '#0f1117',
        border: '1px solid #252a38',
        borderRadius: '20px',
        padding: '26px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '85vh',
        overflowY: 'auto'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalClose: {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '1.2rem',
        cursor: 'pointer'
    },
    typeSelectorGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '14px'
    },
    typeOptionCard: {
        backgroundColor: '#151822',
        border: '1px solid #242938',
        borderRadius: '14px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column'
    },
    pickerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '12px',
        maxHeight: '480px',
        overflowY: 'auto',
        padding: '4px'
    },
    pickerPhotoCard: {
        backgroundColor: '#161922',
        border: '1px solid #262b3b',
        borderRadius: '10px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s ease'
    },
    pickerThumb: {
        width: '100%',
        height: '95px',
        objectFit: 'cover'
    },
    pickerPhotoLabel: {
        padding: '6px',
        fontSize: '0.7rem',
        color: '#bbb',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'center'
    },
    lightboxCloseBtn: {
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        backgroundColor: '#e50914',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        color: '#fff',
        fontSize: '18px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
    }
};

export default SiteStudio;
