import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Dumbbell, Video, ArrowLeft } from 'lucide-react';

// O amına koduğumun karmaşık YouTube URL'sinden sadece Video ID'sini söküp çıkaran cerrah fonksiyon
const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const MUSCLE_GROUPS = ['Göğüs', 'Sırt', 'Omuz', 'Ön Kol (Biceps)', 'Arka Kol (Triceps)', 'Bacak', 'Karın (Abs)', 'Kardiyo'];

const ExerciseLibrary = () => {
    const [exercises, setExercises] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const navigate = useNavigate(); // BUNU EKLİYORSUN DAYI
    const [selectedMuscle, setSelectedMuscle] = useState('');
    // Elimizdeki hareketlerin vücut bölgelerini tekilleştiren motor
    const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup))].filter(Boolean);
    const [form, setForm] = useState({ name: '', muscleGroup: 'Göğüs', description: '', videoUrl: '' });

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        try {
            const res = await api.get('/Admin/exercises');
            setExercises(res.data);
        } catch (err) {
            console.error("Hareketleri çekerken tesisat patladı", err);
        }
    };

    const openModal = (exercise = null) => {
        if (exercise) {
            setEditingExercise(exercise);
            setForm({
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
                description: exercise.description || '',
                videoUrl: exercise.videoUrl || ''
            });
        } else {
            setEditingExercise(null);
            setForm({ name: '', muscleGroup: 'Göğüs', description: '', videoUrl: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // C#'a gidecek paketi milimetrik hazırlıyoruz
            const payload = {
                name: form.name,
                muscleGroup: form.muscleGroup,
                // Eğer C# buralarda [Url] veya zorunlu alan falan bekliyorsa boş string ("") patlatır. 
                // O yüzden boşsa null yolluyoruz, makine rahatlıyor.
                description: form.description ? form.description : null,
                videoUrl: form.videoUrl ? form.videoUrl : null
            };

            // Güvenlik kilidi: Adam isimsiz hareket eklemesin
            if (!payload.name || !payload.muscleGroup) {
                alert("İsim ve bölgeyi boş bırakma!");
                return;
            }

            // Düzenleme mi, yeni kayıt mı?
            if (editingExercise) {
                await api.put(`/Admin/exercises/${editingExercise.id}`, payload);
            } else {
                await api.post('/Admin/exercises', payload);
            }
            
            // İşlem başarılıysa kepenkleri indir, listeyi tazele
            setShowModal(false);
            setForm({ name: '', muscleGroup: 'Göğüs', description: '', videoUrl: '' });
            setEditingExercise(null);
            fetchExercises(); 
            
        } catch (err) {
            console.error("Kaydederken patladık:", err);
            // 400 hatasının tam olarak HANGİ HÜCREDEN kaynaklandığını kabak gibi gösterir:
            console.log("C#'ın isyanı (Hata Detayı):", err.response?.data); 
            alert("Kaydetme işlemi yattı dayı, konsola bak!");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu hareketi kütüphaneden çıkarıyoruz, emin misin?")) {
            try {
                await api.delete(`/Admin/exercises/${id}`);
                fetchExercises();
            } catch (err) {
                console.error("Silerken hata", err);
                alert("Hareket silinemedi, bir yerlerde kullanılıyor olabilir!");
            }
        }
    };

    

    return (
        <div style={styles.container}>
            <div style={styles.main}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* İŞTE O HAYAT KURTARAN GERİ BUTONU */}
                        <button onClick={() => navigate(-1)} style={styles.backBtn}>
                            <ArrowLeft size={18} /> Panele Dön
                        </button>

                        <div>
                            <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Dumbbell color="#d90429" /> Kapsamlı Hareket Kütüphanesi
                            </h2>
                            <p style={{ color: '#888', marginTop: '5px' }}>Dükkandaki tüm hareketleri ve eğitim videolarını buradan yönet.</p>
                        </div>
                    </div>
                    <button onClick={() => openModal()} style={styles.addBtn}>
                        <Plus size={18} /> Yeni Hareket Ekle
                    </button>
                </div>

                {/* HAREKETLER GRID YAPISI */}
                <div style={styles.grid}>
                    {exercises.length === 0 ? (
                        <p style={{ color: '#666', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Kütüphane bomboş, yukarıdan hareket ekle.</p>
                    ) : (
                        exercises.map(ex => {
                            const embedUrl = getYouTubeEmbedUrl(ex.videoUrl);
                            return (
                                <div key={ex.id} style={styles.card}>
                                    {/* VİDEO ALANI */}
                                    <div style={styles.videoWrapper}>
                                        {embedUrl ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={embedUrl}
                                                title={ex.name}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                style={{ borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
                                            ></iframe>
                                        ) : (
                                            <div style={styles.noVideo}>
                                                <Video size={40} color="#444" />
                                                <span>Video Yok</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* BİLGİ ALANI */}
                                    <div style={styles.cardInfo}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 5px 0', color: '#fff' }}>{ex.name}</h3>
                                                <span style={styles.badge}>{ex.muscleGroup}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => openModal(ex)} style={styles.iconBtn}><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(ex.id)} style={styles.iconBtnRed}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '15px', lineHeight: '1.4' }}>
                                            {ex.description || "Açıklama girilmemiş."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* EKLE / DÜZENLE MODALI */}
            {showModal && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContent}>
                        <h3 style={{ color: '#fff', marginTop: 0 }}>
                            {editingExercise ? 'Harekete Rötuş Çek' : 'Yeni Hareket Tanımla'}
                        </h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={styles.label}>Hareketin Adı</label>
                                <input style={styles.input} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Örn: Incline Bench Press" />
                            </div>

                            <div>
                                <label style={styles.label}>Vuracağı Bölge (Kas Grubu)</label>
                                <select style={styles.select} value={form.muscleGroup} onChange={e => setForm({ ...form, muscleGroup: e.target.value })}>
                                    {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={styles.label}>YouTube Video Linki (İsteğe Bağlı)</label>
                                <input style={styles.input} value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                            </div>

                            <div>
                                <label style={styles.label}>Taktik / Açıklama (İsteğe Bağlı)</label>
                                <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Hareketi yaparken beli bükme amq..." />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingExercise ? 'Güncelle' : 'SQL\'e Zımbala'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '30px 20px', fontFamily: 'sans-serif' },
    main: { maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    addBtn: { backgroundColor: '#d90429', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#111', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column' },
    videoWrapper: { width: '100%', height: '180px', backgroundColor: '#000', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' },
    noVideo: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#444', gap: '10px' },
    cardInfo: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' },
    badge: { display: 'inline-block', backgroundColor: '#222', color: '#d90429', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #333' },
    iconBtn: { backgroundColor: 'transparent', color: '#888', border: '1px solid #444', padding: '6px', borderRadius: '4px', cursor: 'pointer' },
    iconBtnRed: { backgroundColor: 'transparent', color: '#d90429', border: '1px solid #444', padding: '6px', borderRadius: '4px', cursor: 'pointer' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#111', padding: '30px', borderRadius: '10px', border: '2px solid #d90429', width: '450px' },
    label: { color: '#888', fontSize: '0.8rem', marginBottom: '5px', display: 'block' },
    input: { width: '100%', padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '5px', boxSizing: 'border-box', outline: 'none' },
    select: { width: '100%', padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '5px', outline: 'none' },
    backBtn: {
        backgroundColor: 'transparent',
        color: '#888',
        border: '1px solid #333',
        padding: '8px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        width: 'fit-content', // Kutu sadece içindeki yazı kadar uzasın amq
        transition: '0.2s'
    },
};

export default ExerciseLibrary;