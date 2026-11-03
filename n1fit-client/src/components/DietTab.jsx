import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const WATER_GOAL_GLASSES = 10; // 10 Bardak x 250ml = 2.5 Litre

// Türkiye yerel saatine göre tam gece 00:00'da günün değişmesini sağlar (UTC kaymasını önler)
const getTodayDateKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const DietTab = () => {
    const [dietProgram, setDietProgram] = useState({ targetCalories: null, meals: [] });
    const [activeSubTab, setActiveSubTab] = useState('tracker'); // 'tracker' | 'list'
    const [checkedMeals, setCheckedMeals] = useState({});
    const [checkedFoods, setCheckedFoods] = useState({});
    const [waterGlasses, setWaterGlasses] = useState(0);

    const todayKey = getTodayDateKey();
    const storageKey = `n1fit_diet_checks_${todayKey}`;
    const foodStorageKey = `n1fit_diet_food_checks_${todayKey}`;
    const waterStorageKey = `n1fit_water_glasses_${todayKey}`;

    useEffect(() => {
        try {
            const savedMeals = localStorage.getItem(storageKey);
            if (savedMeals) setCheckedMeals(JSON.parse(savedMeals));

            const savedFoods = localStorage.getItem(foodStorageKey);
            if (savedFoods) setCheckedFoods(JSON.parse(savedFoods));

            const savedWater = localStorage.getItem(waterStorageKey);
            if (savedWater) setWaterGlasses(Math.max(0, parseInt(savedWater, 10) || 0));

            // Eski günlerden kalan çerezleri temizleyerek hafıza şişmesini önle
            Object.keys(localStorage).forEach(k => {
                if ((k.startsWith('n1fit_diet_checks_') || k.startsWith('n1fit_diet_food_checks_') || k.startsWith('n1fit_water_glasses_')) && !k.endsWith(todayKey)) {
                    try { localStorage.removeItem(k); } catch (_) {}
                }
            });
        } catch (e) {
            console.error("LocalStorage okuma hatası:", e);
        }
    }, [storageKey, foodStorageKey, waterStorageKey, todayKey]);

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) return;
        api.get('/Member/my-diet')
            .then(res => setDietProgram(res.data || { targetCalories: null, meals: [] }))
            .catch(err => console.error("Diyet çekilemedi:", err));

        // Sunucudan bugünün verisini senkronize et
        api.get(`/Member/daily-tracking?date=${todayKey}`)
            .then(res => {
                if (res.data) {
                    const serverLog = res.data;
                    if (serverLog.waterGlasses != null && serverLog.waterGlasses > 0) {
                        setWaterGlasses(prev => {
                            const val = Math.max(prev, serverLog.waterGlasses);
                            try { localStorage.setItem(waterStorageKey, String(val)); } catch (_) {}
                            return val;
                        });
                    }
                    if (serverLog.completedMeals && Array.isArray(serverLog.completedMeals) && serverLog.completedMeals.length > 0) {
                        setCheckedMeals(prev => {
                            const updated = { ...prev };
                            serverLog.completedMeals.forEach(key => {
                                updated[key] = true;
                            });
                            try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch (_) {}
                            return updated;
                        });
                    }
                }
            })
            .catch(err => console.warn("Günlük takip bilgisi henüz yok veya okunamadı:", err));
    }, [todayKey, storageKey, waterStorageKey]);

    const getMealKey = (meal, index) => {
        return meal.id ? `id_${meal.id}` : `idx_${index}_${meal.mealName}`;
    };

    const getFoodKey = (meal, mealIndex, food, foodIndex) => {
        const mealKey = getMealKey(meal, mealIndex);
        return food.id ? `${mealKey}_food_${food.id}` : `${mealKey}_fidx_${foodIndex}_${food.foodName}`;
    };

    const saveChecksToStorage = (nextMeals, nextFoods) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(nextMeals));
            localStorage.setItem(foodStorageKey, JSON.stringify(nextFoods));
        } catch (e) {
            console.error("LocalStorage yazma hatası:", e);
        }
    };

    // Sunucuya anlık takip verisini senkronize eder (Push bildirim algoritmaları bu veriyi baz alır)
    const syncWithServer = (nextMeals, nextFoods, nextWater) => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) return;

        let totalCalories = 0;
        const completedMealsList = [];
        const programMeals = dietProgram.meals || [];

        programMeals.forEach((m, mIdx) => {
            const mKey = getMealKey(m, mIdx);
            const mealFoods = m.foods || [];

            if (mealFoods.length > 0) {
                let allChecked = true;
                mealFoods.forEach((f, fIdx) => {
                    const fKey = getFoodKey(m, mIdx, f, fIdx);
                    if (nextFoods[fKey]) {
                        totalCalories += (Number(f.calculatedCalories) || 0);
                    } else {
                        allChecked = false;
                    }
                });
                if (allChecked) {
                    completedMealsList.push(mKey);
                    if (m.mealName) completedMealsList.push(m.mealName);
                }
            } else {
                if (nextMeals[mKey]) {
                    totalCalories += (Number(m.calories) || 0);
                    completedMealsList.push(mKey);
                    if (m.mealName) completedMealsList.push(m.mealName);
                }
            }
        });

        api.post('/Member/daily-tracking/sync', {
            date: todayKey,
            waterGlasses: nextWater,
            consumedCalories: Math.round(totalCalories),
            completedMeals: completedMealsList
        }).catch(err => {
            console.warn("Sunucu takip eşitleme hatası:", err);
        });
    };

    const toggleFoodItem = (meal, mealIndex, food, foodIndex) => {
        const fKey = getFoodKey(meal, mealIndex, food, foodIndex);
        const nextFoods = {
            ...checkedFoods,
            [fKey]: !checkedFoods[fKey]
        };

        const mealFoods = meal.foods || [];
        const mKey = getMealKey(meal, mealIndex);
        const allFoodsNowChecked = mealFoods.length > 0 && mealFoods.every((f, idx) => !!nextFoods[getFoodKey(meal, mealIndex, f, idx)]);

        const nextMeals = {
            ...checkedMeals,
            [mKey]: allFoodsNowChecked
        };

        setCheckedFoods(nextFoods);
        setCheckedMeals(nextMeals);
        saveChecksToStorage(nextMeals, nextFoods);
        syncWithServer(nextMeals, nextFoods, waterGlasses);
    };

    const toggleMeal = (meal, mealIndex) => {
        const mKey = getMealKey(meal, mealIndex);
        const mealFoods = meal.foods || [];

        if (mealFoods.length > 0) {
            const allChecked = mealFoods.every((f, idx) => !!checkedFoods[getFoodKey(meal, mealIndex, f, idx)]);
            const targetState = !allChecked;
            const nextFoods = { ...checkedFoods };
            mealFoods.forEach((f, idx) => {
                nextFoods[getFoodKey(meal, mealIndex, f, idx)] = targetState;
            });
            const nextMeals = {
                ...checkedMeals,
                [mKey]: targetState
            };
            setCheckedFoods(nextFoods);
            setCheckedMeals(nextMeals);
            saveChecksToStorage(nextMeals, nextFoods);
            syncWithServer(nextMeals, nextFoods, waterGlasses);
        } else {
            const nextMeals = {
                ...checkedMeals,
                [mKey]: !checkedMeals[mKey]
            };
            setCheckedMeals(nextMeals);
            saveChecksToStorage(nextMeals, checkedFoods);
            syncWithServer(nextMeals, checkedFoods, waterGlasses);
        }
    };

    const updateWater = (delta) => {
        const nextVal = Math.max(0, Math.min(24, waterGlasses + delta));
        setWaterGlasses(nextVal);
        try {
            localStorage.setItem(waterStorageKey, String(nextVal));
        } catch (e) {
            console.error(e);
        }
        syncWithServer(checkedMeals, checkedFoods, nextVal);
    };

    const resetToday = () => {
        setCheckedMeals({});
        setCheckedFoods({});
        try {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(foodStorageKey);
        } catch (e) {
            console.error(e);
        }
        syncWithServer({}, {}, waterGlasses);
    };

    const meals = dietProgram.meals || [];

    if (meals.length === 0) {
        return (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: '50px', backgroundColor: '#111', padding: '40px', borderRadius: '12px', border: '1px solid #222' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🥗</div>
                <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Aktif Diyet Programın Bulunmamaktadır</h3>
                <p style={{ margin: 0, color: '#777' }}>Antrenörün senin için beslenme programı ve hedef kalori tanımladığında burada görünecektir.</p>
            </div>
        );
    }

    const totalMealsCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
    const targetCalories = dietProgram.targetCalories != null && dietProgram.targetCalories > 0
        ? Number(dietProgram.targetCalories)
        : totalMealsCalories;

    // Toplam planlanan makrolar ve besin bazlı tüketilen kalori/makro hesabı
    let consumedCalories = 0;
    let consumedProtein = 0;
    let consumedCarbs = 0;
    let consumedFat = 0;
    let totalPlannedProtein = 0;
    let totalPlannedCarbs = 0;
    let totalPlannedFat = 0;
    let completedMealCount = 0;
    let totalCheckableFoodsCount = 0;
    let checkedFoodsCount = 0;

    meals.forEach((m, mIdx) => {
        const mKey = getMealKey(m, mIdx);
        const mealFoods = m.foods || [];

        if (mealFoods.length > 0) {
            let allThisMealFoodsChecked = true;
            mealFoods.forEach((f, fIdx) => {
                totalCheckableFoodsCount += 1;
                const fCal = Number(f.calculatedCalories) || 0;
                const fProt = Number(f.calculatedProtein) || 0;
                const fCarbs = Number(f.calculatedCarbs) || 0;
                const fFat = Number(f.calculatedFat) || 0;

                totalPlannedProtein += fProt;
                totalPlannedCarbs += fCarbs;
                totalPlannedFat += fFat;

                const fKey = getFoodKey(m, mIdx, f, fIdx);
                if (checkedFoods[fKey]) {
                    checkedFoodsCount += 1;
                    consumedCalories += fCal;
                    consumedProtein += fProt;
                    consumedCarbs += fCarbs;
                    consumedFat += fFat;
                } else {
                    allThisMealFoodsChecked = false;
                }
            });
            if (allThisMealFoodsChecked) {
                completedMealCount += 1;
            }
        } else {
            if (checkedMeals[mKey]) {
                consumedCalories += (Number(m.calories) || 0);
                completedMealCount += 1;
            }
        }
    });

    consumedProtein = Number(consumedProtein.toFixed(1));
    consumedCarbs = Number(consumedCarbs.toFixed(1));
    consumedFat = Number(consumedFat.toFixed(1));
    totalPlannedProtein = Number(totalPlannedProtein.toFixed(1));
    totalPlannedCarbs = Number(totalPlannedCarbs.toFixed(1));
    totalPlannedFat = Number(totalPlannedFat.toFixed(1));

    const remainingCalories = targetCalories - consumedCalories;
    const allMealsCompleted = meals.length > 0 && completedMealCount === meals.length;
    const anyChecked = consumedCalories > 0 || completedMealCount > 0 || checkedFoodsCount > 0;
    const progressPct = targetCalories > 0
        ? Math.min(100, Math.max(0, Math.round((consumedCalories / targetCalories) * 100)))
        : (allMealsCompleted ? 100 : Math.round((completedMealCount / meals.length) * 100));

    // Durum mesajı ve renkleri
    let statusBanner = {
        bg: 'rgba(59, 130, 246, 0.12)',
        border: '#3b82f6',
        color: '#93c5fd',
        icon: '🔥',
        title: `Bugün Alman Gereken ${remainingCalories} kcal Kaldı`,
        desc: 'Öğünlerin içindeki besinleri yedikçe tek tek işaretleyebilir veya tüm öğünü tamamlayabilirsin.'
    };

    if (targetCalories > 0 && remainingCalories === 0 && allMealsCompleted) {
        statusBanner = {
            bg: 'rgba(74, 222, 128, 0.14)',
            border: '#4ade80',
            color: '#4ade80',
            icon: '🎉',
            title: 'Tebrikler! Bugünkü Hedef Kalorini ve Tüm Besinlerini Tamamladın!',
            desc: 'Kalan kalori 0 kcal. Günlük beslenme programını %100 başarıyla bitirdin.'
        };
    } else if (targetCalories > 0 && remainingCalories === 0) {
        statusBanner = {
            bg: 'rgba(74, 222, 128, 0.14)',
            border: '#4ade80',
            color: '#4ade80',
            icon: '✅',
            title: 'Harika! Bugünkü Hedef Kaloriye Tam Ulaştın (0 kcal Kaldı)',
            desc: 'Günlük kalori hedefini tam tutturdun.'
        };
    } else if (remainingCalories < 0) {
        statusBanner = {
            bg: 'rgba(217, 4, 41, 0.15)',
            border: '#d90429',
            color: '#fca5a5',
            icon: '⚠️',
            title: `Hedef Kaloriyi ${Math.abs(remainingCalories)} kcal Aştın (Fazla Kalori)`,
            desc: `Bugünkü hedef kalorin ${targetCalories} kcal idi, işaretlenen besinlerle ${consumedCalories} kcal alındı.`
        };
    } else if (allMealsCompleted && remainingCalories > 0) {
        statusBanner = {
            bg: 'rgba(245, 158, 11, 0.14)',
            border: '#f59e0b',
            color: '#fcd34d',
            icon: '⚡',
            title: `Tüm Öğünler Tamamlandı Ancak ${remainingCalories} kcal Eksik Kaldı`,
            desc: `Listedeki tüm besinleri tamamladın fakat günlük hedef kalorine (${targetCalories} kcal) göre ${remainingCalories} kcal açık var.`
        };
    } else if (targetCalories === 0 && allMealsCompleted) {
        statusBanner = {
            bg: 'rgba(74, 222, 128, 0.14)',
            border: '#4ade80',
            color: '#4ade80',
            icon: '🎉',
            title: 'Tebrikler! Bugünkü Tüm Öğünlerini Tamamladın!',
            desc: 'Listedeki bütün öğünleri başarıyla işaretledin.'
        };
    }

    return (
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            {/* SEGMENTED ALT SEKMELER */}
            <div style={{
                display: 'flex',
                gap: '10px',
                backgroundColor: '#111',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid #222',
                marginBottom: '25px'
            }}>
                <button
                    onClick={() => setActiveSubTab('tracker')}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        backgroundColor: activeSubTab === 'tracker' ? '#d90429' : 'transparent',
                        color: activeSubTab === 'tracker' ? 'white' : '#aaa'
                    }}
                >
                    🎯 Bugünkü Kalori & Besin Takibi
                </button>
                <button
                    onClick={() => setActiveSubTab('list')}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        backgroundColor: activeSubTab === 'list' ? '#3b82f6' : 'transparent',
                        color: activeSubTab === 'list' ? 'white' : '#aaa'
                    }}
                >
                    📋 Tam Diyet Listesi
                </button>
            </div>

            {activeSubTab === 'tracker' ? (
                <div>
                    {/* ÜST KALORİ ÖZET PANELİ */}
                    <div style={{
                        backgroundColor: '#111',
                        borderRadius: '12px',
                        padding: '22px',
                        border: '1px solid #252525',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    GÜNLÜK KALORİ & BESİN TAKİBİ • {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <h2 style={{ color: 'white', margin: '4px 0 0 0', fontSize: '1.35rem' }}>
                                    Bugünkü Beslenme Hedefin
                                </h2>
                            </div>
                            {anyChecked && (
                                <button
                                    onClick={resetToday}
                                    style={{
                                        backgroundColor: '#1f1f1f',
                                        color: '#aaa',
                                        border: '1px solid #333',
                                        padding: '7px 13px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    🔄 Bugünü Sıfırla
                                </button>
                            )}
                        </div>

                        {/* 3'LÜ KALORİ KARTLARI */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '14px',
                            marginBottom: '18px'
                        }}>
                            <div style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a2a', textAlign: 'center' }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>BUGÜNKÜ HEDEF KALORİ</div>
                                <div style={{ color: '#3b82f6', fontSize: '1.75rem', fontWeight: 'bold' }}>
                                    {targetCalories} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>kcal</span>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a2a', textAlign: 'center' }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>TAMAMLANAN (ALINAN)</div>
                                <div style={{ color: '#4ade80', fontSize: '1.75rem', fontWeight: 'bold' }}>
                                    {consumedCalories} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>kcal</span>
                                </div>
                                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>
                                    {totalCheckableFoodsCount > 0
                                        ? `${checkedFoodsCount} / ${totalCheckableFoodsCount} Besin • ${completedMealCount} / ${meals.length} Öğün`
                                        : `${completedMealCount} / ${meals.length} Öğün Tamamlandı`}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: '#181818',
                                padding: '16px',
                                borderRadius: '10px',
                                border: `1px solid ${remainingCalories === 0 ? '#4ade80' : remainingCalories < 0 ? '#d90429' : '#f59e0b'}`,
                                textAlign: 'center'
                            }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>
                                    {remainingCalories >= 0 ? 'KALAN KALORİ' : 'FAZLA ALINAN KALORİ'}
                                </div>
                                <div style={{
                                    color: remainingCalories === 0 ? '#4ade80' : remainingCalories < 0 ? '#d90429' : '#f59e0b',
                                    fontSize: '1.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    {remainingCalories >= 0 ? remainingCalories : `+${Math.abs(remainingCalories)}`}{' '}
                                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>kcal</span>
                                </div>
                            </div>
                        </div>

                        {/* CANLI MAKRO İLERLEME ÇUBUKLARI (PROTEİN / KARBONHİDRAT / YAĞ) */}
                        {(totalPlannedProtein > 0 || totalPlannedCarbs > 0 || totalPlannedFat > 0) && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '10px',
                                marginBottom: '18px',
                                backgroundColor: '#161616',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #262626'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                                        <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>🥩 Protein</span>
                                        <span style={{ color: '#ddd' }}><strong>{consumedProtein}g</strong> / {totalPlannedProtein}g</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', backgroundColor: '#262626', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${totalPlannedProtein > 0 ? Math.min(100, Math.round((consumedProtein / totalPlannedProtein) * 100)) : 0}%`,
                                            height: '100%',
                                            backgroundColor: '#ef4444',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                                        <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>🌾 Karbonhidrat</span>
                                        <span style={{ color: '#ddd' }}><strong>{consumedCarbs}g</strong> / {totalPlannedCarbs}g</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', backgroundColor: '#262626', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${totalPlannedCarbs > 0 ? Math.min(100, Math.round((consumedCarbs / totalPlannedCarbs) * 100)) : 0}%`,
                                            height: '100%',
                                            backgroundColor: '#3b82f6',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                                        <span style={{ color: '#fcd34d', fontWeight: 'bold' }}>🥑 Sağlıklı Yağ</span>
                                        <span style={{ color: '#ddd' }}><strong>{consumedFat}g</strong> / {totalPlannedFat}g</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', backgroundColor: '#262626', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${totalPlannedFat > 0 ? Math.min(100, Math.round((consumedFat / totalPlannedFat) * 100)) : 0}%`,
                                            height: '100%',
                                            backgroundColor: '#f59e0b',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* İLERLEME ÇUBUĞU */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#aaa', marginBottom: '6px' }}>
                                <span>Günlük Kalori Tamamlanma Oranı</span>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>%{progressPct}</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#222', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progressPct}%`,
                                    height: '100%',
                                    backgroundColor: remainingCalories === 0 && allMealsCompleted ? '#4ade80' : remainingCalories < 0 ? '#d90429' : '#3b82f6',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        {/* DURUM BANNERI */}
                        <div style={{
                            backgroundColor: statusBanner.bg,
                            border: `1px solid ${statusBanner.border}`,
                            borderRadius: '10px',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{ fontSize: '1.6rem' }}>{statusBanner.icon}</div>
                            <div>
                                <div style={{ color: statusBanner.color, fontWeight: 'bold', fontSize: '0.98rem' }}>
                                    {statusBanner.title}
                                </div>
                                <div style={{ color: '#ccc', fontSize: '0.85rem', marginTop: '3px' }}>
                                    {statusBanner.desc}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 💧 GÜNLÜK SU TAKİBİ WIDGET'I */}
                    <div style={{
                        backgroundColor: '#111',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        border: '1px solid #1e3a5f',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.25rem' }}>💧</span>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                                    Günlük Su Tüketimi: <span style={{ color: '#38bdf8' }}>{(waterGlasses * 0.25).toFixed(2)} Litre</span> ({waterGlasses} / {WATER_GOAL_GLASSES} Bardak)
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {Array.from({ length: WATER_GOAL_GLASSES }).map((_, gIdx) => {
                                    const filled = gIdx < waterGlasses;
                                    return (
                                        <span
                                            key={gIdx}
                                            onClick={() => updateWater(gIdx + 1 - waterGlasses)}
                                            title={`${(gIdx + 1) * 250} ml`}
                                            style={{
                                                cursor: 'pointer',
                                                fontSize: '1.1rem',
                                                opacity: filled ? 1 : 0.28,
                                                filter: filled ? 'drop-shadow(0 0 4px rgba(56,189,248,0.6))' : 'none',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            🥤
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => updateWater(-1)}
                                disabled={waterGlasses <= 0}
                                style={{
                                    backgroundColor: '#1a1a1a',
                                    color: '#aaa',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    cursor: waterGlasses <= 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                -1
                            </button>
                            <button
                                type="button"
                                onClick={() => updateWater(1)}
                                style={{
                                    backgroundColor: '#0284c7',
                                    color: 'white',
                                    border: '1px solid #38bdf8',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.86rem'
                                }}
                            >
                                💧 +1 Bardak Su (250ml)
                            </button>
                        </div>
                    </div>

                    {/* ÖĞÜN & BESİN İŞARETLEME LİSTESİ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {meals.map((meal, index) => {
                            const mKey = getMealKey(meal, index);
                            const mealFoods = meal.foods || [];
                            const hasStructuredFoods = mealFoods.length > 0;

                            const checkedFoodsInMeal = hasStructuredFoods
                                ? mealFoods.filter((f, fIdx) => !!checkedFoods[getFoodKey(meal, index, f, fIdx)])
                                : [];

                            const isMealCompleted = hasStructuredFoods
                                ? checkedFoodsInMeal.length === mealFoods.length
                                : !!checkedMeals[mKey];

                            const mealTotalCal = Number(meal.calories) || mealFoods.reduce((s, f) => s + (Number(f.calculatedCalories) || 0), 0);
                            const mealConsumedCal = hasStructuredFoods
                                ? checkedFoodsInMeal.reduce((s, f) => s + (Number(f.calculatedCalories) || 0), 0)
                                : (isMealCompleted ? mealTotalCal : 0);

                            return (
                                <div
                                    key={mKey}
                                    style={{
                                        backgroundColor: isMealCompleted ? 'rgba(74, 222, 128, 0.06)' : '#111',
                                        padding: '18px 20px',
                                        borderRadius: '12px',
                                        border: isMealCompleted ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid #222',
                                        borderLeft: isMealCompleted ? '5px solid #4ade80' : '5px solid #d90429',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* ÖĞÜN BAŞLIĞI VE TÜM ÖĞÜNÜ İŞARETLE BUTONU */}
                                    <div
                                        onClick={() => !hasStructuredFoods && toggleMeal(meal, index)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '12px',
                                            flexWrap: 'wrap',
                                            cursor: hasStructuredFoods ? 'default' : 'pointer',
                                            marginBottom: hasStructuredFoods ? '12px' : '0'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMeal(meal, index);
                                                }}
                                                title="Tüm öğünü işaretle / kaldır"
                                                style={{
                                                    width: '26px',
                                                    height: '26px',
                                                    minWidth: '26px',
                                                    borderRadius: '6px',
                                                    border: isMealCompleted ? '2px solid #4ade80' : '2px solid #555',
                                                    backgroundColor: isMealCompleted ? '#4ade80' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#000',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {isMealCompleted ? '✓' : ''}
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                    <h3 style={{
                                                        color: isMealCompleted ? '#86efac' : 'white',
                                                        margin: 0,
                                                        fontSize: '1.1rem',
                                                        textDecoration: isMealCompleted ? 'line-through' : 'none'
                                                    }}>
                                                        {meal.mealName}
                                                    </h3>
                                                    <span style={{
                                                        fontSize: '0.82rem',
                                                        color: '#aaa',
                                                        backgroundColor: '#1f1f1f',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        🕒 {meal.time || "Saat Belirtilmemiş"}
                                                    </span>
                                                </div>
                                                {!hasStructuredFoods && meal.content && (
                                                    <div style={{
                                                        color: isMealCompleted ? '#777' : '#bbb',
                                                        whiteSpace: 'pre-wrap',
                                                        lineHeight: '1.5',
                                                        fontSize: '0.95rem',
                                                        marginTop: '6px'
                                                    }}>
                                                        🥩 {meal.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* SAĞ TARAF ÖĞÜN KALORİ & HIZLI TOGGLE */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {hasStructuredFoods && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMeal(meal, index)}
                                                    style={{
                                                        backgroundColor: isMealCompleted ? 'rgba(74, 222, 128, 0.15)' : '#1c1c1c',
                                                        color: isMealCompleted ? '#4ade80' : '#ccc',
                                                        border: isMealCompleted ? '1px solid #4ade80' : '1px solid #333',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.76rem',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {isMealCompleted ? '✓ Tüm Öğün Tamam' : 'Tümünü İşaretle'}
                                                </button>
                                            )}
                                            <div style={{
                                                backgroundColor: isMealCompleted ? 'rgba(74, 222, 128, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                                                color: isMealCompleted ? '#4ade80' : '#f59e0b',
                                                border: `1px solid ${isMealCompleted ? '#4ade80' : '#f59e0b'}`,
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontWeight: 'bold',
                                                fontSize: '0.88rem',
                                                textAlign: 'right'
                                            }}>
                                                {hasStructuredFoods
                                                    ? `${mealConsumedCal} / ${mealTotalCal} kcal`
                                                    : (mealTotalCal > 0 ? `${mealTotalCal} kcal` : 'Kalori Yok')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ÖĞÜN İÇİNDEKİ BESİNLERİ TEK TEK İŞARETLEME LİSTESİ */}
                                    {hasStructuredFoods && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                            {mealFoods.map((food, fIdx) => {
                                                const fKey = getFoodKey(meal, index, food, fIdx);
                                                const isFoodChecked = !!checkedFoods[fKey];

                                                return (
                                                    <div
                                                        key={fKey}
                                                        onClick={() => toggleFoodItem(meal, index, food, fIdx)}
                                                        style={{
                                                            backgroundColor: isFoodChecked ? 'rgba(74, 222, 128, 0.1)' : '#181818',
                                                            border: isFoodChecked ? '1px solid rgba(74, 222, 128, 0.45)' : '1px solid #2b2b2b',
                                                            borderRadius: '8px',
                                                            padding: '10px 14px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '22px',
                                                                height: '22px',
                                                                minWidth: '22px',
                                                                borderRadius: '5px',
                                                                border: isFoodChecked ? '2px solid #4ade80' : '2px solid #666',
                                                                backgroundColor: isFoodChecked ? '#4ade80' : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#000',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                {isFoodChecked ? '✓' : ''}
                                                            </div>
                                                            <div>
                                                                <div style={{
                                                                    color: isFoodChecked ? '#86efac' : 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.94rem',
                                                                    textDecoration: isFoodChecked ? 'line-through' : 'none'
                                                                }}>
                                                                    {food.foodName} {food.brand ? <span style={{ color: '#888', fontWeight: 'normal', fontSize: '0.8rem' }}>({food.brand})</span> : null}
                                                                </div>
                                                                <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '2px' }}>
                                                                    Miktar: <strong style={{ color: '#4ade80' }}>{food.amount} {food.unit}</strong> • 🥩 {food.calculatedProtein}g P · 🌾 {food.calculatedCarbs}g K · 🥑 {food.calculatedFat}g Y
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                            <span style={{
                                                                backgroundColor: isFoodChecked ? 'rgba(74, 222, 128, 0.2)' : '#222',
                                                                color: isFoodChecked ? '#4ade80' : '#fcd34d',
                                                                padding: '4px 9px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.82rem',
                                                                fontWeight: 'bold',
                                                                border: isFoodChecked ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid #333'
                                                            }}>
                                                                {isFoodChecked ? `-${food.calculatedCalories} kcal ✓` : `🔥 ${food.calculatedCalories} kcal`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* ÖĞÜN NOTU VARSA */}
                                    {hasStructuredFoods && meal.content && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '8px 12px',
                                            backgroundColor: '#161616',
                                            borderRadius: '6px',
                                            borderLeft: '3px solid #3b82f6',
                                            color: '#bbb',
                                            fontSize: '0.85rem'
                                        }}>
                                            📝 <strong>Antrenör Notu:</strong> {meal.content}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* TAM DİYET LİSTESİ ALT SEKMESİ */
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        borderBottom: '2px solid #333',
                        paddingBottom: '12px',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ color: '#3b82f6', margin: 0, fontSize: '1.3rem' }}>BESLENME PROGRAMIN (TAM LİSTE)</h2>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {targetCalories > 0 && (
                                <span style={{ backgroundColor: '#181818', border: '1px solid #3b82f6', color: '#93c5fd', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    🎯 Hedef: {targetCalories} kcal
                                </span>
                            )}
                            <span style={{ backgroundColor: '#181818', border: '1px solid #333', color: '#ddd', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                🔥 Öğünler Toplamı: {totalMealsCalories} kcal
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {meals.map((meal, index) => {
                            const mealFoods = meal.foods || [];
                            return (
                                <div key={index} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ color: 'white', marginTop: 0, marginBottom: '10px' }}>
                                            {meal.mealName}{' '}
                                            <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>
                                                ({meal.time || "Saat Belirtilmemiş"})
                                            </span>
                                        </h3>

                                        {mealFoods.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: meal.content ? '10px' : '0' }}>
                                                {mealFoods.map((f, fIdx) => (
                                                    <div key={fIdx} style={{ backgroundColor: '#181818', padding: '8px 12px', borderRadius: '6px', border: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                        <span style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>
                                                            🥗 <strong>{f.foodName}</strong> {f.brand ? <span style={{ color: '#888', fontSize: '0.8rem' }}>({f.brand})</span> : null} — <strong style={{ color: '#4ade80' }}>{f.amount} {f.unit}</strong>
                                                        </span>
                                                        <span style={{ color: '#fcd34d', fontSize: '0.82rem', fontWeight: 'bold' }}>
                                                            🔥 {f.calculatedCalories} kcal | 🥩 {f.calculatedProtein}g P · 🌾 {f.calculatedCarbs}g K · 🥑 {f.calculatedFat}g Y
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {meal.content && (
                                            <div style={{ color: '#aaa', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                                {mealFoods.length > 0 ? `📝 Not: ${meal.content}` : `🥩 ${meal.content}`}
                                            </div>
                                        )}
                                    </div>
                                    {meal.calories != null && meal.calories > 0 && (
                                        <div style={{
                                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                            border: '1px solid #3b82f6',
                                            color: '#60a5fa',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            🔥 {meal.calories} kcal
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietTab;
