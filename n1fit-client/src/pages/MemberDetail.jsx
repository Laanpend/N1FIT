import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Clock, Dumbbell, Plus } from 'lucide-react';
import api from '../api/axiosConfig';

const MemberDetail = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [member, setMember] = useState(null);
    const [activeTab, setActiveTab] = useState('measurements'); 
    const [workoutProgram, setWorkoutProgram] = useState({ name: "Haftalık Program", days: [] });
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
    const [currentAddForm, setCurrentAddForm] = useState({ exerciseId: '', sets: '', reps: '', restTime: '', duration: '', speed: '', incline: '' });
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [expandedDayIndex, setExpandedDayIndex] = useState(0);

    
    // GÜNCELLEME MODU İÇİN STATELER
    const [editingDiet, setEditingDiet] = useState(null);
    const [editingMeasurement, setEditingMeasurement] = useState(null);

    // Listeler
    const [measurements, setMeasurements] = useState([]);
    const [diets, setDiets] = useState([]);

    // Form Stateleri
    const [measForm, setMeasForm] = useState({ weight: '', shoulder: '', chest: '', leftArm: '', rightArm: '', waist: '', neck: '' });
    const [dietForm, setDietForm] = useState({ mealName: '', time: '', content: '' });
    const [workoutForm, setWorkoutForm] = useState({ exerciseId: '', sets: '', reps: '' });
    const [allExercises, setAllExercises] = useState([]); 

    useEffect(() => {
        if (id) {
            console.log("DİKKAT: Veriler çekiliyor, ID:", id);
            loadData();
            fetchExercises();
            fetchWorkoutProgram();
        }
    }, [id]);

    const fetchExercises = async () => {
        try {
            const res = await api.get('/Admin/exercises');
            setAllExercises(res.data || []);
        } catch (err) { console.error("Kütüphane patladı"); }
    };

    // TÜM VERİLERİ ÇEKEN KRAL FONKSİYON
    const loadData = async () => {
        try {
            const res = await api.get(`/Admin/member-detail/${id}`);
            setMember(res.data);
            setMeasurements(res.data.measurements || []);
            setDiets(res.data.diets || []);
        } catch (err) { console.error("Genel veri çekme hatası"); }
    };

    const fetchWorkoutProgram = async () => {
        try {
            const res = await api.get(`/Admin/members/${id}/workout-program`);
            if (res.data && res.data.days) setWorkoutProgram(res.data);
        } catch (err) { console.error("Antrenman patladı"); }
    };


    // ==========================================
    // 🛠️ ÖLÇÜ (MEASUREMENT) OPERASYONLARI
    // ==========================================
    const handleEditMeasurement = (measurement) => {
        setEditingMeasurement(measurement);
        setMeasForm({
            weight: measurement.weight || '',
            shoulder: measurement.shoulder || '',
            chest: measurement.chest || '',
            leftArm: measurement.leftArm || '',
            rightArm: measurement.rightArm || '',
            waist: measurement.waist || '',
            neck: measurement.neck || ''
        });
    };

    const handleAddMeasurement = async (e) => {
        e.preventDefault();
        try {
            if (editingMeasurement) {
                const targetId = editingMeasurement.id || editingMeasurement.Id;
                await api.put(`/Admin/measurements/${targetId}`, measForm);
                alert("Ölçüler aslanlar gibi güncellendi!");
                setEditingMeasurement(null); 
            } else {
                await api.post(`/Admin/member/${id}/measurements`, measForm);
                alert("Yeni ölçüler dükkana hayırlı olsun!");
            }
            setMeasForm({ weight: '', shoulder: '', chest: '', leftArm: '', rightArm: '', waist: '', neck: '' });
            loadData(); 
        } catch (err) { alert("Ölçü işleminde patladık dayı!"); }
    };

    const handleDeleteMeasurement = async (measurementId) => {
        if (window.confirm("Bu ölçüyü tarihten siliyoruz, onaylıyor musun?")) {
            try {
                await api.delete(`/Admin/measurements/${measurementId}`);
                alert("Ölçü buharlaştı!");
                loadData(); 
            } catch (err) { console.error("Ölçü silinirken motor yaktık", err); }
        }
    };


    // ==========================================
    // 🛠️ BESLENME (DIET) OPERASYONLARI
    // ==========================================
    const handleEditDiet = (diet) => {
        setEditingDiet(diet);
        setDietForm({
            mealName: diet.mealName || '',
            time: diet.time || '',
            content: diet.content || ''
        });
    };

    const handleAddDiet = async (e) => {
        e.preventDefault();
        try {
            if (editingDiet) {
                const targetId = editingDiet.id || editingDiet.Id;
                await api.put(`/Admin/diet/${targetId}`, dietForm);
                alert("Öğün aslanlar gibi güncellendi!");
                setEditingDiet(null);
            } else {
                await api.post(`/Admin/member/${id}/diet`, dietForm);
                alert("Öğün listeye çakıldı!");
            }
            setDietForm({ mealName: '', time: '', content: '' });
            loadData(); // PATLAYAN YER BURASIYDI, DÜZELTİLDİ!
        } catch (err) { alert("Diyet işleminde patladık!"); }
    };

    const handleDeleteDiet = async (dietId) => {
        if (window.confirm("Bu diyeti siktir edip atıyoruz emmoğlu, emin misin?")) {
            try {
                await api.delete(`/Admin/diet/${dietId}`);
                alert("Diyet çöpe atıldı!");
                loadData(); 
            } catch (err) { console.error("Diyet silinirken patladık", err); }
        }
    };



    if (!member) return <div style={{ color: 'white', padding: '50px' }}>Canavar aranıyor...</div>;

    const getDiff = (current, older, isNegativeBad = false) => {
        if (!older) return null;
        const diff = (current - older).toFixed(1);
        if (diff == 0) return null;
        const isPos = diff > 0;
        const color = isNegativeBad ? (isPos ? '#d90429' : '#4ade80') : (isPos ? '#4ade80' : '#d90429');
        return <span style={{ color: color, fontSize: '0.8rem', marginLeft: '6px', fontWeight: 'bold' }}>({isPos ? '+' : ''}{diff})</span>;
    };


    return (
        <div style={styles.container}>
            {/* ÜST BİLGİ ALANI */}
            <div style={styles.header}>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                    <ArrowLeft size={20} /> Geri Dön
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={styles.avatar}>
                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, color: 'white' }}>{member.firstName} {member.lastName}</h1>
                        <span style={{ color: '#aaa' }}>{member.phoneNumber} | Paket: {member.packageName || "Paket Yok"}</span>
                    </div>
                </div>
            </div>

            {/* SEKMELER (TABS) */}
            <div style={styles.tabContainer}>
                <button onClick={() => setActiveTab('measurements')} style={activeTab === 'measurements' ? styles.activeTab : styles.tab}>
                    <Activity size={18} /> Ölçüler
                </button>
                <button onClick={() => setActiveTab('diet')} style={activeTab === 'diet' ? styles.activeTab : styles.tab}>
                    <Clock size={18} /> Beslenme
                </button>
                <button onClick={() => setActiveTab('workout')} style={activeTab === 'workout' ? styles.activeTab : styles.tab}>
                    <Dumbbell size={18} /> Antrenman
                </button>
            </div>

            {/* İÇERİK ALANI */}
            <div style={styles.content}>

                {/* --- ÖLÇÜLER SEKMESİ --- */}
                {activeTab === 'measurements' && (
                    <div style={styles.grid}>
                        {/* Ölçü Ekleme/Güncelleme Formu */}
                        <div style={styles.card}>
                            <h3 style={{ color: '#4ade80', marginTop: 0 }}>
                                {editingMeasurement ? "Ölçüyü Güncelle" : "Yeni Ölçü Gir"}
                            </h3>
                            <form onSubmit={handleAddMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input style={styles.input} type="number" step="0.1" placeholder="Kilo (kg)" value={measForm.weight} onChange={e => setMeasForm({ ...measForm, weight: e.target.value })} required />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Omuz" value={measForm.shoulder} onChange={e => setMeasForm({ ...measForm, shoulder: e.target.value })} required />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Göğüs" value={measForm.chest} onChange={e => setMeasForm({ ...measForm, chest: e.target.value })} required />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Sağ Kol" value={measForm.rightArm} onChange={e => setMeasForm({ ...measForm, rightArm: e.target.value })} required />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Sol Kol" value={measForm.leftArm} onChange={e => setMeasForm({ ...measForm, leftArm: e.target.value })} required />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Bel" value={measForm.waist} onChange={e => setMeasForm({ ...measForm, waist: e.target.value })} required />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Boyun" value={measForm.neck} onChange={e => setMeasForm({ ...measForm, neck: e.target.value })} required />
                                </div>
                                
                                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: editingMeasurement ? '#3b82f6' : '#4ade80', color: 'black' }}>
                                    <Plus size={18} /> {editingMeasurement ? "GÜNCELLEMEYİ BAS" : "KAYDET"}
                                </button>
                                {editingMeasurement && (
                                    <button type="button" onClick={() => {
                                        setEditingMeasurement(null);
                                        setMeasForm({ weight: '', shoulder: '', chest: '', leftArm: '', rightArm: '', waist: '', neck: '' });
                                    }} style={{ ...styles.submitBtn, backgroundColor: '#d90429', color: 'white' }}>
                                        İPTAL ET
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* ÖLÇÜ GEÇMİŞİ TABLOSU */}
                        <div style={styles.card}>
                            <h3 style={{ color: 'white', marginTop: 0 }}>Ölçü Geçmişi</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ color: '#888', fontSize: '0.8rem', borderBottom: '1px solid #333' }}>
                                            <th style={{ padding: '12px' }}>Tarih</th>
                                            <th style={{ padding: '12px' }}>Kilo</th>
                                            <th style={{ padding: '12px' }}>Omuz</th>
                                            <th style={{ padding: '12px' }}>Göğüs</th>
                                            <th style={{ padding: '12px' }}>Kol (S/S)</th>
                                            <th style={{ padding: '12px' }}>Bel</th>
                                            <th style={{ padding: '12px' }}>Boyun</th>
                                            <th style={{ padding: '12px' }}>Ayar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {measurements.map((m, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                                <td style={{ padding: '12px' }}>
                                                    {m.recordDate || m.RecordDate ? new Date(m.recordDate || m.RecordDate).toLocaleDateString() : "Tarih Yok"}
                                                </td>
                                                <td style={{ padding: '12px' }}>{m.weight} {getDiff(m.weight, measurements[i + 1]?.weight, true)}</td>
                                                <td style={{ padding: '12px' }}>{m.shoulder} {getDiff(m.shoulder, measurements[i + 1]?.shoulder)}</td>
                                                <td style={{ padding: '12px' }}>{m.chest} {getDiff(m.chest, measurements[i + 1]?.chest)}</td>
                                                <td style={{ padding: '12px' }}>{m.rightArm} / {m.leftArm}</td>
                                                <td style={{ padding: '12px' }}>{m.waist} {getDiff(m.waist, measurements[i + 1]?.waist, true)}</td>
                                                <td style={{ padding: '12px' }}>{m.neck} {getDiff(m.neck, measurements[i + 1]?.neck)}</td>
                                                <td style={{ padding: '12px', display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => handleDeleteMeasurement(m.id || m.Id)} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        SİL
                                                    </button>
                                                    <button onClick={() => handleEditMeasurement(m)} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        GÜNCELLE
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- BESLENME SEKMESİ --- */}
                {activeTab === 'diet' && (
                    <div style={styles.grid}>
                        {/* Öğün Ekleme/Güncelleme Formu */}
                        <div style={styles.card}>
                            <h3 style={{ color: '#d90429', marginTop: 0 }}>
                                {editingDiet ? "Öğünü Güncelle" : "Yeni Öğün Ekle"}
                            </h3>
                            <form onSubmit={handleAddDiet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input style={styles.input} type="time" value={dietForm.time} onChange={e => setDietForm({ ...dietForm, time: e.target.value })} required />
                                <input style={styles.input} type="text" placeholder="Öğün Adı (örn: Kahvaltı)" value={dietForm.mealName} onChange={e => setDietForm({ ...dietForm, mealName: e.target.value })} required />
                                <textarea style={{ ...styles.input, height: '100px' }} placeholder="İçerik (örn: 4 Yumurta, 100gr Yulaf)" value={dietForm.content} onChange={e => setDietForm({ ...dietForm, content: e.target.value })} required />
                                
                                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: editingDiet ? '#3b82f6' : '#d90429', color: 'white' }}>
                                    <Plus size={18} /> {editingDiet ? "GÜNCELLEMEYİ BAS" : "LİSTEYE EKLE"}
                                </button>
                                
                                {editingDiet && (
                                    <button type="button" onClick={() => {
                                        setEditingDiet(null);
                                        setDietForm({ mealName: '', time: '', content: '' });
                                    }} style={{ ...styles.submitBtn, backgroundColor: '#444', color: 'white' }}>
                                        İPTAL ET
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Güncel Diyet Listesi */}
                        <div style={styles.card}>
                            <h3 style={{ color: 'white', marginTop: 0 }}>Beslenme Programı</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {diets.map((d, i) => (
                                    <div key={i} style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '5px', borderLeft: '3px solid #d90429', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 'bold', color: '#d90429', fontSize: '1.2rem', minWidth: '60px' }}>{d.time}</div>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{d.mealName}</div>
                                                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{d.content}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => handleDeleteDiet(d.id || d.Id)} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                SİL
                                            </button>
                                            <button onClick={() => handleEditDiet(d)} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                GÜNCELLE
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {diets.length === 0 && <div style={{ color: '#666', textAlign: 'center' }}>Henüz diyet eklenmemiş dayıoğlu.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ANTRENMAN SEKMESİ (Aynen Bıraktım) --- */}
                {activeTab === 'workout' && (
                    <div style={styles.grid}>

                        {/* SOL TARAF: HAREKET VE GÜN EKLEME FORMU */}
                        <div style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: '#3b82f6', margin: 0 }}>Programa Hareketi Daya</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextDay = workoutProgram.days.length + 1;
                                        const newDays = [...workoutProgram.days, { title: `${nextDay}. Gün`, exercises: [] }];
                                        setWorkoutProgram({ days: newDays });
                                        setSelectedDayIndex(newDays.length - 1); 
                                        setExpandedDayIndex(newDays.length - 1); 
                                    }}
                                    style={{ backgroundColor: '#1a1a1a', color: '#3b82f6', border: '1px solid #3b82f6', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + YENİ GÜN EKLE
                                </button>
                            </div>

                            {workoutProgram.days.length === 0 ? (
                                <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Önce yukarıdan 'Yeni Gün Ekle' butonuna bas dayıoğlu!</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                    <select style={{ ...styles.input, borderLeft: '3px solid #3b82f6' }} value={selectedDayIndex} onChange={e => setSelectedDayIndex(Number(e.target.value))}>
                                        {workoutProgram.days.map((d, i) => <option key={i} value={i}>{d.title} 'e Ekle</option>)}
                                    </select>

                                    <select style={styles.input} value={selectedMuscleGroup} onChange={e => { setSelectedMuscleGroup(e.target.value); setCurrentAddForm({ ...currentAddForm, exerciseId: '' }); }}>
                                        <option value="">Bölge Seç...</option>
                                        {[...new Set(allExercises.map(ex => ex.muscleGroup))].map((mg, i) => <option key={i} value={mg}>{mg}</option>)}
                                    </select>

                                    <select style={{ ...styles.input, opacity: selectedMuscleGroup ? 1 : 0.5 }} value={currentAddForm.exerciseId} onChange={e => setCurrentAddForm({ ...currentAddForm, exerciseId: e.target.value })} disabled={!selectedMuscleGroup}>
                                        <option value="">Hareket Seç...</option>
                                        {allExercises.filter(ex => ex.muscleGroup === selectedMuscleGroup).map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                                    </select>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {selectedMuscleGroup === "Kardiyo" ? (
                                            <>
                                                <input style={styles.input} type="number" placeholder="Süre(dk)" value={currentAddForm.duration} onChange={e => setCurrentAddForm({ ...currentAddForm, duration: e.target.value })} />
                                                <input style={styles.input} type="number" step="0.1" placeholder="Hız" value={currentAddForm.speed} onChange={e => setCurrentAddForm({ ...currentAddForm, speed: e.target.value })} />
                                                <input style={styles.input} type="number" step="0.1" placeholder="Eğim" value={currentAddForm.incline} onChange={e => setCurrentAddForm({ ...currentAddForm, incline: e.target.value })} />
                                            </>
                                        ) : (
                                            <>
                                                <input style={styles.input} type="number" placeholder="Set" value={currentAddForm.sets} onChange={e => setCurrentAddForm({ ...currentAddForm, sets: e.target.value })} />
                                                <input style={styles.input} type="text" placeholder="Tekrar" value={currentAddForm.reps} onChange={e => setCurrentAddForm({ ...currentAddForm, reps: e.target.value })} />
                                                <input style={styles.input} type="number" placeholder="Dinlenme(sn)" value={currentAddForm.restTime} onChange={e => setCurrentAddForm({ ...currentAddForm, restTime: e.target.value })} />
                                            </>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!currentAddForm.exerciseId) return alert("Hareketi seçsene amq!");
                                            const newDays = [...workoutProgram.days];
                                            newDays[selectedDayIndex].exercises.push({ ...currentAddForm });
                                            setWorkoutProgram({ days: newDays });
                                            setCurrentAddForm({ exerciseId: '', sets: '', reps: '', restTime: '', duration: '', speed: '', incline: '' });
                                            setExpandedDayIndex(selectedDayIndex); 
                                        }}
                                        style={{ ...styles.submitBtn, backgroundColor: '#3b82f6', color: 'white', marginTop: '10px' }}
                                    >Hareketi Listeye At</button>
                                </div>
                            )}
                        </div>

                        {/* SAĞ TARAF: GÜNCEL PROGRAM LİSTESİ VE KAYDET BUTONU */}
                        <div style={styles.card}>
                            <h3 style={{ color: 'white', marginTop: 0 }}>Oluşturulan Program</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                {workoutProgram.days.length === 0 && <div style={{ color: '#666' }}>Program henüz boş.</div>}

                                {workoutProgram.days.map((day, dayIdx) => (
                                    <div key={dayIdx} style={{ backgroundColor: '#1a1a1a', borderRadius: '5px', overflow: 'hidden' }}>

                                        <div
                                            onClick={() => setExpandedDayIndex(expandedDayIndex === dayIdx ? null : dayIdx)}
                                            style={{ padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderLeft: '3px solid #3b82f6' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{expandedDayIndex === dayIdx ? '▼' : '▶'}</span>
                                                <input
                                                    style={{ backgroundColor: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', outline: 'none' }}
                                                    value={day.title}
                                                    onClick={e => e.stopPropagation()} 
                                                    onChange={(e) => {
                                                        const newDays = [...workoutProgram.days];
                                                        newDays[dayIdx].title = e.target.value;
                                                        setWorkoutProgram({ days: newDays });
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const newDays = workoutProgram.days.filter((_, i) => i !== dayIdx);
                                                    setWorkoutProgram({ days: newDays });
                                                    if (selectedDayIndex === dayIdx) setSelectedDayIndex(0);
                                                }}
                                                style={{ color: '#d90429', background: 'transparent', border: '1px solid #d90429', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >Günü Sil</button>
                                        </div>

                                        {expandedDayIndex === dayIdx && (
                                            <div style={{ padding: '10px', borderTop: '1px solid #222' }}>
                                                {day.exercises.length === 0 && <div style={{ color: '#666', fontSize: '0.9rem', padding: '5px' }}>Bu güne henüz hareket eklenmedi.</div>}

                                                {day.exercises.map((ex, exIdx) => {
                                                    const isCardio = allExercises.find(a => a.id == parseInt(ex.exerciseId))?.muscleGroup === "Kardiyo";
                                                    return (
                                                        <div key={exIdx} style={{ padding: '10px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1rem' }}>{allExercises.find(a => a.id == parseInt(ex.exerciseId))?.name}</div>
                                                                {isCardio ? (
                                                                    <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{ex.duration} dk | Hız: {ex.speed} | Eğim: {ex.incline}</div>
                                                                ) : (
                                                                    <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{ex.sets} Set x {ex.reps} Tekrar | Dinlenme: {ex.restTime} sn</div>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setCurrentAddForm(ex);
                                                                        const muscle = allExercises.find(a => a.id == parseInt(ex.exerciseId))?.muscleGroup;
                                                                        setSelectedMuscleGroup(muscle || "");
                                                                        setSelectedDayIndex(dayIdx);
                                                                        const newDays = [...workoutProgram.days];
                                                                        newDays[dayIdx].exercises = newDays[dayIdx].exercises.filter((_, i) => i !== exIdx);
                                                                        setWorkoutProgram({ days: newDays });
                                                                    }}
                                                                    style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                >Düzenle</button>
                                                                <button
                                                                    onClick={() => {
                                                                        const newDays = [...workoutProgram.days];
                                                                        newDays[dayIdx].exercises = newDays[dayIdx].exercises.filter((_, i) => i !== exIdx);
                                                                        setWorkoutProgram({ days: newDays });
                                                                    }}
                                                                    style={{ color: '#d90429', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                >Sil</button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {workoutProgram.days.length > 0 && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const payload = {
                                                days: workoutProgram.days.map(d => ({
                                                    title: d.title,
                                                    exercises: d.exercises.map(e => ({
                                                        exerciseId: parseInt(e.exerciseId) || 0,
                                                        sets: parseInt(e.sets) || 0,
                                                        reps: e.reps?.toString() || "",
                                                        restTime: e.restTime?.toString() || "",
                                                        duration: e.duration?.toString() || "",
                                                        speed: e.speed?.toString() || "",
                                                        incline: e.incline?.toString() || ""
                                                    }))
                                                }))
                                            };

                                            await api.post(`/Admin/members/${id}/workout-program`, payload);
                                            alert("Program aslanlar gibi SQL'e kazındı emmoğlu!");
                                        } catch (err) {
                                            alert("Kaydederken motor yaktık!");
                                            console.error(err);
                                        }
                                    }}
                                    style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '5px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '20px', transition: '0.2s' }}
                                >
                                    TÜM PROGRAMI KAYDET
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
};

// Tasarım Jiletleri
const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', padding: '30px' },
    header: { display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px', backgroundColor: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #222' },
    backBtn: { backgroundColor: 'transparent', color: '#aaa', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    avatar: { width: '60px', height: '60px', backgroundColor: '#d90429', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' },
    tab: { backgroundColor: 'transparent', color: '#888', border: 'none', padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' },
    activeTab: { backgroundColor: '#1a1a1a', color: 'white', border: '1px solid #333', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
    content: { minHeight: '500px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    card: { backgroundColor: '#111', padding: '25px', borderRadius: '10px', border: '1px solid #222' },
    input: { width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', borderRadius: '5px', outline: 'none', boxSizing: 'border-box' },
    submitBtn: { padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' }
};

export default MemberDetail;