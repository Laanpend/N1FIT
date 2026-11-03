import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, RotateCcw,
    Check, Sparkles, Image, Dumbbell, Layers, AlertCircle,
    Upload, Link, ExternalLink, Copy, ZoomIn, X
} from 'lucide-react';
import api from '../api/axiosConfig';

const DEFAULT_SALON_PHOTOS = [
    { id: 1, url: '/SalonunFotolari/Salon1.jpeg', label: 'Salon 1 (Dumbell & Serbest Ağırlık Parkuru)', isDefault: true },
    { id: 2, url: '/SalonunFotolari/Salon2.jpeg', label: 'Salon 2 (Leg Press & Alt Gövde İstasyonu)', isDefault: true },
    { id: 3, url: '/SalonunFotolari/Salon3.jpeg', label: 'Salon 3 (Squat Kafesi / Power Rack)', isDefault: true },
    { id: 4, url: '/SalonunFotolari/Salon4.jpeg', label: 'Salon 4 (Chest Press & Makineler)', isDefault: true },
    { id: 5, url: '/SalonunFotolari/Salon5.jpeg', label: 'Salon 5 (Koşu Bantları & Kardiyo Hattı)', isDefault: true },
    { id: 6, url: '/SalonunFotolari/Salon6.jpeg', label: 'Salon 6 (Pilates & Reformer Stüdyosu 1)', isDefault: true },
    { id: 7, url: '/SalonunFotolari/Salon7.jpeg', label: 'Salon 7 (Pilates Stüdyosu / Toplar & Minderler)', isDefault: true },
    { id: 8, url: '/SalonunFotolari/Salon8.jpeg', label: 'Salon 8 (Grup Dersleri & Esneme Alanı)', isDefault: true },
    { id: 9, url: '/SalonunFotolari/Salon9.jpeg', label: 'Salon 9 (Pilates & Kadın Çalışma Alanı)', isDefault: true },
    { id: 10, url: '/SalonunFotolari/Salon10.jpeg', label: 'Salon 10 (Kablo Parkuru & Lat Pulldown)', isDefault: true }
];

const CATEGORIES = [
    { key: 'free', label: 'Serbest Ağırlık & Dumbell' },
    { key: 'machines', label: 'Özel & İzole Makineler' },
    { key: 'cardio', label: 'Kardiyo Parkuru' },
    { key: 'pilates', label: 'Pilates & Stüdyo' }
];

const FacilityManager = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'gallery' | 'photos'
    const [equipmentCards, setEquipmentCards] = useState([]);
    const [galleryPhotos, setGalleryPhotos] = useState([]);
    const [availablePhotos, setAvailablePhotos] = useState(DEFAULT_SALON_PHOTOS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [photoSelectorTarget, setPhotoSelectorTarget] = useState(null); // { type: 'card' | 'gallery', index: number }

    // Yeni Fotoğraf Yükleme Form State'i
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploadLabel, setUploadLabel] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
    const [urlInput, setUrlInput] = useState('');
    const [urlLabelInput, setUrlLabelInput] = useState('');

    // Büyük Önizleme Modal State'i
    const [lightboxUrl, setLightboxUrl] = useState(null);

    const fileInputRef = useRef(null);
    const modalFileInputRef = useRef(null);

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Admin/facilities');
            if (res.data) {
                setEquipmentCards(res.data.equipmentCards || []);
                setGalleryPhotos(res.data.galleryPhotos || []);
                if (res.data.availablePhotos && res.data.availablePhotos.length > 0) {
                    setAvailablePhotos(res.data.availablePhotos);
                } else {
                    setAvailablePhotos(DEFAULT_SALON_PHOTOS);
                }
            }
        } catch (err) {
            console.error('Tesis yapılandırması yüklenemedi:', err);
            setMessage({ type: 'error', text: 'Tesis verileri yüklenirken bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (overridePhotos = null) => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = {
                equipmentCards,
                galleryPhotos,
                availablePhotos: overridePhotos || availablePhotos
            };
            const res = await api.post('/Admin/facilities', payload);
            if (res.data) {
                setEquipmentCards(res.data.equipmentCards || []);
                setGalleryPhotos(res.data.galleryPhotos || []);
                if (res.data.availablePhotos && res.data.availablePhotos.length > 0) {
                    setAvailablePhotos(res.data.availablePhotos);
                }
            }
            setMessage({ type: 'success', text: 'Değişiklikler başarıyla kaydedildi ve ana sayfada yayına alındı!' });
            setTimeout(() => setMessage(null), 4000);
        } catch (err) {
            console.error('Kaydetme hatası:', err);
            const errorMsg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(' ')
                : (err.response?.data?.message || err.message || 'Kaydedilirken bir hata oluştu.');
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Tüm ekipman kartlarını ve galeri fotoğraflarını fabrika varsayılan ayarlarına döndürmek istediğinizden emin misiniz?')) {
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/Admin/facilities/reset');
            if (res.data) {
                setEquipmentCards(res.data.equipmentCards || []);
                setGalleryPhotos(res.data.galleryPhotos || []);
                setAvailablePhotos(res.data.availablePhotos || DEFAULT_SALON_PHOTOS);
            }
            setMessage({ type: 'success', text: 'Tesis ayarları varsayılanlara sıfırlandı!' });
            setTimeout(() => setMessage(null), 4000);
        } catch (err) {
            console.error('Sıfırlama hatası:', err);
            setMessage({ type: 'error', text: 'Sıfırlanırken hata oluştu.' });
        } finally {
            setSaving(false);
        }
    };

    // --- FOTOĞRAF YÜKLEME VE YÖNETİM İŞLEMLERİ ---
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            alert('Fotoğraf boyutu 15MB\'tan küçük olmalıdır.');
            return;
        }

        setUploadFile(file);
        setUploadPreview(URL.createObjectURL(file));
        if (!uploadLabel) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            setUploadLabel(`Salon - ${cleanName}`);
        }
    };

    const executeUploadAndAdd = async (fileObj, labelText, autoSelect = false) => {
        if (!fileObj) {
            alert('Lütfen bir fotoğraf seçin.');
            return;
        }

        setUploading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('file', fileObj);

            const uploadRes = await api.post('/Admin/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (uploadRes.data && uploadRes.data.url) {
                const newUrl = uploadRes.data.url;
                const nextId = availablePhotos.length > 0
                    ? Math.max(...availablePhotos.map(p => Number(p.id) || 0)) + 1
                    : 1;
                const newPhotoItem = {
                    id: nextId,
                    url: newUrl,
                    label: labelText || `Salon Görseli (${new Date().toLocaleDateString('tr-TR')})`,
                    isDefault: false,
                    createdDate: new Date().toISOString()
                };

                const updatedPhotos = [newPhotoItem, ...availablePhotos];
                setAvailablePhotos(updatedPhotos);

                // Sunucuya anında kaydet
                await handleSave(updatedPhotos);

                // Formu temizle
                setUploadFile(null);
                setUploadPreview(null);
                setUploadLabel('');
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Eğer modal içinden seçildiyse doğrudan hedef kart/galeriye ata
                if (autoSelect && photoSelectorTarget) {
                    selectSalonPhoto(newUrl);
                }

                setMessage({ type: 'success', text: 'Yeni fotoğraf başarıyla yüklendi ve kütüphaneye eklendi!' });
                setTimeout(() => setMessage(null), 4000);
            }
        } catch (err) {
            console.error('Yükleme hatası:', err);
            const errText = err.response?.data?.message || 'Fotoğraf yüklenirken bir sunucu hatası oluştu.';
            setMessage({ type: 'error', text: errText });
        } finally {
            setUploading(false);
        }
    };

    const handleAddPhotoByUrl = async () => {
        if (!urlInput.trim()) {
            alert('Lütfen geçerli bir görsel bağlantı URL\'i girin.');
            return;
        }

        const nextId = availablePhotos.length > 0
            ? Math.max(...availablePhotos.map(p => Number(p.id) || 0)) + 1
            : 1;
        const newPhotoItem = {
            id: nextId,
            url: urlInput.trim(),
            label: urlLabelInput.trim() || 'Dış Bağlantılı Salon Fotoğrafı',
            isDefault: false,
            createdDate: new Date().toISOString()
        };

        const updatedPhotos = [newPhotoItem, ...availablePhotos];
        setAvailablePhotos(updatedPhotos);
        await handleSave(updatedPhotos);

        setUrlInput('');
        setUrlLabelInput('');
        setMessage({ type: 'success', text: 'Fotoğraf bağlantısı kütüphaneye eklendi!' });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleDeletePhoto = async (photo) => {
        // Bu fotoğrafın herhangi bir kartta veya galeride kullanılıp kullanılmadığını kontrol et
        const usedInCards = equipmentCards.filter(c => c.img === photo.url).length;
        const usedInGallery = galleryPhotos.filter(p => p.img === photo.url).length;

        let warning = `"${photo.label}" adlı fotoğrafı silmek istediğinize emin misiniz?`;
        if (usedInCards > 0 || usedInGallery > 0) {
            warning = `DİKKAT: Bu fotoğraf şu anda ${usedInCards} adet ekipman kartında ve ${usedInGallery} adet galeri görselinde KULLANILMAKTADIR!\n\nSilerseniz o kartlarda fotoğraf boş kalacaktır.\n\nFiziksel olarak sunucu diskinden de kalıcı olarak silinsin mi?`;
        } else {
            warning = `"${photo.label}" adlı fotoğraf hem kütüphaneden hem de sunucu diskinden kalıcı olarak silinecektir. Onaylıyor musunuz?`;
        }

        if (!window.confirm(warning)) return;

        try {
            // Sunucudaki fiziksel dosyayı diskten temizle (disk şişmesini önler)
            if (photo.url && !photo.isDefault && !photo.url.includes('/SalonunFotolari/')) {
                await api.post('/Admin/delete-photo', { url: photo.url }).catch(err => {
                    console.warn("Fiziksel dosya silinirken uyarı:", err);
                });
            }

            const updated = availablePhotos.filter(p => p.id !== photo.id && p.url !== photo.url);
            setAvailablePhotos(updated);
            await handleSave(updated);

            setMessage({ type: 'success', text: 'Fotoğraf hem kütüphaneden hem de sunucu diskinden kalıcı olarak silindi.' });
            setTimeout(() => setMessage(null), 3500);
        } catch (err) {
            console.error('Silme hatası:', err);
            setMessage({ type: 'error', text: 'Fotoğraf silinirken bir hata oluştu.' });
        }
    };

    const handleUpdatePhotoLabel = async (photoId, newLabel) => {
        const updated = availablePhotos.map(p => p.id === photoId ? { ...p, label: newLabel } : p);
        setAvailablePhotos(updated);
    };

    // --- EKİPMAN KARTI İŞLEMLERİ ---
    const updateCard = (index, field, value) => {
        const updated = [...equipmentCards];
        updated[index] = { ...updated[index], [field]: value };
        setEquipmentCards(updated);
    };

    const toggleCardVisibility = (index) => {
        const updated = [...equipmentCards];
        updated[index].isVisible = !updated[index].isVisible;
        setEquipmentCards(updated);
    };

    const removeCard = (index) => {
        if (!window.confirm('Bu ekipman kartını silmek istediğinizden emin misiniz?')) return;
        setEquipmentCards(equipmentCards.filter((_, i) => i !== index));
    };

    const addNewCard = () => {
        const newId = equipmentCards.length > 0 ? Math.max(...equipmentCards.map(c => c.id || 0)) + 1 : 1;
        const defaultImg = availablePhotos.length > 0 ? availablePhotos[0].url : '/SalonunFotolari/Salon1.jpeg';
        const newCard = {
            id: newId,
            cat: 'machines',
            title: 'Yeni Ekipman / Alan Başlığı',
            desc: 'Ekipmanın biyomekanik özellikleri, marka kalitesi ve kullanım amacı açıklaması.',
            tag: 'Özel İstasyon',
            img: defaultImg,
            isVisible: true,
            displayOrder: equipmentCards.length + 1
        };
        setEquipmentCards([...equipmentCards, newCard]);
    };

    // --- GALERİ FOTOĞRAFI İŞLEMLERİ ---
    const updatePhoto = (index, field, value) => {
        const updated = [...galleryPhotos];
        updated[index] = { ...updated[index], [field]: value };
        setGalleryPhotos(updated);
    };

    const togglePhotoVisibility = (index) => {
        const updated = [...galleryPhotos];
        updated[index].isVisible = !updated[index].isVisible;
        setGalleryPhotos(updated);
    };

    const removePhoto = (index) => {
        if (!window.confirm('Bu fotoğrafı galeriden silmek istediğinizden emin misiniz?')) return;
        setGalleryPhotos(galleryPhotos.filter((_, i) => i !== index));
    };

    const addNewPhoto = () => {
        const newId = galleryPhotos.length > 0 ? Math.max(...galleryPhotos.map(p => p.id || 0)) + 1 : 1;
        const defaultImg = availablePhotos.length > 0 ? availablePhotos[0].url : '/SalonunFotolari/Salon1.jpeg';
        const newPhoto = {
            id: newId,
            img: defaultImg,
            title: 'Salon Görüntüsü',
            subtitle: 'N1FIT profesyonel antrenman alanı',
            isVisible: true,
            displayOrder: galleryPhotos.length + 1
        };
        setGalleryPhotos([...galleryPhotos, newPhoto]);
    };

    // Fotoğraf Seçici Modal Yardımcısı
    const selectSalonPhoto = (photoUrl) => {
        if (!photoSelectorTarget) return;
        if (photoSelectorTarget.type === 'card') {
            updateCard(photoSelectorTarget.index, 'img', photoUrl);
        } else if (photoSelectorTarget.type === 'gallery') {
            updatePhoto(photoSelectorTarget.index, 'img', photoUrl);
        }
        setPhotoSelectorTarget(null);
    };

    return (
        <div style={styles.container}>
            {/* Üst Bar */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <button onClick={() => navigate('/admin')} style={styles.backBtn}>
                        <ArrowLeft size={18} /> Admin Paneline Dön
                    </button>
                    <div>
                        <h1 style={styles.title}>SALON & EKİPMAN / FOTOĞRAF YÖNETİCİSİ</h1>
                        <p style={styles.subtitle}>
                            Web sitesinde yer alan Ekipman Kartlarını, Salon Galerisini ve Fotoğraf Kütüphanesini buradan yönetin, yeni fotoğraflar yükleyin veya silin.
                        </p>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        style={styles.resetBtn}
                        title="Tümünü ilk fabrika ayarlarına sıfırla"
                    >
                        <RotateCcw size={16} /> Varsayılana Sıfırla
                    </button>
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        style={styles.saveBtn}
                    >
                        <Save size={18} /> {saving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
                    </button>
                </div>
            </div>

            {/* Bildirim Mesajı */}
            {message && (
                <div style={{
                    ...styles.alertBox,
                    backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    borderColor: message.type === 'success' ? '#22c55e' : '#ef4444',
                    color: message.type === 'success' ? '#4ade80' : '#f87171'
                }}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Sekme Seçiciler */}
            <div style={styles.tabBar}>
                <button
                    onClick={() => setActiveTab('cards')}
                    style={{ ...styles.tabBtn, ...(activeTab === 'cards' ? styles.tabBtnActive : {}) }}
                >
                    <Dumbbell size={18} /> Ekipman & Alan Kartları ({equipmentCards.length})
                </button>
                <button
                    onClick={() => setActiveTab('gallery')}
                    style={{ ...styles.tabBtn, ...(activeTab === 'gallery' ? styles.tabBtnActive : {}) }}
                >
                    <Image size={18} /> Salon Fotoğraf Galerisi & Slider ({galleryPhotos.length})
                </button>
                <button
                    onClick={() => setActiveTab('photos')}
                    style={{ ...styles.tabBtn, ...(activeTab === 'photos' ? styles.tabBtnActive : {}) }}
                >
                    <Upload size={18} /> 📸 Fotoğraf Kütüphanesi & Yükle ({availablePhotos.length})
                </button>
            </div>

            {loading ? (
                <div style={styles.loadingBox}>
                    <div className="spinner"></div>
                    <p style={{ color: '#aaa', marginTop: '12px' }}>Tesis verileri yükleniyor...</p>
                </div>
            ) : (
                <div>
                    {/* TAB 1: EKİPMAN VE ALAN KARTLARI */}
                    {activeTab === 'cards' && (
                        <div>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h3 style={styles.sectionTitle}>Ana Sayfa Ekipman Kartları</h3>
                                    <p style={styles.sectionDesc}>
                                        Her kartın başlığını, açıklamasını, kategorisini ve fotoğrafını belirleyebilirsiniz.
                                    </p>
                                </div>
                                <button onClick={addNewCard} style={styles.addBtn}>
                                    <Plus size={16} /> Yeni Ekipman Kartı Ekle
                                </button>
                            </div>

                            <div style={styles.cardsGrid}>
                                {equipmentCards.map((card, idx) => (
                                    <div
                                        key={card.id || idx}
                                        style={{
                                            ...styles.cardItem,
                                            opacity: card.isVisible === false ? 0.6 : 1,
                                            borderColor: card.isVisible === false ? '#333' : '#222'
                                        }}
                                    >
                                        {/* Kart Görseli ve Seçim Butonu */}
                                        <div style={styles.cardImageContainer}>
                                            <img
                                                src={card.img || '/SalonunFotolari/Salon1.jpeg'}
                                                alt={card.title}
                                                style={styles.cardPreviewImg}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPhotoSelectorTarget({ type: 'card', index: idx })}
                                                style={styles.changePhotoBtn}
                                            >
                                                <Image size={14} /> Fotoğrafı Değiştir ({card.img?.split('/').pop() || 'Seç'})
                                            </button>
                                            <span style={styles.categoryBadge}>
                                                {card.tag || 'Ekipman'}
                                            </span>
                                        </div>

                                        {/* Kart Form Alanları */}
                                        <div style={styles.cardForm}>
                                            <div style={styles.inputGroup}>
                                                <label style={styles.inputLabel}>Kart Başlığı:</label>
                                                <input
                                                    type="text"
                                                    value={card.title}
                                                    onChange={(e) => updateCard(idx, 'title', e.target.value)}
                                                    style={styles.input}
                                                />
                                            </div>

                                            <div style={styles.rowTwo}>
                                                <div style={styles.inputGroup}>
                                                    <label style={styles.inputLabel}>Kategori Sekmesi:</label>
                                                    <select
                                                        value={card.cat || 'machines'}
                                                        onChange={(e) => updateCard(idx, 'cat', e.target.value)}
                                                        style={styles.select}
                                                    >
                                                        {CATEGORIES.map(c => (
                                                            <option key={c.key} value={c.key}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div style={styles.inputGroup}>
                                                    <label style={styles.inputLabel}>Etiket Rozeti (Tag):</label>
                                                    <input
                                                        type="text"
                                                        value={card.tag || ''}
                                                        onChange={(e) => updateCard(idx, 'tag', e.target.value)}
                                                        placeholder="Örn: Serbest Ağırlık"
                                                        style={styles.input}
                                                    />
                                                </div>
                                            </div>

                                            <div style={styles.inputGroup}>
                                                <label style={styles.inputLabel}>Açıklama Metni:</label>
                                                <textarea
                                                    rows={3}
                                                    value={card.desc}
                                                    onChange={(e) => updateCard(idx, 'desc', e.target.value)}
                                                    style={styles.textarea}
                                                />
                                            </div>

                                            {/* Kart Alt Kontroller */}
                                            <div style={styles.cardActions}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCardVisibility(idx)}
                                                    style={{
                                                        ...styles.toggleVisBtn,
                                                        backgroundColor: card.isVisible !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                                                        color: card.isVisible !== false ? '#4ade80' : '#aaa'
                                                    }}
                                                >
                                                    {card.isVisible !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                                                    {card.isVisible !== false ? 'Yayında' : 'Gizli'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => removeCard(idx)}
                                                    style={styles.deleteBtn}
                                                >
                                                    <Trash2 size={15} /> Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SALON FOTOĞRAF GALERİSİ */}
                    {activeTab === 'gallery' && (
                        <div>
                            <div style={styles.sectionHeader}>
                                <div>
                                    <h3 style={styles.sectionTitle}>Salon Fotoğraf Galerisi & Kaydırıcı (Slider)</h3>
                                    <p style={styles.sectionDesc}>
                                        Ana sayfadaki "SALONUMUZDAN GÖRÜNTÜLER" kaydırıcısında yer alan fotoğrafları seçin ve düzenleyin.
                                    </p>
                                </div>
                                <button onClick={addNewPhoto} style={styles.addBtn}>
                                    <Plus size={16} /> Galeriye Fotoğraf Ekle
                                </button>
                            </div>

                            <div style={styles.galleryGrid}>
                                {galleryPhotos.map((photo, idx) => (
                                    <div
                                        key={photo.id || idx}
                                        style={{
                                            ...styles.galleryItem,
                                            opacity: photo.isVisible === false ? 0.6 : 1
                                        }}
                                    >
                                        <div style={styles.galleryImageContainer}>
                                            <img
                                                src={photo.img || '/SalonunFotolari/Salon1.jpeg'}
                                                alt={photo.title}
                                                style={styles.galleryPreviewImg}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPhotoSelectorTarget({ type: 'gallery', index: idx })}
                                                style={styles.changePhotoBtn}
                                            >
                                                <Image size={14} /> Fotoğraf Değiştir ({photo.img?.split('/').pop()})
                                            </button>
                                        </div>

                                        <div style={styles.galleryDetails}>
                                            <div style={styles.inputGroup}>
                                                <label style={styles.inputLabel}>Görsel Başlığı / Açıklaması:</label>
                                                <input
                                                    type="text"
                                                    value={photo.title || ''}
                                                    onChange={(e) => updatePhoto(idx, 'title', e.target.value)}
                                                    placeholder="Örn: Serbest Ağırlık Alanı"
                                                    style={styles.input}
                                                />
                                            </div>

                                            <div style={styles.inputGroup}>
                                                <label style={styles.inputLabel}>Alt Başlık / Not:</label>
                                                <input
                                                    type="text"
                                                    value={photo.subtitle || ''}
                                                    onChange={(e) => updatePhoto(idx, 'subtitle', e.target.value)}
                                                    placeholder="Örn: 1.5 - 40 kg dumbıllar"
                                                    style={styles.input}
                                                />
                                            </div>

                                            <div style={styles.cardActions}>
                                                <button
                                                    type="button"
                                                    onClick={() => togglePhotoVisibility(idx)}
                                                    style={{
                                                        ...styles.toggleVisBtn,
                                                        backgroundColor: photo.isVisible !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                                                        color: photo.isVisible !== false ? '#4ade80' : '#aaa'
                                                    }}
                                                >
                                                    {photo.isVisible !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                                                    {photo.isVisible !== false ? 'Yayında' : 'Gizli'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(idx)}
                                                    style={styles.deleteBtn}
                                                >
                                                    <Trash2 size={15} /> Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SALON FOTOĞRAF KÜTÜPHANESİ & YÜKLEME ALANI */}
                    {activeTab === 'photos' && (
                        <div>
                            {/* YENİ FOTOĞRAF YÜKLEME KARTI */}
                            <div style={styles.uploadCard}>
                                <div style={styles.uploadCardHeader}>
                                    <div>
                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Upload size={20} color="#d90429" /> Yeni Salon Fotoğrafı Ekle
                                        </h3>
                                        <p style={{ margin: 0, color: '#888', fontSize: '0.88rem' }}>
                                            Telefonunuzdan veya bilgisayarınızdan salonun yeni fotoğraflarını yükleyin. Yüklenen fotoğraflar anında kütüphaneye eklenir ve ekipman kartlarında veya galeride kullanılabilir.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setUploadMode('file')}
                                            style={{
                                                ...styles.subTabBtn,
                                                backgroundColor: uploadMode === 'file' ? '#d90429' : '#1c1c28',
                                                color: uploadMode === 'file' ? '#fff' : '#aaa'
                                            }}
                                        >
                                            Dosya Yükle
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUploadMode('url')}
                                            style={{
                                                ...styles.subTabBtn,
                                                backgroundColor: uploadMode === 'url' ? '#d90429' : '#1c1c28',
                                                color: uploadMode === 'url' ? '#fff' : '#aaa'
                                            }}
                                        >
                                            URL ile Ekle
                                        </button>
                                    </div>
                                </div>

                                {uploadMode === 'file' ? (
                                    <div style={styles.uploadBody}>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            style={styles.dropZone}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="image/jpeg,image/png,image/webp"
                                                style={{ display: 'none' }}
                                            />
                                            {uploadPreview ? (
                                                <div style={styles.previewContainer}>
                                                    <img src={uploadPreview} alt="Önizleme" style={styles.previewThumb} />
                                                    <p style={{ margin: '8px 0 0', color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        ✓ Fotoğraf Seçildi: {uploadFile?.name} ({(uploadFile?.size / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                    <span style={{ color: '#888', fontSize: '0.78rem' }}>Değiştirmek için tıklayın</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload size={36} color="#888" style={{ marginBottom: '10px' }} />
                                                    <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>
                                                        Fotoğraf Seçmek İçin Tıklayın veya Buraya Sürükleyin
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                                                        JPG, PNG, WEBP formatları desteklenir (Maks. 15MB)
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '16px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '240px' }}>
                                                <label style={styles.inputLabel}>Fotoğraf Başlığı / Açıklaması:</label>
                                                <input
                                                    type="text"
                                                    value={uploadLabel}
                                                    onChange={(e) => setUploadLabel(e.target.value)}
                                                    placeholder="Örn: Yeni Dumbell Parkuru / Kadınlar Alanı"
                                                    style={styles.input}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => executeUploadAndAdd(uploadFile, uploadLabel)}
                                                disabled={!uploadFile || uploading}
                                                style={{
                                                    ...styles.primaryActionBtn,
                                                    opacity: !uploadFile || uploading ? 0.5 : 1,
                                                    cursor: !uploadFile || uploading ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                <Upload size={16} /> {uploading ? 'Sunucuya Yükleniyor...' : 'Fotoğrafı Yükle ve Kütüphaneye Ekle'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                                            <div>
                                                <label style={styles.inputLabel}>Fotoğraf Doğrudan Bağlantı URL'i:</label>
                                                <input
                                                    type="text"
                                                    value={urlInput}
                                                    onChange={(e) => setUrlInput(e.target.value)}
                                                    placeholder="https://... veya /SalonunFotolari/yenifoto.jpeg"
                                                    style={styles.input}
                                                />
                                            </div>
                                            <div>
                                                <label style={styles.inputLabel}>Başlık / Etiket:</label>
                                                <input
                                                    type="text"
                                                    value={urlLabelInput}
                                                    onChange={(e) => setUrlLabelInput(e.target.value)}
                                                    placeholder="Örn: Kardiyo Köşesi"
                                                    style={styles.input}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddPhotoByUrl}
                                                style={styles.primaryActionBtn}
                                            >
                                                <Plus size={16} /> Bağlantıyı Ekle
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* KÜTÜPHANEDEKİ TÜM FOTOĞRAFLARIN LİSTESİ */}
                            <div style={{ marginTop: '30px' }}>
                                <div style={styles.sectionHeader}>
                                    <div>
                                        <h3 style={styles.sectionTitle}>
                                            Kütüphanedeki Fotoğraflar ({availablePhotos.length} Adet)
                                        </h3>
                                        <p style={styles.sectionDesc}>
                                            Sistemde kayıtlı olan tüm salon fotoğrafları aşağıdadır. İstemediğiniz fotoğrafları silebilir, başlıklarını güncelleyebilir veya büyütebilirsiniz.
                                        </p>
                                    </div>
                                </div>

                                <div style={styles.photoLibGrid}>
                                    {availablePhotos.map((photo, pIdx) => {
                                        const usedInCards = equipmentCards.filter(c => c.img === photo.url).length;
                                        const usedInGallery = galleryPhotos.filter(p => p.img === photo.url).length;

                                        return (
                                            <div key={photo.id || pIdx} style={styles.photoLibCard}>
                                                <div style={styles.photoLibImgWrapper}>
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.label}
                                                        style={styles.photoLibImg}
                                                    />
                                                    <div style={styles.photoOverlayActions}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setLightboxUrl(photo.url)}
                                                            style={styles.overlayIconBtn}
                                                            title="Büyük Önizleme"
                                                        >
                                                            <ZoomIn size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(photo.url);
                                                                alert('Fotoğraf URL\'i kopyalandı:\n' + photo.url);
                                                            }}
                                                            style={styles.overlayIconBtn}
                                                            title="Bağlantıyı Kopyala"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Kullanım Rozetleri */}
                                                    <div style={styles.usageBadges}>
                                                        {usedInCards > 0 && (
                                                            <span style={styles.badgeSuccess}>
                                                                {usedInCards} Kartta Yayında
                                                            </span>
                                                        )}
                                                        {usedInGallery > 0 && (
                                                            <span style={styles.badgeInfo}>
                                                                {usedInGallery} Galeride Yayında
                                                            </span>
                                                        )}
                                                        {usedInCards === 0 && usedInGallery === 0 && (
                                                            <span style={styles.badgeNeutral}>
                                                                Kullanılmıyor
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={styles.photoLibInfo}>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <input
                                                            type="text"
                                                            value={photo.label || ''}
                                                            onChange={(e) => handleUpdatePhotoLabel(photo.id, e.target.value)}
                                                            placeholder="Fotoğraf Başlığı..."
                                                            style={styles.photoLabelInput}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                                        <span style={{ fontSize: '0.72rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                                                            {photo.url}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePhoto(photo)}
                                                            style={styles.deletePhotoBtn}
                                                            title="Kütüphaneden Sil"
                                                        >
                                                            <Trash2 size={14} /> Sil
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* FOTOĞRAF SEÇİCİ POPUP MODAL (KART VE GALERİDEN ÇAĞRILIR) */}
            {photoSelectorTarget && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    Salon Fotoğrafı Seç
                                </h3>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
                                    Kullanmak istediğiniz fotoğrafa tıklayın veya doğrudan yeni bir fotoğraf yükleyin.
                                </p>
                            </div>
                            <button
                                onClick={() => setPhotoSelectorTarget(null)}
                                style={styles.closeBtn}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal İçi Hızlı Yükleme Butonu */}
                        <div style={styles.modalUploadPrompt}>
                            <input
                                type="file"
                                ref={modalFileInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const autoLabel = `Salon - ${file.name.replace(/\.[^/.]+$/, '')}`;
                                        executeUploadAndAdd(file, autoLabel, true);
                                    }
                                }}
                                accept="image/jpeg,image/png,image/webp"
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => modalFileInputRef.current?.click()}
                                disabled={uploading}
                                style={styles.modalUploadBtn}
                            >
                                <Upload size={16} /> {uploading ? 'Yükleniyor...' : 'Bilgisayardan / Telefondan Yeni Fotoğraf Yükle ve Doğrudan Seç'}
                            </button>
                        </div>

                        <div style={styles.photoPickerGrid}>
                            {availablePhotos.map((p, i) => (
                                <div
                                    key={p.id || i}
                                    onClick={() => selectSalonPhoto(p.url)}
                                    style={styles.photoPickerItem}
                                >
                                    <img src={p.url} alt={p.label} style={styles.photoPickerThumb} />
                                    <div style={styles.photoPickerLabel}>{p.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX BÜYÜK ÖNİZLEME MODALI */}
            {lightboxUrl && (
                <div
                    onClick={() => setLightboxUrl(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                        <img
                            src={lightboxUrl}
                            alt="Büyük Önizleme"
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
                        />
                        <button
                            onClick={() => setLightboxUrl(null)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '0',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <X size={24} /> Kapat
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
        backgroundColor: '#0a0a0c',
        color: '#f0f0f0',
        padding: '30px 24px',
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '25px',
        paddingBottom: '20px',
        borderBottom: '1px solid #1a1a24'
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
        backgroundColor: '#16161f',
        color: '#aaa',
        border: '1px solid #2a2a38',
        padding: '10px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        transition: 'all 0.2s'
    },
    title: {
        fontSize: '1.6rem',
        fontWeight: '900',
        color: '#fff',
        letterSpacing: '0.5px',
        margin: '0 0 4px 0'
    },
    subtitle: {
        color: '#888',
        fontSize: '0.9rem',
        margin: 0
    },
    headerRight: {
        display: 'flex',
        gap: '12px'
    },
    saveBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#d90429',
        color: '#fff',
        border: 'none',
        padding: '12px 22px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        boxShadow: '0 4px 14px rgba(217, 4, 41, 0.4)',
        transition: 'all 0.2s'
    },
    resetBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#1c1c28',
        color: '#bbb',
        border: '1px solid #333',
        padding: '12px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    },
    alertBox: {
        padding: '14px 20px',
        borderRadius: '8px',
        borderWidth: '1px',
        borderStyle: 'solid',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        fontSize: '0.95rem',
        fontWeight: 'bold'
    },
    tabBar: {
        display: 'flex',
        gap: '12px',
        marginBottom: '25px',
        borderBottom: '1px solid #1a1a24',
        paddingBottom: '12px',
        flexWrap: 'wrap'
    },
    tabBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#121218',
        color: '#888',
        border: '1px solid #222',
        padding: '12px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: 'bold',
        transition: 'all 0.2s'
    },
    tabBtnActive: {
        backgroundColor: '#d90429',
        color: '#fff',
        borderColor: '#d90429'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
    },
    sectionTitle: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#fff',
        margin: '0 0 4px 0'
    },
    sectionDesc: {
        color: '#777',
        fontSize: '0.88rem',
        margin: 0
    },
    addBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#1c1c28',
        color: '#fff',
        border: '1px solid #3b3b4f',
        padding: '10px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.88rem'
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '24px'
    },
    cardItem: {
        backgroundColor: '#121218',
        borderRadius: '12px',
        overflow: 'hidden',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.2s'
    },
    cardImageContainer: {
        position: 'relative',
        width: '100%',
        height: '200px',
        backgroundColor: '#050508'
    },
    cardPreviewImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    changePhotoBtn: {
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        color: '#fff',
        border: '1px solid #444',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '0.78rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    categoryBadge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#d90429',
        color: '#fff',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        padding: '4px 10px',
        borderRadius: '20px'
    },
    cardForm: {
        padding: '18px'
    },
    inputGroup: {
        marginBottom: '14px'
    },
    inputLabel: {
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        color: '#999',
        marginBottom: '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px'
    },
    input: {
        width: '100%',
        backgroundColor: '#1a1a24',
        border: '1px solid #2d2d3d',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: '6px',
        fontSize: '0.9rem',
        boxSizing: 'border-box'
    },
    select: {
        width: '100%',
        backgroundColor: '#1a1a24',
        border: '1px solid #2d2d3d',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: '6px',
        fontSize: '0.9rem',
        boxSizing: 'border-box'
    },
    textarea: {
        width: '100%',
        backgroundColor: '#1a1a24',
        border: '1px solid #2d2d3d',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: '6px',
        fontSize: '0.9rem',
        boxSizing: 'border-box',
        resize: 'vertical',
        lineHeight: '1.4'
    },
    rowTwo: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
    },
    cardActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid #1f1f2e'
    },
    toggleVisBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        border: 'none',
        padding: '7px 14px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: 'bold'
    },
    deleteBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '7px 14px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: 'bold'
    },
    galleryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
    },
    galleryItem: {
        backgroundColor: '#121218',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #1f1f2e',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    },
    galleryImageContainer: {
        position: 'relative',
        width: '100%',
        height: '180px',
        backgroundColor: '#050508'
    },
    galleryPreviewImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    galleryDetails: {
        padding: '16px'
    },
    loadingBox: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modalContent: {
        backgroundColor: '#14141e',
        borderRadius: '12px',
        border: '1px solid #2a2a38',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        borderBottom: '1px solid #222',
        paddingBottom: '12px'
    },
    closeBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#aaa',
        cursor: 'pointer',
        padding: '4px'
    },
    modalUploadPrompt: {
        backgroundColor: '#1a1a26',
        padding: '14px',
        borderRadius: '8px',
        border: '1px dashed #3a3a4f',
        marginBottom: '16px',
        textAlign: 'center'
    },
    modalUploadBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#d90429',
        color: '#fff',
        border: 'none',
        padding: '10px 18px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.88rem'
    },
    photoPickerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '14px',
        marginTop: '15px'
    },
    photoPickerItem: {
        backgroundColor: '#1c1c28',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #2a2a3a',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column'
    },
    photoPickerThumb: {
        width: '100%',
        height: '140px',
        objectFit: 'cover'
    },
    photoPickerLabel: {
        padding: '10px',
        fontSize: '0.8rem',
        color: '#ddd',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    // Fotoğraf Kütüphanesi & Yükleme Stilleri
    uploadCard: {
        backgroundColor: '#121218',
        border: '1px solid #222230',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '30px'
    },
    uploadCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #1a1a24',
        paddingBottom: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
    },
    subTabBtn: {
        border: 'none',
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    uploadBody: {
        display: 'flex',
        flexDirection: 'column'
    },
    dropZone: {
        border: '2px dashed #2d2d40',
        backgroundColor: '#0c0c12',
        borderRadius: '10px',
        padding: '30px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    previewContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    previewThumb: {
        maxWidth: '240px',
        maxHeight: '160px',
        borderRadius: '8px',
        objectFit: 'cover',
        border: '2px solid #d90429'
    },
    primaryActionBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#d90429',
        color: '#fff',
        border: 'none',
        padding: '11px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        boxShadow: '0 4px 12px rgba(217, 4, 41, 0.35)',
        whiteSpace: 'nowrap'
    },
    photoLibGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
        gap: '20px'
    },
    photoLibCard: {
        backgroundColor: '#121218',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #1f1f2e',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column'
    },
    photoLibImgWrapper: {
        position: 'relative',
        width: '100%',
        height: '180px',
        backgroundColor: '#000'
    },
    photoLibImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    photoOverlayActions: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        gap: '6px'
    },
    overlayIconBtn: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        color: '#fff',
        border: '1px solid #444',
        borderRadius: '6px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    },
    usageBadges: {
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    badgeSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        color: '#fff',
        fontSize: '0.72rem',
        fontWeight: 'bold',
        padding: '3px 8px',
        borderRadius: '4px'
    },
    badgeInfo: {
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        color: '#fff',
        fontSize: '0.72rem',
        fontWeight: 'bold',
        padding: '3px 8px',
        borderRadius: '4px'
    },
    badgeNeutral: {
        backgroundColor: 'rgba(100, 116, 139, 0.75)',
        color: '#ddd',
        fontSize: '0.7rem',
        padding: '2px 6px',
        borderRadius: '4px'
    },
    photoLibInfo: {
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between'
    },
    photoLabelInput: {
        width: '100%',
        backgroundColor: '#181822',
        border: '1px solid #2d2d3d',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        boxSizing: 'border-box'
    },
    deletePhotoBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
};

export default FacilityManager;
