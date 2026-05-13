import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Utensils, Plus, ChevronDown, ChevronRight, Trash2, Pencil, Clock } from 'lucide-react';
import api from '../api/axiosConfig';

const MUSCLE_GROUPS = ['Göğüs', 'Sırt', 'Omuz', 'Ön Kol (Biceps)', 'Arka Kol (Triceps)', 'Bacak', 'Karın (Abs)', 'Kardiyo'];

const ProgramManager = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('workout');
    const [member, setMember] = useState(null);

    // ==========================================
    // ANTRENMAN STATE'LERİ
    // ==========================================
    // YENİ: Gerçek hareketleri SQL'den çekip buraya basacağız
    const [dbExercises, setDbExercises] = useState([]);
    
    const [days, setDays] = useState([
        { id: 1, title: '1. Gün: Hipertrofi + Güç', exercises: [] }
    ]);
    const [activeDayId, setActiveDayId] = useState(1); 
    const [expandedMuscle, setExpandedMuscle] = useState(null);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [selectedDayId, setSelectedDayId] = useState(1);
    const [editingExercise, setEditingExercise] = useState(null); 
    const [exForm, setExForm] = useState({ sets: '', reps: '', restTime: '', duration: '', speed: '', incline: '' });

    // ==========================================
    // BESLENME STATE'LERİ
    // ==========================================
    const [meals, setMeals] = useState([]);
    const [showDietModal, setShowDietModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [dietForm, setDietForm] = useState({ mealName: '', time: '', content: '' });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Adamın ismini çek
                api.get(`/Admin/members/${id}`).then(res => setMember(res.data)).catch(err => console.log(err));
                
                // 2. ÖNCE HAREKET KÜTÜPHANESİNİ ÇEKİYORUZ (Çünkü programı buna göre dizeceğiz)
                const exRes = await api.get('/Admin/exercises');
                const fetchedExercises = exRes.data || [];
                setDbExercises(fetchedExercises);

                // 3. ADAMIN KAYITLI ANTRENMAN VE BESLENME PROGRAMINI ÇEK
                fetchExistingDiet();
                fetchExistingProgram(fetchedExercises); // Hareketi bulabilsin diye içeri yolluyoruz
            } catch (error) {
                console.error("Ana verileri çekerken tesisat patladı amq", error);
            }
        };

        loadInitialData();
    }, [id]);

    const fetchExistingDiet = async () => {
        try {
            const res = await api.get(`/Admin/members/${id}/diet`);
            if (res.data && res.data.length > 0) {
                setMeals(res.data);
            }
        } catch (err) {
            console.log("Diyet çekilirken patladı amq");
        }
    };

    const fetchExistingProgram = async (allExercises) => {
        try {
            const res = await api.get(`/Admin/members/${id}/workout-program`);            
            const program = res.data;
            if (program && program.days && program.days.length > 0) {
                const formattedDays = program.days.map(day => ({
                    id: day.id,
                    title: day.title,
                    exercises: day.exercises.map(ex => {
                        // DUMMY SAÇMALIĞI YERİNE ARTIK GERÇEK SQL VERİLERİYLE EŞLEŞTİRİYORUZ
                        const baseEx = allExercises.find(d => d.id === ex.exerciseId) || { name: 'Bilinmeyen Hareket (Silinmiş Olabilir)', muscleGroup: 'Bilinmiyor', type: 'weight' };
                        return {
                            ...baseEx,
                            uniqueId: Math.random(), 
                            details: {
                                sets: ex.sets || '',
                                reps: ex.reps || '',
                                restTime: ex.restTime || '',
                                duration: ex.duration || '',
                                speed: ex.speed || '',
                                incline: ex.incline || ''
                            }
                        };
                    })
                }));
                
                setDays(formattedDays);
                setActiveDayId(formattedDays[0]?.id || 1); 
            } else {
                setDays([]);
            }
        } catch (err) {
            console.log("Adamın programını çekerken patladık dayı: ", err);
        }
    };

    const saveFullDietProgram = async () => {
    try {
        const payload = {
            meals: meals.map(m => ({
                mealName: m.mealName,
                time: m.time,
                content: m.content
            }))
        };
            await api.post(`/Admin/members/${id}/diet-program`, payload);
            alert("Beslenme programı beton gibi SQL'e oturdu emmoğlu!");
        } catch (err) {
            console.error(err);
            alert("Mutfakta yangın çıktı amq, kaydolmadı!");
        }
    };

    // ==========================================
    // ANTRENMAN FONKSİYONLARI
    // ==========================================
    const handleAddDay = () => {
        const newDayId = days.length > 0 ? Math.max(...days.map(d => d.id)) + 1 : 1;
        setDays([...days, { id: newDayId, title: `${days.length + 1}. Gün: Yeni Antrenman`, exercises: [] }]);
        setActiveDayId(newDayId); 
    };

    const handleDeleteDay = (dayId) => {
        if (window.confirm("Bu günü içindeki hareketlerle beraber siktir edip atıyoruz, emin misin emmoğlu?")) {
            const newDays = days.filter(d => d.id !== dayId);
            setDays(newDays);
            if (activeDayId === dayId && newDays.length > 0) setActiveDayId(newDays[0].id);
        }
    };

    const openExerciseModal = (exercise) => {
        setEditingExercise(null); 
        setSelectedExercise(exercise);
        setSelectedDayId(activeDayId || (days.length > 0 ? days[0].id : 1)); 
        setExForm({ sets: '', reps: '', restTime: '', duration: '', speed: '', incline: '' });
        setShowWorkoutModal(true);
    };

    const openEditExerciseModal = (dayId, exercise) => {
        setEditingExercise({ dayId, uniqueId: exercise.uniqueId }); 
        setSelectedExercise(exercise);
        setSelectedDayId(dayId);
        setExForm(exercise.details); 
        setShowWorkoutModal(true);
    };

    const handleDeleteExercise = (dayId, uniqueId) => {
        const updatedDays = days.map(day => {
            if (day.id === dayId) return { ...day, exercises: day.exercises.filter(e => e.uniqueId !== uniqueId) };
            return day;
        });
        setDays(updatedDays);
    };

    const saveExerciseToDay = (e) => {
        e.preventDefault();
        
        // Eğer hiç gün yoksa adamı uyar
        if (days.length === 0) {
            alert("Lan amq önce bir 'Yeni Gün Ekle' butonuna basıp gün oluştursana!");
            return;
        }

        let updatedDays;

        if (editingExercise) {
            updatedDays = days.map(day => {
                if (day.id === parseInt(selectedDayId)) {
                    const existsInThisDay = day.exercises.some(e => e.uniqueId === editingExercise.uniqueId);
                    if (existsInThisDay) {
                        return { ...day, exercises: day.exercises.map(ex => ex.uniqueId === editingExercise.uniqueId ? { ...ex, details: exForm } : ex) };
                    } else {
                        return { ...day, exercises: [...day.exercises, { ...selectedExercise, details: exForm, uniqueId: editingExercise.uniqueId }] };
                    }
                } else {
                    return { ...day, exercises: day.exercises.filter(ex => ex.uniqueId !== editingExercise.uniqueId) };
                }
            });
        } else {
            updatedDays = days.map(day => {
                if (day.id === parseInt(selectedDayId)) {
                    return { ...day, exercises: [...day.exercises, { ...selectedExercise, details: exForm, uniqueId: Math.random() }] };
                }
                return day;
            });
        }

        setDays(updatedDays);
        setShowWorkoutModal(false);
        setEditingExercise(null);
        setActiveDayId(parseInt(selectedDayId)); 
    };

    // ==========================================
    // TÜM PROGRAMI SQL'E ZIMBALAMA MOTORU
    // ==========================================
    const saveFullWorkoutProgram = async () => {
        try {
            const payload = {
                days: days.map(day => ({
                    title: day.title,
                    exercises: day.exercises.map(ex => ({
                        exerciseId: ex.id, 
                        sets: parseInt(ex.details.sets) || 0, 
                        reps: ex.details.reps || "",
                        restTime: ex.details.restTime || "",
                        duration: ex.details.duration || "",
                        speed: ex.details.speed || "",
                        incline: ex.details.incline || ""
                    }))
                }))
            };

            await api.post(`/Admin/members/${id}/workout-program`, payload);
            alert("Helal lan! Bütün antrenman programı SQL'e mermi gibi zımbalandı!");
        } catch (err) {
            console.error("C#'TAN GELEN ASIL HATA:", err.response?.data);
            alert("Dayı kayıt patladı! F12 Console'da 'C#'TAN GELEN ASIL HATA' kısmına bak, ne diyorsa bana fırlat.");
        }
    };

    // ==========================================
    // BESLENME FONKSİYONLARI
    // ==========================================
    const openDietModal = (meal = null) => {
        if (meal) {
            setEditingMeal(meal);
            setDietForm({ mealName: meal.mealName, time: meal.time, content: meal.content });
        } else {
            setEditingMeal(null);
            setDietForm({ mealName: '', time: '', content: '' });
        }
        setShowDietModal(true);
    };

    const saveMeal = (e) => {
        e.preventDefault();
        if (editingMeal) {
            setMeals(meals.map(m => m.id === editingMeal.id ? { ...dietForm, id: m.id } : m));
        } else {
            setMeals([...meals, { ...dietForm, id: Date.now() }]);
        }
        setShowDietModal(false);
        setEditingMeal(null);
    };

    const deleteMeal = (id) => {
        if (window.confirm("Bu öğünü listeden uçuruyoruz, emin misin dayı?")) {
            setMeals(meals.filter(m => m.id !== id));
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.main}>
                <div style={styles.header}>
                    <button onClick={() => navigate(`/admin/member/${id}`)} style={styles.backBtn}>
                        <ArrowLeft size={18} /> Profile Dön
                    </button>
                    <h2 style={{ color: 'white', margin: 0 }}>
                        <span style={{ color: 'var(--n1fit-red)' }}>{member?.fullName}</span> - Program Yönetimi
                    </h2>
                </div>

                <div style={styles.tabContainer}>
                    <button style={{ ...styles.tabBtn, backgroundColor: activeTab === 'workout' ? '#d90429' : '#1a1a1a' }} onClick={() => setActiveTab('workout')}>
                        <Dumbbell size={20} /> Antrenman Programı
                    </button>
                    <button style={{ ...styles.tabBtn, backgroundColor: activeTab === 'diet' ? '#d90429' : '#1a1a1a' }} onClick={() => setActiveTab('diet')}>
                        <Utensils size={20} /> Beslenme Programı
                    </button>
                </div>

                <div style={styles.contentArea}>
                    {activeTab === 'workout' ? (
                        /* ANTRENMAN EKRANI */
                        <div style={styles.workoutGrid}>
                            {/* SOL TARAF: GÜNLER */}
                            <div style={styles.leftPanel}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ color: '#fff', margin: 0 }}>Program Günleri</h3>
                                    <button onClick={handleAddDay} style={styles.actionBtn}><Plus size={16}/> Yeni Gün Ekle</button>
                                    <button onClick={saveFullWorkoutProgram} style={{ backgroundColor: '#4ade80', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                        TÜMÜNÜ KAYDET
                                    </button>
                                </div>
                                
                                <div style={styles.daysContainer}>
                                    {days.map(day => {
                                        const isActive = activeDayId === day.id;
                                        return (
                                            <div key={day.id} style={{ ...styles.dayCard, borderColor: isActive ? '#d90429' : '#333', backgroundColor: isActive ? '#1e1e1e' : '#151515' }}>
                                                <div style={styles.dayHeader} onClick={() => setActiveDayId(isActive ? null : day.id)}>
                                                    <input 
                                                        value={day.title} 
                                                        onClick={(e) => e.stopPropagation()} 
                                                        onChange={(e) => {
                                                            const newDays = days.map(d => d.id === day.id ? {...d, title: e.target.value} : d);
                                                            setDays(newDays);
                                                        }}
                                                        style={{...styles.dayTitleInput, color: isActive ? '#d90429' : '#aaa'}}
                                                    />
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <span style={{ color: '#666', fontSize: '0.8rem' }}>{day.exercises.length} Hareket</span>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }} style={styles.iconBtnRed} title="Günü Sil"><Trash2 size={16} /></button>
                                                        {isActive ? <ChevronDown color="#d90429" size={20} /> : <ChevronRight color="#666" size={20} />}
                                                    </div>
                                                </div>

                                                {isActive && (
                                                    <div style={styles.dayBody}>
                                                        {day.exercises.length === 0 ? (
                                                            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0, textAlign: 'center', padding: '10px 0' }}>Henüz hareket eklenmedi amq, sağdan seç.</p>
                                                        ) : (
                                                            day.exercises.map(ex => (
                                                                <div key={ex.uniqueId} style={styles.exerciseItem}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{ex.name}</div>
                                                                        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>
                                                                            {ex.muscleGroup === 'Kardiyo' 
                                                                                ? `${ex.details.duration} dk | Hız: ${ex.details.speed} | Eğim: ${ex.details.incline}`
                                                                                : `${ex.details.sets} Set | ${ex.details.reps} Tekrar | ${ex.details.restTime} Dinlenme`
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                                        <button onClick={() => openEditExerciseModal(day.id, ex)} style={styles.iconBtn} title="Düzenle"><Pencil size={16} /></button>
                                                                        <button onClick={() => handleDeleteExercise(day.id, ex.uniqueId)} style={styles.iconBtnRed} title="Sil"><Trash2 size={16} /></button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SAĞ TARAF: KÜTÜPHANE (ARTIK GERÇEK VERİLER) */}
                            <div style={styles.rightPanel}>
                                <h3 style={{ color: '#fff', marginBottom: '20px' }}>Hareket Kütüphanesi</h3>
                                <div style={styles.muscleGroupList}>
                                    {MUSCLE_GROUPS.map(muscle => {
                                        // Bu kas grubuna ait hareketleri SQL listesinden filtreliyoruz
                                        const exercisesInMuscle = dbExercises.filter(e => e.muscleGroup === muscle);

                                        return (
                                            <div key={muscle} style={{ marginBottom: '5px' }}>
                                                <button onClick={() => setExpandedMuscle(expandedMuscle === muscle ? null : muscle)} style={styles.muscleBtn}>
                                                    {muscle} <span style={{fontSize: '0.8rem', color: '#666'}}>({exercisesInMuscle.length})</span>
                                                    {expandedMuscle === muscle ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </button>
                                                
                                                {expandedMuscle === muscle && (
                                                    <div style={styles.exerciseDropdown}>
                                                        {exercisesInMuscle.length === 0 ? (
                                                            <div style={{color: '#666', fontSize: '0.85rem', padding: '10px', textAlign: 'center'}}>
                                                                Bu bölgeye ait hareket yok emmoğlu.
                                                            </div>
                                                        ) : (
                                                            exercisesInMuscle.map(ex => (
                                                                <div key={ex.id} style={styles.subExerciseItem}>
                                                                    <span style={{ color: '#ddd', fontSize: '0.9rem' }}>{ex.name}</span>
                                                                    <button onClick={() => openExerciseModal(ex)} style={styles.addExBtn}><Plus size={14} /> Ekle</button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* BESLENME EKRANI (Aynı duruyor, fıstık gibi) */
                        <div style={styles.dietContainer}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h3 style={{ color: '#fff', margin: 0 }}>Günlük Beslenme Planı</h3>
                                    <p style={{ color: '#888', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Makroları sağlam tut, mutfakta kazanılır bu spor!</p>
                                </div>
                                <button onClick={() => openDietModal()} style={styles.actionBtn}>
                                    <Plus size={16}/> Yeni Öğün Ekle
                                </button>
                                <button onClick={saveFullDietProgram} style={{ backgroundColor: '#4ade80', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                TÜMÜNÜ KAYDET
                                </button>
                            </div>

                            <div style={styles.mealList}>
                                {meals.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#151515', borderRadius: '10px' }}>
                                        Adam açlıktan ölecek emmoğlu, bir şeyler yaz şuraya!
                                    </div>
                                ) : (
                                    meals.sort((a, b) => a.time.localeCompare(b.time)).map(meal => (
                                        <div key={meal.id} style={styles.mealCardContainer}>
                                            <div style={styles.mealTimeBox}>
                                                <Clock size={20} color="#d90429" />
                                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{meal.time}</span>
                                            </div>
                                            <div style={styles.mealContentBox}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <h4 style={{ color: '#d90429', margin: 0, fontSize: '1.1rem' }}>{meal.mealName}</h4>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button onClick={() => openDietModal(meal)} style={styles.iconBtn} title="Düzenle"><Pencil size={16} /></button>
                                                        <button onClick={() => deleteMeal(meal.id)} style={styles.iconBtnRed} title="Sil"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <p style={{ color: '#ccc', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                                    {meal.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================= */}
            {/* ANTRENMAN MODALI */}
            {/* ========================================= */}
            {showWorkoutModal && selectedExercise && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContent}>
                        <h3 style={{ color: '#fff', marginTop: 0 }}>
                            {editingExercise ? `${selectedExercise.name} - Rötuş Çek` : `${selectedExercise.name} Ayarları`}
                        </h3>
                        
                        <form onSubmit={saveExerciseToDay} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={styles.label}>Hangi Güne Kaydedilecek?</label>
                                <select value={selectedDayId} onChange={e => setSelectedDayId(e.target.value)} style={styles.selectInput}>
                                    {days.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                                </select>
                            </div>

                            {selectedExercise.muscleGroup === 'Kardiyo' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div><label style={styles.label}>Süre (Dk)</label><input value={exForm.duration} style={styles.input} required onChange={e => setExForm({...exForm, duration: e.target.value})} /></div>
                                    <div><label style={styles.label}>Hız</label><input value={exForm.speed} style={styles.input} required onChange={e => setExForm({...exForm, speed: e.target.value})} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><label style={styles.label}>Eğim</label><input value={exForm.incline} style={styles.input} required onChange={e => setExForm({...exForm, incline: e.target.value})} /></div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div><label style={styles.label}>Set Sayısı</label><input type="number" value={exForm.sets} style={styles.input} required onChange={e => setExForm({...exForm, sets: e.target.value})} /></div>
                                    <div><label style={styles.label}>Tekrar</label><input value={exForm.reps} style={styles.input} required onChange={e => setExForm({...exForm, reps: e.target.value})} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><label style={styles.label}>Dinlenme Süresi</label><input value={exForm.restTime} style={styles.input} required onChange={e => setExForm({...exForm, restTime: e.target.value})} /></div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowWorkoutModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingExercise ? 'Değişiklikleri Kaydet' : 'Güne Zımbala'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* BESLENME MODALI */}
            {/* ========================================= */}
            {showDietModal && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContent}>
                        <h3 style={{ color: '#fff', marginTop: 0 }}>
                            {editingMeal ? 'Öğünü Düzenle' : 'Yeni Öğün Ekle'}
                        </h3>
                        
                        <form onSubmit={saveMeal} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={styles.label}>Öğün Adı (Örn: Kahvaltı)</label>
                                    <input value={dietForm.mealName} style={styles.input} required onChange={e => setDietForm({...dietForm, mealName: e.target.value})} placeholder="1. Ara Öğün..." />
                                </div>
                                <div>
                                    <label style={styles.label}>Saat</label>
                                    <input type="time" value={dietForm.time} style={styles.input} required onChange={e => setDietForm({...dietForm, time: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={styles.label}>İçerik (Ne yiyecek bu adam?)</label>
                                <textarea 
                                    value={dietForm.content} 
                                    style={{...styles.input, height: '120px', resize: 'vertical'}} 
                                    required 
                                    onChange={e => setDietForm({...dietForm, content: e.target.value})} 
                                    placeholder="4 yumurta, 100gr pirinç lapası..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowDietModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingMeal ? 'Öğünü Güncelle' : 'Listeye Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// STYLES
const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '30px 20px', fontFamily: 'sans-serif' },
    main: { maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '20px' },
    backBtn: { backgroundColor: 'transparent', color: '#888', border: '1px solid #333', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    tabContainer: { display: 'flex', gap: '15px', marginBottom: '30px' },
    tabBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' },
    contentArea: { backgroundColor: '#111', borderRadius: '15px', padding: '20px', border: '1px solid #222', minHeight: '600px' },
    
    // Antrenman Stilleri
    workoutGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', height: '100%' },
    leftPanel: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column' },
    daysContainer: { overflowY: 'auto', maxHeight: '600px', paddingRight: '10px' },
    rightPanel: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', overflowY: 'auto', maxHeight: '700px' },
    dayCard: { borderRadius: '8px', border: '1px solid', marginBottom: '15px', overflow: 'hidden', transition: '0.3s' },
    dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', cursor: 'pointer', backgroundColor: 'transparent' },
    dayTitleInput: { flex: 1, backgroundColor: 'transparent', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' },
    dayBody: { padding: '0 15px 15px 15px', borderTop: '1px solid #333', marginTop: '5px', paddingTop: '15px' },
    actionBtn: { backgroundColor: '#d90429', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    muscleGroupList: { display: 'flex', flexDirection: 'column' },
    muscleBtn: { backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1rem' },
    exerciseDropdown: { backgroundColor: '#151515', border: '1px solid #333', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '-5px', marginBottom: '10px' },
    subExerciseItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #222' },
    addExBtn: { backgroundColor: '#333', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' },
    exerciseItem: { backgroundColor: '#151515', padding: '10px', borderRadius: '5px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    iconBtn: { backgroundColor: 'transparent', color: '#888', border: '1px solid #444', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    iconBtnRed: { backgroundColor: 'transparent', color: '#d90429', border: '1px solid #444', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    // Beslenme Stilleri
    dietContainer: { backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', border: '1px solid #333' },
    mealList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    mealCardContainer: { display: 'flex', backgroundColor: '#111', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden' },
    mealTimeBox: { backgroundColor: '#222', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', minWidth: '100px', borderRight: '1px solid #333' },
    mealContentBox: { padding: '20px', flex: 1 },

    // Modal Ortak Stilleri
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#111', padding: '30px', borderRadius: '10px', border: '2px solid #d90429', width: '450px' },
    label: { color: '#888', fontSize: '0.8rem', marginBottom: '5px', display: 'block' },
    input: { width: '100%', padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '5px', boxSizing: 'border-box', outline: 'none' },
    selectInput: { width: '100%', padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: 'white', borderRadius: '5px', outline: 'none' }
};

export default ProgramManager;