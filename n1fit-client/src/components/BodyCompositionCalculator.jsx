import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { calculateBodyCompositionLocal } from '../utils/bodyComposition';

const STORAGE_KEY = 'n1fit_body_profile';

const BodyCompositionCalculator = ({ measurements = [] }) => {
    const latest = measurements && measurements.length > 0 ? measurements[0] : null;

    const [gender, setGender] = useState('male');
    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [neck, setNeck] = useState('');
    const [waist, setWaist] = useState('');
    const [hips, setHips] = useState('');

    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [savedNotice, setSavedNotice] = useState(false);

    // Son ölçümden değerleri doldur
    useEffect(() => {
        if (latest) {
            if (latest.weight != null) setWeight(String(latest.weight));
            if (latest.neck != null) setNeck(String(latest.neck));
            if (latest.waist != null) setWaist(String(latest.waist));
            if (latest.hips != null) setHips(String(latest.hips));
        }
    }, [latest]);

    // Kayıtlı Yaş, Boy, Cinsiyet bilgilerini önce localStorage, sonra Backend'den çek
    useEffect(() => {
        let loadedAge = '';
        let loadedHeight = '';
        let loadedGender = 'male';

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.age) loadedAge = String(parsed.age);
                if (parsed.height) loadedHeight = String(parsed.height);
                if (parsed.gender) loadedGender = parsed.gender;
                setAge(loadedAge);
                setHeight(loadedHeight);
                setGender(loadedGender);
            }
        } catch (e) {
            console.warn('Local profil okunamadı:', e);
        }

        const token = localStorage.getItem('n1fit_token');
        if (!token) return;

        api.get('/Member/body-profile')
            .then(res => {
                const data = res.data;
                if (!data) return;
                const finalAge = data.age != null ? String(data.age) : loadedAge;
                const finalHeight = data.height != null ? String(data.height) : loadedHeight;
                const finalGender = data.gender || loadedGender || 'male';

                if (finalAge) setAge(finalAge);
                if (finalHeight) setHeight(finalHeight);
                if (finalGender) setGender(finalGender);

                // Eğer son ölçüm prop'tan gelmediyse API'den gelen son ölçümü kullan
                const w = latest?.weight ?? data.latestWeight;
                const n = latest?.neck ?? data.latestNeck;
                const wa = latest?.waist ?? data.latestWaist;
                const h = latest?.hips ?? data.latestHips;

                if (w != null && !weight) setWeight(String(w));
                if (n != null && !neck) setNeck(String(n));
                if (wa != null && !waist) setWaist(String(wa));
                if (h != null && !hips) setHips(String(h));

                // Tüm zorunlu bilgiler tamamsa otomatik hesapla
                if (finalAge && finalHeight && w && n && wa) {
                    try {
                        const calc = calculateBodyCompositionLocal({
                            age: finalAge,
                            height: finalHeight,
                            gender: finalGender,
                            weight: w,
                            neck: n,
                            waist: wa,
                            hips: h
                        });
                        setResult(calc);
                    } catch {
                        // Eksik/geçersiz parametre varsa kullanıcı butona basınca uyarı görsün
                    }
                }
            })
            .catch(() => {
                // Backend henüz güncellenmemişse veya çevrimdışıysa local verilerle otomatik hesapla
                const w = latest?.weight;
                const n = latest?.neck;
                const wa = latest?.waist;
                const h = latest?.hips;
                if (loadedAge && loadedHeight && w && n && wa) {
                    try {
                        const calc = calculateBodyCompositionLocal({
                            age: loadedAge,
                            height: loadedHeight,
                            gender: loadedGender,
                            weight: w,
                            neck: n,
                            waist: wa,
                            hips: h
                        });
                        setResult(calc);
                    } catch {
                        // ignore
                    }
                }
            });
    }, [latest]);

    const handleResetFromLatest = () => {
        if (!latest) return;
        setWeight(latest.weight != null ? String(latest.weight) : '');
        setNeck(latest.neck != null ? String(latest.neck) : '');
        setWaist(latest.waist != null ? String(latest.waist) : '');
        setHips(latest.hips != null ? String(latest.hips) : '');
        setError('');
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        setError('');
        setSavedNotice(false);

        try {
            const calcResult = calculateBodyCompositionLocal({
                age,
                height,
                gender,
                weight,
                neck,
                waist,
                hips
            });

            setResult(calcResult);

            // Kullanıcı tercihlerini localStorage'a kaydet
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    age: Number(age),
                    height: Number(height),
                    gender
                })
            );

            // Backend'e de kaydet
            try {
                await api.post('/Member/calculate-body-composition', {
                    age: Number(age),
                    height: Number(height),
                    gender,
                    weight: Number(weight),
                    neck: Number(neck),
                    waist: Number(waist),
                    hips: hips !== '' && hips != null ? Number(hips) : null
                });
            } catch {
                // Local hesaplama zaten başarılı olduğu için kullanıcı deneyimini kesintiye uğratma
            }

            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 3000);
        } catch (err) {
            setError(err.message || 'Hesaplama sırasında bir hata oluştu.');
        }
    };

    const renderWeightComparison = () => {
        if (!result) return null;
        const currentW = Number(weight);
        if (currentW < result.idealWeightMinKg) {
            const diff = (result.idealWeightMinKg - currentW).toFixed(1);
            return <span style={{ color: '#38bdf8' }}>Referans aralığın <b>{diff} kg</b> altında (Zayıf)</span>;
        }
        if (currentW > result.idealWeightMaxKg) {
            const diff = (currentW - result.idealWeightMaxKg).toFixed(1);
            return <span style={{ color: '#f59e0b' }}>Referans aralığın <b>{diff} kg</b> üzerinde</span>;
        }
        return <span style={{ color: '#4ade80' }}>Tam ideal referans kilo aralığındasın!</span>;
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>⚡ VÜCUT KOMPOZİSYONU & YAĞ ORANI ANALİZİ</h2>
                    <p style={styles.subtitle}>
                        Ölçülerinden alınan veriler ve bilimsel <b>U.S. Navy & FFMI</b> formülleriyle yağ oranını, yağsız kas kütleni ve referans değerlerini hesapla.
                    </p>
                </div>
                {latest && (
                    <button type="button" onClick={handleResetFromLatest} style={styles.syncBtn}>
                        🔄 Son Ölçümümden Doldur
                    </button>
                )}
            </div>

            <form onSubmit={handleCalculate} style={styles.formCard}>
                {/* 1. KİŞİSEL BİLGİLER: CİNSİYET, YAŞ, BOY */}
                <div style={styles.sectionLabel}>1. Kişisel Bilgilerin (Yaş, Cinsiyet ve Boy)</div>
                <div style={styles.grid3}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Cinsiyet</label>
                        <div style={styles.genderToggle}>
                            <button
                                type="button"
                                onClick={() => setGender('male')}
                                style={{
                                    ...styles.genderBtn,
                                    backgroundColor: gender === 'male' ? '#f59e0b' : '#1a1a1a',
                                    color: gender === 'male' ? '#000' : '#aaa',
                                    borderColor: gender === 'male' ? '#f59e0b' : '#333'
                                }}
                            >
                                ♂ Erkek
                            </button>
                            <button
                                type="button"
                                onClick={() => setGender('female')}
                                style={{
                                    ...styles.genderBtn,
                                    backgroundColor: gender === 'female' ? '#f59e0b' : '#1a1a1a',
                                    color: gender === 'female' ? '#000' : '#aaa',
                                    borderColor: gender === 'female' ? '#f59e0b' : '#333'
                                }}
                            >
                                ♀ Kadın
                            </button>
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Yaş</label>
                        <input
                            type="number"
                            min="10"
                            max="100"
                            placeholder="Örn: 25"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Boy (cm)</label>
                        <input
                            type="number"
                            step="0.5"
                            min="100"
                            max="250"
                            placeholder="Örn: 178"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                </div>

                {/* 2. VÜCUT ÖLÇÜLERİ: KİLO, BOYUN, BEL, KALÇA */}
                <div style={{ ...styles.sectionLabel, marginTop: '18px' }}>
                    2. Ölçüm Değerleri {latest ? <span style={{ color: '#4ade80', fontWeight: 'normal', fontSize: '0.8rem' }}>(Son ölçümünden otomatik çekildi, değiştirebilirsin)</span> : null}
                </div>
                <div style={gender === 'female' ? styles.grid4 : styles.grid3}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Kilo (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="25"
                            max="300"
                            placeholder="Örn: 80"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Boyun Çevresi (cm)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="20"
                            max="80"
                            placeholder="Örn: 38"
                            value={neck}
                            onChange={(e) => setNeck(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Bel Çevresi (cm)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="40"
                            max="200"
                            placeholder="Örn: 85"
                            value={waist}
                            onChange={(e) => setWaist(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    {gender === 'female' && (
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Kalça Çevresi (cm) *</label>
                            <input
                                type="number"
                                step="0.1"
                                min="50"
                                max="200"
                                placeholder="Örn: 96"
                                value={hips}
                                onChange={(e) => setHips(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                    )}
                </div>

                {error && <div style={styles.errorBox}>⚠️ {error}</div>}

                <div style={styles.actionRow}>
                    <button type="submit" style={styles.calcBtn}>
                        ANALİZ ET VE HESAPLA
                    </button>
                    {savedNotice && (
                        <span style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            ✓ Bilgilerin kaydedildi ve analiz güncellendi!
                        </span>
                    )}
                </div>
            </form>

            {/* SONUÇ EKRANI */}
            {result && (
                <div style={styles.resultsContainer}>
                    {/* ÜST DURUM BANNER'I */}
                    <div
                        style={{
                            ...styles.statusBanner,
                            borderColor: result.isPotentialDoping ? '#a855f7' : result.bodyFatColor,
                            background: result.isPotentialDoping
                                ? 'linear-gradient(90deg, rgba(168,85,247,0.18) 0%, rgba(17,17,17,0.95) 100%)'
                                : 'linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(17,17,17,0.95) 100%)'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Genel Vücut Değerlendirmesi
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'white', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ color: result.bodyFatColor }}>{result.bodyFatCategory}</span>
                                <span style={styles.badgePill}>{result.bmiCategory} (VKİ: {result.bmi})</span>
                                {result.isPotentialDoping && (
                                    <span style={styles.dopingBadge}>
                                        ⚡ POTANSİYEL DOPİNGLİ
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4 ANA METRİK KARTI */}
                    <div style={styles.metricsGrid}>
                        {/* 1. YAĞ ORANI KARTI */}
                        <div style={{ ...styles.metricCard, borderTop: `3px solid ${result.bodyFatColor}` }}>
                            <div style={styles.metricTitle}>VÜCUT YAĞ ORANI</div>
                            <div style={{ ...styles.metricValue, color: result.bodyFatColor }}>
                                %{result.bodyFatPercentage}
                            </div>
                            <div style={styles.metricTag}>{result.bodyFatCategory}</div>
                            <div style={styles.metricRef}>
                                {age} yaş {gender === 'female' ? 'kadın' : 'erkek'} için ideal referans:<br />
                                <b style={{ color: '#fff' }}>%{result.idealBodyFatMinPct} – %{result.idealBodyFatMaxPct}</b>
                            </div>
                        </div>

                        {/* 2. YAĞSIZ KÜTLE (LBM) VE YAĞ KÜTLESİ */}
                        <div style={{ ...styles.metricCard, borderTop: '3px solid #4ade80' }}>
                            <div style={styles.metricTitle}>YAĞSIZ VÜCUT KÜTLESİ (LBM)</div>
                            <div style={{ ...styles.metricValue, color: '#4ade80' }}>
                                {result.leanBodyMassKg} <span style={{ fontSize: '1.1rem' }}>kg</span>
                            </div>
                            <div style={styles.metricTag}>Kas, Kemik ve Su Kütlesi</div>
                            <div style={styles.metricRef}>
                                Toplam Yağ Kütlesi: <b style={{ color: '#d90429' }}>{result.fatMassKg} kg</b>
                            </div>
                        </div>

                        {/* 3. İDEAL / REFERANS KİLO ARALIĞI */}
                        <div style={{ ...styles.metricCard, borderTop: '3px solid #f59e0b' }}>
                            <div style={styles.metricTitle}>OLMASI GEREKEN KİLO ARALIĞI</div>
                            <div style={{ ...styles.metricValue, color: '#f59e0b', fontSize: '1.65rem' }}>
                                {result.idealWeightMinKg} – {result.idealWeightMaxKg} <span style={{ fontSize: '1rem' }}>kg</span>
                            </div>
                            <div style={styles.metricTag}>
                                {height} cm boy için sağlıklı referans
                            </div>
                            <div style={styles.metricRef}>
                                {renderWeightComparison()}
                            </div>
                        </div>

                        {/* 4. FFMI & DOĞAL SINIR / DOPİNG ANALİZİ */}
                        <div style={{ ...styles.metricCard, borderTop: `3px solid ${result.ffmiColor}` }}>
                            <div style={styles.metricTitle}>KAS İNDEKSİ (FFMI) & DOĞALLIK</div>
                            <div style={{ ...styles.metricValue, color: result.ffmiColor }}>
                                {result.normalizedFfmi}
                            </div>
                            <div style={{ ...styles.metricTag, color: result.ffmiColor, fontWeight: 'bold' }}>
                                {result.ffmiCategory}
                            </div>
                            <div style={styles.metricRef}>
                                Doğal genetik üst sınır: <b style={{ color: '#fff' }}>{gender === 'female' ? '21.5' : '25.0'} FFMI</b>
                            </div>
                        </div>
                    </div>

                    {/* VÜCUT KÜTLE DAĞILIM ÇUBUĞU */}
                    <div style={styles.compositionBarCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                                💪 Yağsız Kütle: {result.leanBodyMassKg} kg (%{(100 - result.bodyFatPercentage).toFixed(1)})
                            </span>
                            <span style={{ color: '#d90429', fontWeight: 'bold' }}>
                                🔥 Yağ Kütlesi: {result.fatMassKg} kg (%{result.bodyFatPercentage})
                            </span>
                        </div>
                        <div style={styles.progressTrack}>
                            <div
                                style={{
                                    width: `${Math.max(10, Math.min(95, 100 - result.bodyFatPercentage))}%`,
                                    backgroundColor: '#4ade80',
                                    height: '100%',
                                    transition: 'width 0.4s ease'
                                }}
                            />
                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: '#d90429',
                                    height: '100%'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: {
        marginTop: '35px',
        paddingTop: '25px',
        borderTop: '2px solid #222'
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px'
    },
    title: {
        color: '#f59e0b',
        margin: 0,
        fontSize: '1.35rem',
        fontWeight: '900'
    },
    subtitle: {
        color: '#999',
        margin: '6px 0 0 0',
        fontSize: '0.92rem'
    },
    syncBtn: {
        backgroundColor: '#1f1f1f',
        color: '#f59e0b',
        border: '1px solid #f59e0b',
        borderRadius: '6px',
        padding: '8px 14px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.85rem'
    },
    formCard: {
        backgroundColor: '#111',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid #222'
    },
    sectionLabel: {
        color: '#ddd',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        marginBottom: '12px',
        borderBottom: '1px solid #222',
        paddingBottom: '6px'
    },
    grid3: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
    },
    grid4: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px'
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        color: '#aaa',
        fontSize: '0.85rem',
        fontWeight: '600'
    },
    input: {
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '6px',
        padding: '10px 12px',
        color: 'white',
        fontSize: '1rem',
        outline: 'none'
    },
    genderToggle: {
        display: 'flex',
        gap: '8px'
    },
    genderBtn: {
        flex: 1,
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #333',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        transition: '0.2s'
    },
    actionRow: {
        marginTop: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap'
    },
    calcBtn: {
        backgroundColor: '#f59e0b',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontWeight: '900',
        fontSize: '1rem',
        cursor: 'pointer',
        letterSpacing: '0.5px'
    },
    errorBox: {
        marginTop: '14px',
        backgroundColor: 'rgba(217, 4, 41, 0.15)',
        border: '1px solid #d90429',
        color: '#ff6b81',
        padding: '10px 14px',
        borderRadius: '6px',
        fontSize: '0.9rem'
    },
    resultsContainer: {
        marginTop: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    statusBanner: {
        padding: '16px 20px',
        borderRadius: '10px',
        borderLeft: '5px solid #f59e0b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
    },
    badgePill: {
        backgroundColor: '#222',
        color: '#ddd',
        fontSize: '0.85rem',
        padding: '4px 10px',
        borderRadius: '20px',
        fontWeight: '600'
    },
    dopingBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.25)',
        border: '1px solid #a855f7',
        color: '#e9d5ff',
        fontSize: '0.85rem',
        padding: '4px 12px',
        borderRadius: '20px',
        fontWeight: '900'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '15px'
    },
    metricCard: {
        backgroundColor: '#111',
        padding: '18px',
        borderRadius: '10px',
        border: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    metricTitle: {
        color: '#888',
        fontSize: '0.78rem',
        fontWeight: '800',
        letterSpacing: '0.8px'
    },
    metricValue: {
        fontSize: '2rem',
        fontWeight: '900',
        margin: '8px 0 4px 0'
    },
    metricTag: {
        color: '#ccc',
        fontSize: '0.9rem',
        marginBottom: '10px'
    },
    metricRef: {
        borderTop: '1px solid #222',
        paddingTop: '8px',
        color: '#888',
        fontSize: '0.82rem',
        lineHeight: '1.4'
    },
    compositionBarCard: {
        backgroundColor: '#111',
        padding: '16px 20px',
        borderRadius: '10px',
        border: '1px solid #222'
    },
    progressTrack: {
        width: '100%',
        height: '14px',
        backgroundColor: '#222',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex'
    }
};

export default BodyCompositionCalculator;
