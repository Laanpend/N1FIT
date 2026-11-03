import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Clock, Dumbbell, Plus } from 'lucide-react';
import { tdee } from 'health-fitness-formulas';
import api from '../api/axiosConfig';

const INITIAL_MEAS_FORM = {
    weight: '',
    shoulder: '',
    chest: '',
    leftArm: '',
    rightArm: '',
    waist: '',
    neck: '',
    hips: '',
    rightLeg: '',
    leftLeg: ''
};

const GOAL_OPTIONS = [
    { key: 'lose', label: '🔥 Kilo Vermek (Yağ Yakımı)', delta: -450, desc: 'TDEE üzerinden -450 kcal kalori açığı' },
    { key: 'fit', label: '⚡ Fitleşmek / Sıkılaşmak (Recomp)', delta: -200, desc: 'TDEE üzerinden -200 kcal hafif açık' },
    { key: 'maintain', label: '⚖️ Formu Korumak (Kilo Sabitleme)', delta: 0, desc: 'Günlük harcanan enerjiye (TDEE) eşit' },
    { key: 'muscle', label: '💪 Kas Kazanmak (Lean Bulk)', delta: 300, desc: 'TDEE üzerine +300 kcal temiz kalori fazlası' },
    { key: 'gain', label: '🚀 Kilo Almak (Hacim Kazanma)', delta: 500, desc: 'TDEE üzerine +500 kcal kalori fazlası' }
];

const ACTIVITY_OPTIONS = [
    { key: 'sedentary', label: 'Masa Başı / Hareketsiz (1.2x)' },
    { key: 'light', label: 'Hafif Aktif - Haftada 1-2 Antrenman (1.375x)' },
    { key: 'moderate', label: 'Orta Aktif - Haftada 3-4 Antrenman (1.55x)' },
    { key: 'active', label: 'Çok Aktif - Haftada 5-6 Antrenman (1.725x)' },
    { key: 'veryActive', label: 'Profesyonel / Ağır Fiziksel İş (1.9x)' }
];

const FOOD_CATEGORIES = ['Tümü', 'Protein', 'Karbonhidrat', 'Kahvaltılık', 'Sağlıklı Yağ', 'Meyve & Sebze', 'Supplement'];

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
    const [measForm, setMeasForm] = useState(INITIAL_MEAS_FORM);
    const [dietForm, setDietForm] = useState({ mealName: '', time: '', content: '', calories: '', foods: [] });
    const [allExercises, setAllExercises] = useState([]);

    // BESİN ARAMA & OPEN FOOD FACTS POP-UP STATELERİ
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [foodModalTab, setFoodModalTab] = useState('search'); // 'search' | 'custom'
    const [foodSearchQuery, setFoodSearchQuery] = useState('');
    const [selectedFoodCategory, setSelectedFoodCategory] = useState('Tümü');
    const [foodResults, setFoodResults] = useState([]);
    const [loadingFoods, setLoadingFoods] = useState(false);
    const [searchingExternal, setSearchingExternal] = useState(false);
    const [selectedFoodItem, setSelectedFoodItem] = useState(null);
    const [portionAmount, setPortionAmount] = useState('100');
    const [portionUnitType, setPortionUnitType] = useState('gram'); // 'gram' | 'default' | 'spoon' | 'scoop' | 'slice' | 'bowl'

    // ÖZEL BESİN TANIMLAMA FORMU
    const [customFoodForm, setCustomFoodForm] = useState({
        name: '',
        brand: '',
        category: 'Protein',
        caloriesPer100g: '',
        proteinPer100g: '',
        carbsPer100g: '',
        fatPer100g: '',
        defaultUnit: 'Gram',
        defaultWeightGrams: '100'
    });
    const [savingCustomFood, setSavingCustomFood] = useState(false);

    // KALORİ HESAPLAMA POP-UP STATELERİ
    const [showCalorieModal, setShowCalorieModal] = useState(false);
    const [calorieForm, setCalorieForm] = useState({
        gender: 'male',
        age: '',
        height: '',
        weight: '',
        activity: 'moderate',
        goal: 'lose'
    });
    const [customTargetInput, setCustomTargetInput] = useState('');
    const [savingTargetCalories, setSavingTargetCalories] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
            fetchExercises();
            fetchWorkoutProgram();
        }
    }, [id]);

    const fetchExercises = async () => {
        try {
            const res = await api.get('/Admin/exercises');
            setAllExercises(res.data || []);
        } catch (err) { console.error("Kütüphane çekilirken hata:", err); }
    };

    const loadData = async () => {
        try {
            const res = await api.get(`/Admin/member-detail/${id}`);
            setMember(res.data);
            setMeasurements(res.data.measurements || []);
            setDiets(res.data.diets || []);
        } catch (err) { console.error("Genel veri çekme hatası:", err); }
    };

    const fetchWorkoutProgram = async () => {
        try {
            const res = await api.get(`/Admin/members/${id}/workout-program`);
            if (res.data && res.data.days) setWorkoutProgram(res.data);
        } catch (err) { console.error("Antrenman çekilirken hata:", err); }
    };

    // ==========================================
    // KALORİ HESAPLAMA POP-UP OPERASYONLARI
    // ==========================================
    const openCalorieCalculatorModal = () => {
        const latestWeight = measurements && measurements.length > 0 ? measurements[0].weight : '';
        const initGender = member?.gender && String(member.gender).toLowerCase() === 'female' ? 'female' : 'male';
        const initAge = member?.age || 25;
        const initHeight = member?.height || 175;
        const initWeight = latestWeight || 75;

        setCalorieForm({
            gender: initGender,
            age: initAge,
            height: initHeight,
            weight: initWeight,
            activity: 'moderate',
            goal: 'lose'
        });
        setCustomTargetInput('');
        setShowCalorieModal(true);
    };

    const computeCalorieFormula = () => {
        const ageNum = Number(calorieForm.age);
        const heightNum = Number(calorieForm.height);
        const weightNum = Number(calorieForm.weight);

        if (!ageNum || ageNum < 10 || ageNum > 100 || !heightNum || heightNum < 100 || heightNum > 250 || !weightNum || weightNum < 25 || weightNum > 300) {
            return null;
        }

        try {
            const res = tdee({
                sex: calorieForm.gender === 'female' ? 'female' : 'male',
                kg: weightNum,
                cm: heightNum,
                age: ageNum,
                activity: calorieForm.activity
            });
            const selectedGoal = GOAL_OPTIONS.find(g => g.key === calorieForm.goal) || GOAL_OPTIONS[0];
            const recommended = Math.max(1000, Math.round(res.tdee + selectedGoal.delta));
            return {
                bmr: res.bmr,
                tdee: res.tdee,
                recommended,
                goalLabel: selectedGoal.label,
                delta: selectedGoal.delta
            };
        } catch (err) {
            console.error("Kalori hesaplama hatası:", err);
            return null;
        }
    };

    const formulaResult = computeCalorieFormula();
    const effectiveModalCalories = customTargetInput !== '' ? parseInt(customTargetInput, 10) : (formulaResult?.recommended || 0);

    const handleSaveTargetCalories = async () => {
        if (!effectiveModalCalories || effectiveModalCalories < 500) {
            alert("Lütfen geçerli bir hedef kalori değeri hesaplayın veya girin!");
            return;
        }
        setSavingTargetCalories(true);
        try {
            await api.post(`/Admin/member/${id}/target-calories`, {
                targetCalories: effectiveModalCalories,
                age: Number(calorieForm.age) || null,
                height: Number(calorieForm.height) || null,
                gender: calorieForm.gender
            });
            await loadData();
            setShowCalorieModal(false);
        } catch (err) {
            console.error("Hedef kalori kaydedilirken hata:", err);
            alert("Hedef kalori kaydedilirken hata oluştu!");
        } finally {
            setSavingTargetCalories(false);
        }
    };

    // ==========================================
    // ÖLÇÜ (MEASUREMENT) OPERASYONLARI
    // ==========================================
    const handleEditMeasurement = (measurement) => {
        setEditingMeasurement(measurement);
        setMeasForm({
            weight: measurement.weight ?? '',
            shoulder: measurement.shoulder ?? '',
            chest: measurement.chest ?? '',
            leftArm: measurement.leftArm ?? '',
            rightArm: measurement.rightArm ?? '',
            waist: measurement.waist ?? '',
            neck: measurement.neck ?? '',
            hips: measurement.hips ?? '',
            rightLeg: measurement.rightLeg ?? '',
            leftLeg: measurement.leftLeg ?? ''
        });
    };

    const toOptionalFloat = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
    };

    const handleAddMeasurement = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                weight: parseFloat(measForm.weight) || 0,
                shoulder: parseFloat(measForm.shoulder) || 0,
                chest: parseFloat(measForm.chest) || 0,
                leftArm: parseFloat(measForm.leftArm) || 0,
                rightArm: parseFloat(measForm.rightArm) || 0,
                waist: parseFloat(measForm.waist) || 0,
                neck: parseFloat(measForm.neck) || 0,
                hips: toOptionalFloat(measForm.hips),
                rightLeg: toOptionalFloat(measForm.rightLeg),
                leftLeg: toOptionalFloat(measForm.leftLeg)
            };

            if (editingMeasurement) {
                const targetId = editingMeasurement.id || editingMeasurement.Id;
                await api.put(`/Admin/measurements/${targetId}`, payload);
                alert("Ölçüler güncellendi!");
                setEditingMeasurement(null);
            } else {
                await api.post(`/Admin/member/${id}/measurements`, payload);
                alert("Yeni ölçüler kaydedildi!");
            }
            setMeasForm(INITIAL_MEAS_FORM);
            loadData();
        } catch (err) {
            console.error(err);
            alert("Ölçü kaydedilirken bir hata oluştu!");
        }
    };

    const handleDeleteMeasurement = async (measurementId) => {
        if (window.confirm("Bu ölçüyü silmek istediğinize emin misiniz?")) {
            try {
                await api.delete(`/Admin/measurements/${measurementId}`);
                alert("Ölçü silindi!");
                loadData();
            } catch (err) { console.error("Ölçü silinirken hata:", err); }
        }
    };

    // ==========================================
    // BESLENME (DIET) & BESİN KÜTÜPHANESİ OPERASYONLARI
    // ==========================================
    const searchFoods = async (queryText = foodSearchQuery, categoryText = selectedFoodCategory, includeExternal = false) => {
        if (includeExternal) {
            setSearchingExternal(true);
        } else {
            setLoadingFoods(true);
        }
        try {
            const params = new URLSearchParams();
            if (queryText && queryText.trim()) params.append('q', queryText.trim());
            if (categoryText && categoryText !== 'Tümü') params.append('category', categoryText);
            if (includeExternal) params.append('external', 'true');

            const res = await api.get(`/Admin/foods/search?${params.toString()}`);
            setFoodResults(res.data || []);
        } catch (err) {
            console.error("Besin arama hatası:", err);
        } finally {
            setLoadingFoods(false);
            setSearchingExternal(false);
        }
    };

    const openFoodPickerModal = () => {
        setShowFoodModal(true);
        setFoodModalTab('search');
        setSelectedFoodItem(null);
        searchFoods(foodSearchQuery, selectedFoodCategory, false);
    };

    const handleSelectFoodForPortion = (food) => {
        setSelectedFoodItem(food);
        const defUnit = food.defaultUnit || 'Gram';
        const defWeight = Number(food.defaultWeightGrams) || 100;
        if (defUnit.toLowerCase() !== 'gram' && defWeight > 0 && defWeight !== 100) {
            setPortionUnitType('default');
            setPortionAmount('1');
        } else {
            setPortionUnitType('gram');
            setPortionAmount('100');
        }
    };

    const getPortionUnitConfig = (food, unitType) => {
        const defUnit = food?.defaultUnit || 'Adet (50g)';
        const defWeight = Number(food?.defaultWeightGrams) > 0 ? Number(food.defaultWeightGrams) : 100;
        switch (unitType) {
            case 'default':
                return { label: defUnit, gramsPerUnit: defWeight, isGram: false };
            case 'spoon':
                return { label: 'Yemek Kaşığı (10g)', gramsPerUnit: 10, isGram: false };
            case 'scoop':
                return { label: 'Ölçek (30g)', gramsPerUnit: 30, isGram: false };
            case 'slice':
                return { label: 'Dilim (25g)', gramsPerUnit: 25, isGram: false };
            case 'bowl':
                return { label: 'Kase / Bardak (200g)', gramsPerUnit: 200, isGram: false };
            case 'gram':
            default:
                return { label: 'Gram', gramsPerUnit: 1, isGram: true };
        }
    };

    const computeSelectedPortionMacros = () => {
        if (!selectedFoodItem) return { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0, unitLabel: 'Gram' };
        const amt = Math.max(0, parseFloat(portionAmount) || 0);
        const unitCfg = getPortionUnitConfig(selectedFoodItem, portionUnitType);
        const totalGrams = unitCfg.isGram ? amt : amt * unitCfg.gramsPerUnit;
        const ratio = totalGrams / 100.0;

        return {
            calories: Math.round((Number(selectedFoodItem.caloriesPer100g) || 0) * ratio),
            protein: Number(((Number(selectedFoodItem.proteinPer100g) || 0) * ratio).toFixed(1)),
            carbs: Number(((Number(selectedFoodItem.carbsPer100g) || 0) * ratio).toFixed(1)),
            fat: Number(((Number(selectedFoodItem.fatPer100g) || 0) * ratio).toFixed(1)),
            totalGrams: Math.round(totalGrams),
            unitLabel: unitCfg.label
        };
    };

    const handleAddFoodToMealForm = async () => {
        if (!selectedFoodItem) return;
        const amt = parseFloat(portionAmount);
        if (!amt || amt <= 0) {
            alert("Lütfen geçerli bir miktar girin!");
            return;
        }

        const calc = computeSelectedPortionMacros();
        let foodId = selectedFoodItem.id && selectedFoodItem.id > 0 ? selectedFoodItem.id : null;

        // Eğer Open Food Facts'ten ilk kez seçiliyorsa hemen veritabanımıza önbellekle (Auto-Cache)
        if (!foodId) {
            try {
                const cacheRes = await api.post('/Admin/foods/cache', {
                    name: selectedFoodItem.name,
                    brand: selectedFoodItem.brand,
                    category: selectedFoodItem.category || 'Genel',
                    caloriesPer100g: Number(selectedFoodItem.caloriesPer100g) || 0,
                    proteinPer100g: Number(selectedFoodItem.proteinPer100g) || 0,
                    carbsPer100g: Number(selectedFoodItem.carbsPer100g) || 0,
                    fatPer100g: Number(selectedFoodItem.fatPer100g) || 0,
                    defaultUnit: selectedFoodItem.defaultUnit || 'Gram',
                    defaultWeightGrams: Number(selectedFoodItem.defaultWeightGrams) || 100,
                    source: selectedFoodItem.source || 'OpenFoodFacts',
                    externalApiId: selectedFoodItem.externalApiId || null
                });
                if (cacheRes.data && cacheRes.data.id) {
                    foodId = cacheRes.data.id;
                }
            } catch (err) {
                console.warn("Önbellekleme öğün kaydında tamamlanacak:", err);
            }
        }

        const newMealFood = {
            foodId: foodId,
            foodName: selectedFoodItem.name,
            brand: selectedFoodItem.brand || '',
            category: selectedFoodItem.category || 'Genel',
            amount: amt,
            unit: calc.unitLabel,
            calculatedCalories: calc.calories,
            calculatedProtein: calc.protein,
            calculatedCarbs: calc.carbs,
            calculatedFat: calc.fat,
            caloriesPer100g: Number(selectedFoodItem.caloriesPer100g) || 0,
            proteinPer100g: Number(selectedFoodItem.proteinPer100g) || 0,
            carbsPer100g: Number(selectedFoodItem.carbsPer100g) || 0,
            fatPer100g: Number(selectedFoodItem.fatPer100g) || 0,
            defaultUnit: selectedFoodItem.defaultUnit || 'Gram',
            defaultWeightGrams: Number(selectedFoodItem.defaultWeightGrams) || 100,
            source: selectedFoodItem.source || 'System',
            externalApiId: selectedFoodItem.externalApiId || null
        };

        const updatedFoods = [...(dietForm.foods || []), newMealFood];
        const sumCalories = updatedFoods.reduce((s, f) => s + (Number(f.calculatedCalories) || 0), 0);

        setDietForm({
            ...dietForm,
            foods: updatedFoods,
            calories: String(sumCalories)
        });
        setSelectedFoodItem(null);
        setShowFoodModal(false);
    };

    const handleRemoveFoodFromMealForm = (indexToRemove) => {
        const updatedFoods = (dietForm.foods || []).filter((_, idx) => idx !== indexToRemove);
        const sumCalories = updatedFoods.reduce((s, f) => s + (Number(f.calculatedCalories) || 0), 0);
        setDietForm({
            ...dietForm,
            foods: updatedFoods,
            calories: updatedFoods.length > 0 ? String(sumCalories) : dietForm.calories
        });
    };

    const handleCreateCustomFood = async (e) => {
        e.preventDefault();
        if (!customFoodForm.name || !customFoodForm.name.trim()) {
            alert("Besin adı zorunludur!");
            return;
        }
        setSavingCustomFood(true);
        try {
            const res = await api.post('/Admin/foods', {
                name: customFoodForm.name.trim(),
                brand: customFoodForm.brand?.trim() || 'Özel',
                category: customFoodForm.category || 'Genel',
                caloriesPer100g: parseFloat(customFoodForm.caloriesPer100g) || 0,
                proteinPer100g: parseFloat(customFoodForm.proteinPer100g) || 0,
                carbsPer100g: parseFloat(customFoodForm.carbsPer100g) || 0,
                fatPer100g: parseFloat(customFoodForm.fatPer100g) || 0,
                defaultUnit: customFoodForm.defaultUnit || 'Gram',
                defaultWeightGrams: parseFloat(customFoodForm.defaultWeightGrams) || 100,
                source: 'Custom'
            });
            const created = res.data;
            setCustomFoodForm({
                name: '',
                brand: '',
                category: 'Protein',
                caloriesPer100g: '',
                proteinPer100g: '',
                carbsPer100g: '',
                fatPer100g: '',
                defaultUnit: 'Gram',
                defaultWeightGrams: '100'
            });
            setFoodModalTab('search');
            await searchFoods(created.name, 'Tümü', false);
            handleSelectFoodForPortion(created);
        } catch (err) {
            console.error("Özel besin ekleme hatası:", err);
            alert("Özel besin kaydedilirken hata oluştu!");
        } finally {
            setSavingCustomFood(false);
        }
    };

    const handleEditDiet = (diet) => {
        setEditingDiet(diet);
        const existingFoods = (diet.foods || diet.Foods || []).map(f => ({
            id: f.id || f.Id,
            foodId: f.foodId || f.FoodId,
            foodName: f.foodName || f.FoodName,
            brand: f.brand || f.Brand || '',
            amount: f.amount || f.Amount || 100,
            unit: f.unit || f.Unit || 'Gram',
            calculatedCalories: f.calculatedCalories ?? f.CalculatedCalories ?? 0,
            calculatedProtein: f.calculatedProtein ?? f.CalculatedProtein ?? 0,
            calculatedCarbs: f.calculatedCarbs ?? f.CalculatedCarbs ?? 0,
            calculatedFat: f.calculatedFat ?? f.CalculatedFat ?? 0
        }));
        setDietForm({
            mealName: diet.mealName || '',
            time: diet.time || '',
            content: diet.content || '',
            calories: diet.calories != null ? String(diet.calories) : '',
            foods: existingFoods
        });
    };

    const handleAddDiet = async (e) => {
        e.preventDefault();
        if ((!dietForm.foods || dietForm.foods.length === 0) && (!dietForm.content || !dietForm.content.trim())) {
            alert("Lütfen öğüne en az bir besin ekleyin veya öğün notu yazın!");
            return;
        }
        try {
            const foodsSum = (dietForm.foods || []).reduce((s, f) => s + (Number(f.calculatedCalories) || 0), 0);
            const explicitCalories = dietForm.calories !== '' && dietForm.calories != null ? parseInt(dietForm.calories, 10) : null;

            const payload = {
                mealName: dietForm.mealName,
                time: dietForm.time,
                content: dietForm.content || '',
                calories: explicitCalories != null ? explicitCalories : (foodsSum > 0 ? foodsSum : null),
                foods: dietForm.foods || []
            };

            if (editingDiet) {
                const targetId = editingDiet.id || editingDiet.Id;
                await api.put(`/Admin/diet/${targetId}`, payload);
                alert("Öğün güncellendi!");
                setEditingDiet(null);
            } else {
                await api.post(`/Admin/member/${id}/diet`, payload);
                alert("Öğün listeye eklendi!");
            }
            setDietForm({ mealName: '', time: '', content: '', calories: '', foods: [] });
            loadData();
        } catch (err) { alert("Diyet işleminde hata oluştu!"); }
    };

    const handleDeleteDiet = async (dietId) => {
        if (window.confirm("Bu öğünü listeden çıkarmak istediğinize emin misiniz?")) {
            try {
                await api.delete(`/Admin/diet/${dietId}`);
                alert("Öğün silindi!");
                loadData();
            } catch (err) { console.error("Diyet silinirken hata:", err); }
        }
    };

    const autoSaveWorkout = async (daysArray) => {
        try {
            const payload = {
                days: daysArray.map(d => ({
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
        } catch (err) {
            console.error(err);
            alert("Antrenman programı kaydedilirken hata oluştu!");
        }
    };

    if (!member) return <div style={{ color: 'white', padding: '50px' }}>Üye aranıyor...</div>;

    // isNegativeBad = true ise: azalma YEŞİL (#4ade80), artma KIRMIZI (#d90429)
    const getDiff = (current, older, isNegativeBad = false) => {
        if (current == null || older == null || current === '' || older === '') return null;
        const diff = parseFloat((Number(current) - Number(older)).toFixed(1));
        if (isNaN(diff) || diff === 0) return null;
        const isPos = diff > 0;
        const color = isNegativeBad ? (isPos ? '#d90429' : '#4ade80') : (isPos ? '#4ade80' : '#d90429');
        return <span style={{ color: color, fontSize: '0.8rem', marginLeft: '6px', fontWeight: 'bold' }}>({isPos ? '+' : ''}{diff})</span>;
    };

    // Kalori ve Makro karşılaştırma hesaplamaları
    const totalMealCalories = diets.reduce((sum, d) => sum + (Number(d.calories) || 0), 0);
    const totalDailyProtein = Number(diets.reduce((sum, d) => {
        const mealFoods = d.foods || d.Foods || [];
        return sum + mealFoods.reduce((fs, f) => fs + (Number(f.calculatedProtein ?? f.CalculatedProtein) || 0), 0);
    }, 0).toFixed(1));
    const totalDailyCarbs = Number(diets.reduce((sum, d) => {
        const mealFoods = d.foods || d.Foods || [];
        return sum + mealFoods.reduce((fs, f) => fs + (Number(f.calculatedCarbs ?? f.CalculatedCarbs) || 0), 0);
    }, 0).toFixed(1));
    const totalDailyFat = Number(diets.reduce((sum, d) => {
        const mealFoods = d.foods || d.Foods || [];
        return sum + mealFoods.reduce((fs, f) => fs + (Number(f.calculatedFat ?? f.CalculatedFat) || 0), 0);
    }, 0).toFixed(1));

    const currentFormProtein = Number((dietForm.foods || []).reduce((s, f) => s + (Number(f.calculatedProtein) || 0), 0).toFixed(1));
    const currentFormCarbs = Number((dietForm.foods || []).reduce((s, f) => s + (Number(f.calculatedCarbs) || 0), 0).toFixed(1));
    const currentFormFat = Number((dietForm.foods || []).reduce((s, f) => s + (Number(f.calculatedFat) || 0), 0).toFixed(1));
    const selectedPortionCalc = computeSelectedPortionMacros();

    const targetCalories = member.targetCalories != null && member.targetCalories > 0 ? Number(member.targetCalories) : null;
    const calorieDiff = targetCalories != null ? totalMealCalories - targetCalories : null;

    let calorieStatus = null;
    if (targetCalories != null) {
        if (calorieDiff === 0) {
            calorieStatus = {
                bg: 'rgba(74, 222, 128, 0.12)',
                border: '#4ade80',
                color: '#4ade80',
                badge: '✅ TAM EŞİTLENDİ',
                text: `Öğünlerin toplam kalorisi hedef kaloriyi tam karşılıyor (${totalMealCalories} / ${targetCalories} kcal).`
            };
        } else if (calorieDiff < 0) {
            calorieStatus = {
                bg: 'rgba(245, 158, 11, 0.12)',
                border: '#f59e0b',
                color: '#fcd34d',
                badge: `⚠️ ${Math.abs(calorieDiff)} kcal EKSİK`,
                text: `Hedef kaloriye ulaşmak için ${Math.abs(calorieDiff)} kcal daha eklenmeli (Eklenen: ${totalMealCalories} / Hedef: ${targetCalories} kcal).`
            };
        } else {
            calorieStatus = {
                bg: 'rgba(217, 4, 41, 0.14)',
                border: '#d90429',
                color: '#fca5a5',
                badge: `🚨 ${calorieDiff} kcal FAZLA`,
                text: `Öğünlerin toplamı hedef kaloriyi ${calorieDiff} kcal aşıyor (Eklenen: ${totalMealCalories} / Hedef: ${targetCalories} kcal).`
            };
        }
    }

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
                                <input style={styles.input} type="number" step="0.1" placeholder="Kilo" value={measForm.weight} onChange={e => setMeasForm({ ...measForm, weight: e.target.value })} required />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Omuz" value={measForm.shoulder} onChange={e => setMeasForm({ ...measForm, shoulder: e.target.value })} required />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Göğüs" value={measForm.chest} onChange={e => setMeasForm({ ...measForm, chest: e.target.value })} required />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Sol Kol (L)" value={measForm.leftArm} onChange={e => setMeasForm({ ...measForm, leftArm: e.target.value })} required />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Sağ Kol (R)" value={measForm.rightArm} onChange={e => setMeasForm({ ...measForm, rightArm: e.target.value })} required />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Bel" value={measForm.waist} onChange={e => setMeasForm({ ...measForm, waist: e.target.value })} required />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Boyun" value={measForm.neck} onChange={e => setMeasForm({ ...measForm, neck: e.target.value })} required />
                                </div>
                                {/* İSTEĞE BAĞLI (ZORUNLU OLMAYAN) ÖLÇÜLER: KALÇA, SAĞ BACAK, SOL BACAK */}
                                <input style={styles.input} type="number" step="0.1" placeholder="Kalça (İsteğe Bağlı)" value={measForm.hips} onChange={e => setMeasForm({ ...measForm, hips: e.target.value })} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={styles.input} type="number" step="0.1" placeholder="Sağ Bacak (İsteğe Bağlı)" value={measForm.rightLeg} onChange={e => setMeasForm({ ...measForm, rightLeg: e.target.value })} />
                                    <input style={styles.input} type="number" step="0.1" placeholder="Sol Bacak (İsteğe Bağlı)" value={measForm.leftLeg} onChange={e => setMeasForm({ ...measForm, leftLeg: e.target.value })} />
                                </div>

                                <button type="submit" style={{ ...styles.submitBtn, backgroundColor: editingMeasurement ? '#3b82f6' : '#4ade80', color: 'black' }}>
                                    <Plus size={18} /> {editingMeasurement ? "GÜNCELLEMEYİ BAS" : "KAYDET"}
                                </button>
                                {editingMeasurement && (
                                    <button type="button" onClick={() => {
                                        setEditingMeasurement(null);
                                        setMeasForm(INITIAL_MEAS_FORM);
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
                                            <th style={{ padding: '12px', whiteSpace: 'nowrap' }}>Kol (L/R)</th>
                                            <th style={{ padding: '12px' }}>Bel</th>
                                            <th style={{ padding: '12px' }}>Boyun</th>
                                            <th style={{ padding: '12px' }}>Kalça</th>
                                            <th style={{ padding: '12px' }}>Sağ Bacak</th>
                                            <th style={{ padding: '12px' }}>Sol Bacak</th>
                                            <th style={{ padding: '12px' }}>Ayar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {measurements.map((m, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                                <td style={{ padding: '12px' }}>
                                                    {m.recordDate || m.RecordDate ? new Date(m.recordDate || m.RecordDate).toLocaleDateString('tr-TR') : "Tarih Yok"}
                                                </td>
                                                <td style={{ padding: '12px' }}>{m.weight} {getDiff(m.weight, measurements[i + 1]?.weight, true)}</td>
                                                <td style={{ padding: '12px' }}>{m.shoulder} {getDiff(m.shoulder, measurements[i + 1]?.shoulder)}</td>
                                                <td style={{ padding: '12px' }}>{m.chest} {getDiff(m.chest, measurements[i + 1]?.chest)}</td>
                                                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                                    <div>{m.leftArm} / {m.rightArm}</div>
                                                    {(measurements[i + 1]?.leftArm != null || measurements[i + 1]?.rightArm != null) && (
                                                        <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                                                            {getDiff(m.leftArm, measurements[i + 1]?.leftArm) || <span style={{ color: '#666' }}>-</span>}
                                                            <span style={{ color: '#555', margin: '0 4px' }}>/</span>
                                                            {getDiff(m.rightArm, measurements[i + 1]?.rightArm) || <span style={{ color: '#666' }}>-</span>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px' }}>{m.waist} {getDiff(m.waist, measurements[i + 1]?.waist, true)}</td>
                                                <td style={{ padding: '12px' }}>{m.neck} {getDiff(m.neck, measurements[i + 1]?.neck)}</td>
                                                <td style={{ padding: '12px' }}>
                                                    {m.hips != null ? <>{m.hips} {getDiff(m.hips, measurements[i + 1]?.hips, true)}</> : '-'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {m.rightLeg != null ? <>{m.rightLeg} {getDiff(m.rightLeg, measurements[i + 1]?.rightLeg, true)}</> : '-'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {m.leftLeg != null ? <>{m.leftLeg} {getDiff(m.leftLeg, measurements[i + 1]?.leftLeg, true)}</> : '-'}
                                                </td>
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
                    <div>
                        {/* ÜST KALORİ HEDEFİ VE HESAPLAMA BARI */}
                        <div style={{
                            ...styles.card,
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px',
                            borderLeft: `4px solid ${calorieStatus ? calorieStatus.border : '#3b82f6'}`
                        }}>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem' }}>
                                        🎯 Günlük Kalori Hedefi & Öğün Dengesi
                                    </h3>
                                    {calorieStatus && (
                                        <span style={{
                                            backgroundColor: calorieStatus.bg,
                                            border: `1px solid ${calorieStatus.border}`,
                                            color: calorieStatus.color,
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem'
                                        }}>
                                            {calorieStatus.badge}
                                        </span>
                                    )}
                                </div>
                                {calorieStatus ? (
                                    <div style={{ color: '#ccc', fontSize: '0.92rem' }}>
                                        {calorieStatus.text}
                                    </div>
                                ) : (
                                    <div style={{ color: '#999', fontSize: '0.9rem' }}>
                                        İsteğe bağlı: Öğün eklemeden önce üyenin boy, kilo ve hedefine göre günlük alması gereken kaloriyi hesaplayabilirsiniz. (Şu anki öğünler toplamı: <strong>{totalMealCalories} kcal</strong>)
                                    </div>
                                )}

                                {(totalDailyProtein > 0 || totalDailyCarbs > 0 || totalDailyFat > 0) && (
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            🥩 Toplam Protein: {totalDailyProtein}g
                                        </span>
                                        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.14)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            🌾 Toplam Karb: {totalDailyCarbs}g
                                        </span>
                                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fcd34d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            🥑 Toplam Yağ: {totalDailyFat}g
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {targetCalories != null && (
                                    <div style={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.72rem', color: '#888' }}>KAYITLI HEDEF</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#3b82f6' }}>{targetCalories} kcal</div>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={openCalorieCalculatorModal}
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 18px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    🧮 {targetCalories != null ? 'Kalori Hedefini Yeniden Hesapla' : 'Kalori İhtiyacı Hesapla (İsteğe Bağlı)'}
                                </button>
                            </div>
                        </div>

                        <div style={styles.grid}>
                            {/* Öğün Ekleme/Güncelleme Formu */}
                            <div style={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <h3 style={{ color: '#d90429', margin: 0 }}>
                                        {editingDiet ? "Öğünü Güncelle" : "Yeni Öğün Ekle"}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={openFoodPickerModal}
                                        style={{
                                            backgroundColor: '#16a34a',
                                            color: 'white',
                                            border: '1px solid #4ade80',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.88rem',
                                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                                        }}
                                    >
                                        🥗 + Besin Ekle (Kütüphane / API)
                                    </button>
                                </div>

                                <form onSubmit={handleAddDiet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input style={{ ...styles.input, flex: 1 }} type="time" value={dietForm.time} onChange={e => setDietForm({ ...dietForm, time: e.target.value })} required />
                                        <input
                                            style={{ ...styles.input, flex: 1, fontWeight: 'bold', color: '#fcd34d' }}
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="Öğün Kalorisi (kcal)"
                                            value={dietForm.calories}
                                            onChange={e => setDietForm({ ...dietForm, calories: e.target.value })}
                                        />
                                    </div>
                                    <input style={styles.input} type="text" placeholder="Öğün Adı (örn: 1. Öğün - Kahvaltı)" value={dietForm.mealName} onChange={e => setDietForm({ ...dietForm, mealName: e.target.value })} required />

                                    {/* EKLENEN BESİNLER LİSTESİ */}
                                    <div style={{
                                        backgroundColor: '#161616',
                                        border: '1px dashed #333',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (dietForm.foods && dietForm.foods.length > 0) ? '10px' : '0' }}>
                                            <span style={{ fontSize: '0.82rem', color: '#bbb', fontWeight: 'bold' }}>
                                                🍽️ Öğündeki Besinler ({(dietForm.foods || []).length})
                                            </span>
                                            {(dietForm.foods && dietForm.foods.length > 0) && (
                                                <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 'bold' }}>
                                                    🥩 {currentFormProtein}g P · 🌾 {currentFormCarbs}g K · 🥑 {currentFormFat}g Y
                                                </span>
                                            )}
                                        </div>

                                        {(!dietForm.foods || dietForm.foods.length === 0) ? (
                                            <div style={{ color: '#777', fontSize: '0.82rem', marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                <span>Henüz besin seçilmedi. Yukarıdaki <strong>"🥗 + Besin Ekle"</strong> tuşuyla besin arayıp ekleyebilirsiniz.</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {dietForm.foods.map((f, fIdx) => (
                                                    <div
                                                        key={fIdx}
                                                        style={{
                                                            backgroundColor: '#1f1f1f',
                                                            border: '1px solid #2e2e2e',
                                                            borderRadius: '6px',
                                                            padding: '8px 10px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.88rem' }}>
                                                                {f.foodName} {f.brand ? <span style={{ color: '#888', fontWeight: 'normal', fontSize: '0.78rem' }}>({f.brand})</span> : null}
                                                            </div>
                                                            <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '2px' }}>
                                                                <strong style={{ color: '#4ade80' }}>{f.amount} {f.unit}</strong> • 🔥 {f.calculatedCalories} kcal | 🥩 {f.calculatedProtein}g P · 🌾 {f.calculatedCarbs}g K · 🥑 {f.calculatedFat}g Y
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFoodFromMealForm(fIdx)}
                                                            style={{
                                                                backgroundColor: 'rgba(217, 4, 41, 0.2)',
                                                                color: '#fca5a5',
                                                                border: '1px solid #d90429',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.78rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            ✕ Çıkar
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <textarea
                                        style={{ ...styles.input, height: '75px' }}
                                        placeholder="📝 Öğün Notu / Hazırlanış Tarifi (İsteğe Bağlı - Örn: Zeytinyağını salataya çiğ ekleyin, bol su tüketin)"
                                        value={dietForm.content}
                                        onChange={e => setDietForm({ ...dietForm, content: e.target.value })}
                                    />

                                    {targetCalories != null && (
                                        <div style={{
                                            fontSize: '0.82rem',
                                            color: calorieDiff === 0 ? '#4ade80' : calorieDiff < 0 ? '#fcd34d' : '#fca5a5',
                                            backgroundColor: '#181818',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #2a2a2a'
                                        }}>
                                            {calorieDiff === 0
                                                ? `✅ Toplam kalori hedefle tam eşitlendi (${targetCalories} kcal).`
                                                : calorieDiff < 0
                                                    ? `💡 Hedefe tam eşitlenmesi için ${Math.abs(calorieDiff)} kcal daha eklenebilir.`
                                                    : `⚠️ Hedef kaloriden ${calorieDiff} kcal fazla bulunuyor.`}
                                        </div>
                                    )}

                                    <button type="submit" style={{ ...styles.submitBtn, backgroundColor: editingDiet ? '#3b82f6' : '#d90429', color: 'white' }}>
                                        <Plus size={18} /> {editingDiet ? "GÜNCELLEMEYİ BAS" : "LİSTEYE EKLE"}
                                    </button>

                                    {editingDiet && (
                                        <button type="button" onClick={() => {
                                            setEditingDiet(null);
                                            setDietForm({ mealName: '', time: '', content: '', calories: '', foods: [] });
                                        }} style={{ ...styles.submitBtn, backgroundColor: '#444', color: 'white' }}>
                                            İPTAL ET
                                        </button>
                                    )}
                                </form>
                            </div>

                            {/* Güncel Diyet Listesi */}
                            <div style={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3 style={{ color: 'white', margin: 0 }}>Beslenme Programı</h3>
                                    <span style={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        color: '#f59e0b',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}>
                                        🔥 Toplam: {totalMealCalories} kcal
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[...diets].sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((d, i) => {
                                        const mealFoods = d.foods || d.Foods || [];
                                        const mealProt = Number(mealFoods.reduce((s, f) => s + (Number(f.calculatedProtein ?? f.CalculatedProtein) || 0), 0).toFixed(1));
                                        const mealCarbs = Number(mealFoods.reduce((s, f) => s + (Number(f.calculatedCarbs ?? f.CalculatedCarbs) || 0), 0).toFixed(1));
                                        const mealFat = Number(mealFoods.reduce((s, f) => s + (Number(f.calculatedFat ?? f.CalculatedFat) || 0), 0).toFixed(1));

                                        return (
                                            <div key={i} style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #d90429', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', color: '#d90429', fontSize: '1.15rem', minWidth: '58px', paddingTop: '2px' }}>{d.time}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{d.mealName}</span>
                                                            {d.calories != null && d.calories > 0 && (
                                                                <span style={{
                                                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                                                    border: '1px solid #f59e0b',
                                                                    color: '#fcd34d',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    🔥 {d.calories} kcal
                                                                </span>
                                                            )}
                                                            {mealFoods.length > 0 && (
                                                                <span style={{ fontSize: '0.75rem', color: '#9ca3af', backgroundColor: '#111', padding: '2px 8px', borderRadius: '4px', border: '1px solid #2b2b2b' }}>
                                                                    🥩 {mealProt}g P · 🌾 {mealCarbs}g K · 🥑 {mealFat}g Y
                                                                </span>
                                                            )}
                                                        </div>

                                                        {mealFoods.length > 0 && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                                                {mealFoods.map((mf, mfIdx) => (
                                                                    <div key={mfIdx} style={{ fontSize: '0.83rem', color: '#e5e7eb', backgroundColor: '#121212', padding: '5px 9px', borderRadius: '5px', border: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                        <span>
                                                                            🥗 <strong>{mf.foodName || mf.FoodName}</strong> {(mf.brand || mf.Brand) ? <span style={{ color: '#888', fontSize: '0.75rem' }}>({mf.brand || mf.Brand})</span> : null} — <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{mf.amount || mf.Amount} {mf.unit || mf.Unit}</span>
                                                                        </span>
                                                                        <span style={{ color: '#fcd34d', fontSize: '0.76rem', fontWeight: 'bold' }}>
                                                                            {mf.calculatedCalories ?? mf.CalculatedCalories} kcal ({mf.calculatedProtein ?? mf.CalculatedProtein}g P)
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {d.content && (
                                                            <div style={{ color: '#aaa', fontSize: '0.86rem', marginTop: '6px', fontStyle: mealFoods.length > 0 ? 'italic' : 'normal' }}>
                                                                {mealFoods.length > 0 ? `📝 Not: ${d.content}` : d.content}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                                    <button onClick={() => handleDeleteDiet(d.id || d.Id)} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        SİL
                                                    </button>
                                                    <button onClick={() => handleEditDiet(d)} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        GÜNCELLE
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {diets.length === 0 && <div style={{ color: '#666', textAlign: 'center' }}>Henüz diyet eklenmemiş.</div>}
                                </div>
                            </div>
                        </div>

                        {/* BESİN ARAMA, OPEN FOOD FACTS API & PORSİYON POP-UP MODAL */}
                        {showFoodModal && (
                            <div style={styles.modalOverlay} onClick={() => setShowFoodModal(false)}>
                                <div style={{ ...styles.modalBox, maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2a2a', paddingBottom: '12px', marginBottom: '14px' }}>
                                        <div>
                                            <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>
                                                🥗 Öğüne Besin Ekle (Akıllı Besin Kütüphanesi & API)
                                            </h2>
                                            <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                                Yerel Sporcu Besinleri + Open Food Facts Türkiye Veritabanı (Otomatik Önbellekli)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowFoodModal(false)}
                                            style={{ backgroundColor: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
                                        >
                                            ✕ Kapat
                                        </button>
                                    </div>

                                    {/* MODAL SEKMELERİ: ARAMA vs ÖZEL BESİN TANIMLA */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setFoodModalTab('search')}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: foodModalTab === 'search' ? '2px solid #4ade80' : '1px solid #333',
                                                backgroundColor: foodModalTab === 'search' ? 'rgba(74, 222, 128, 0.14)' : '#181818',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: '0.88rem'
                                            }}
                                        >
                                            🔍 Besin Ara (Kütüphane & Open Food Facts)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFoodModalTab('custom')}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: foodModalTab === 'custom' ? '2px solid #3b82f6' : '1px solid #333',
                                                backgroundColor: foodModalTab === 'custom' ? 'rgba(59, 130, 246, 0.14)' : '#181818',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: '0.88rem'
                                            }}
                                        >
                                            ✨ Yeni Özel Besin Tanımla
                                        </button>
                                    </div>

                                    {foodModalTab === 'search' ? (
                                        <div>
                                            {/* ARAMA KUTUSU & OPEN FOOD FACTS BUTONU */}
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                <input
                                                    style={{ ...styles.input, flex: 1, minWidth: '220px' }}
                                                    type="text"
                                                    placeholder="Besin veya marka ara (örn: Tavuk, Yulaf, Sütaş, Ton Balığı, Whey)..."
                                                    value={foodSearchQuery}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFoodSearchQuery(val);
                                                        searchFoods(val, selectedFoodCategory, false);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    disabled={searchingExternal || !foodSearchQuery || foodSearchQuery.trim().length < 2}
                                                    onClick={() => searchFoods(foodSearchQuery, 'Tümü', true)}
                                                    style={{
                                                        backgroundColor: '#2563eb',
                                                        color: 'white',
                                                        border: '1px solid #60a5fa',
                                                        borderRadius: '6px',
                                                        padding: '10px 14px',
                                                        fontWeight: 'bold',
                                                        cursor: (searchingExternal || !foodSearchQuery || foodSearchQuery.trim().length < 2) ? 'not-allowed' : 'pointer',
                                                        opacity: (searchingExternal || !foodSearchQuery || foodSearchQuery.trim().length < 2) ? 0.55 : 1,
                                                        fontSize: '0.82rem',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {searchingExternal ? '🌐 Aranıyor...' : '🌐 İnternetten Ara (Open Food Facts)'}
                                                </button>
                                            </div>

                                            {/* HIZLI KATEGORİ FİLTRE ÇİPLERİ */}
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                {FOOD_CATEGORIES.map(cat => {
                                                    const active = selectedFoodCategory === cat;
                                                    return (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedFoodCategory(cat);
                                                                searchFoods(foodSearchQuery, cat, false);
                                                            }}
                                                            style={{
                                                                padding: '5px 11px',
                                                                borderRadius: '999px',
                                                                border: active ? '1px solid #4ade80' : '1px solid #333',
                                                                backgroundColor: active ? 'rgba(74, 222, 128, 0.16)' : '#181818',
                                                                color: active ? '#4ade80' : '#aaa',
                                                                fontSize: '0.78rem',
                                                                fontWeight: active ? 'bold' : 'normal',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {cat}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* BESİN SONUÇ LİSTESİ */}
                                            <div style={{
                                                maxHeight: selectedFoodItem ? '210px' : '320px',
                                                overflowY: 'auto',
                                                border: '1px solid #262626',
                                                borderRadius: '8px',
                                                backgroundColor: '#141414',
                                                padding: '8px',
                                                marginBottom: '12px'
                                            }}>
                                                {loadingFoods ? (
                                                    <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Besinler yükleniyor...</div>
                                                ) : foodResults.length === 0 ? (
                                                    <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: '0.88rem' }}>
                                                        Yerel kütüphanede eşleşen besin bulunamadı. Yukarıdaki <strong>"🌐 İnternetten Ara (Open Food Facts)"</strong> butonuna basarak tüm dünyadaki barkodlu ürünleri arayabilirsiniz!
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {foodResults.map((food, idx) => {
                                                            const isSelected = selectedFoodItem && (
                                                                (selectedFoodItem.id && selectedFoodItem.id === food.id) ||
                                                                (selectedFoodItem.name === food.name && selectedFoodItem.brand === food.brand)
                                                            );
                                                            const isExternalNew = !food.id || food.id === 0;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => handleSelectFoodForPortion(food)}
                                                                    style={{
                                                                        padding: '10px 12px',
                                                                        borderRadius: '7px',
                                                                        border: isSelected ? '2px solid #4ade80' : '1px solid #262626',
                                                                        backgroundColor: isSelected ? 'rgba(74, 222, 128, 0.1)' : '#1c1c1c',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        flexWrap: 'wrap'
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{food.name}</span>
                                                                            {food.brand && (
                                                                                <span style={{ color: '#9ca3af', fontSize: '0.76rem', backgroundColor: '#111', padding: '2px 6px', borderRadius: '4px' }}>
                                                                                    {food.brand}
                                                                                </span>
                                                                            )}
                                                                            <span style={{
                                                                                fontSize: '0.68rem',
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                fontWeight: 'bold',
                                                                                backgroundColor: isExternalNew ? 'rgba(59, 130, 246, 0.2)' : 'rgba(74, 222, 128, 0.14)',
                                                                                color: isExternalNew ? '#93c5fd' : '#4ade80',
                                                                                border: isExternalNew ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(74, 222, 128, 0.3)'
                                                                            }}>
                                                                                {isExternalNew ? '🌐 Open Food Facts (İlk Seçimde Kaydedilir)' : '⚡ Yerel DB'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ color: '#9ca3af', fontSize: '0.76rem', marginTop: '4px' }}>
                                                                            100g için: <strong style={{ color: '#fcd34d' }}>🔥 {food.caloriesPer100g} kcal</strong> | 🥩 {food.proteinPer100g}g P · 🌾 {food.carbsPer100g}g K · 🥑 {food.fatPer100g}g Y
                                                                        </div>
                                                                    </div>
                                                                    <span style={{ color: isSelected ? '#4ade80' : '#888', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                                        {isSelected ? '✓ Seçildi' : 'Seç →'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* SEÇİLEN BESİN PORSİYON & MAKRO HESAPLAMA KARTI */}
                                            {selectedFoodItem && (
                                                <div style={{
                                                    backgroundColor: '#161b22',
                                                    border: '2px solid #4ade80',
                                                    borderRadius: '10px',
                                                    padding: '14px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                                                        <div>
                                                            <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.96rem' }}>
                                                                🥗 {selectedFoodItem.name} {selectedFoodItem.brand ? `(${selectedFoodItem.brand})` : ''}
                                                            </div>
                                                            <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                                                Porsiyon miktarını ve birimini seçin (Toplam: ~{selectedPortionCalc.totalGrams}g)
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* BİRİM VE MİKTAR GİRİŞİ */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px', marginBottom: '10px' }}>
                                                        <div>
                                                            <label style={styles.label}>Miktar</label>
                                                            <input
                                                                style={{ ...styles.input, fontWeight: 'bold', fontSize: '1rem', color: '#4ade80' }}
                                                                type="number"
                                                                step="0.5"
                                                                min="0.1"
                                                                value={portionAmount}
                                                                onChange={e => setPortionAmount(e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={styles.label}>Porsiyon Birimi</label>
                                                            <select
                                                                style={styles.input}
                                                                value={portionUnitType}
                                                                onChange={e => {
                                                                    const nextType = e.target.value;
                                                                    setPortionUnitType(nextType);
                                                                    setPortionAmount(nextType === 'gram' ? '100' : '1');
                                                                }}
                                                            >
                                                                <option value="gram">Gram (g)</option>
                                                                {selectedFoodItem.defaultUnit && selectedFoodItem.defaultUnit.toLowerCase() !== 'gram' && (
                                                                    <option value="default">{selectedFoodItem.defaultUnit}</option>
                                                                )}
                                                                <option value="scoop">Ölçek (30g)</option>
                                                                <option value="slice">Dilim (25g)</option>
                                                                <option value="spoon">Yemek Kaşığı (10g)</option>
                                                                <option value="bowl">Kase / Bardak (200g)</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* HIZLI MİKTAR BUTONLARI */}
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                        {(portionUnitType === 'gram'
                                                            ? ['50', '100', '150', '200', '250', '300']
                                                            : ['1', '1.5', '2', '3', '4', '5']
                                                        ).map(preset => (
                                                            <button
                                                                key={preset}
                                                                type="button"
                                                                onClick={() => setPortionAmount(preset)}
                                                                style={{
                                                                    padding: '5px 10px',
                                                                    borderRadius: '6px',
                                                                    border: String(portionAmount) === preset ? '1px solid #4ade80' : '1px solid #333',
                                                                    backgroundColor: String(portionAmount) === preset ? 'rgba(74, 222, 128, 0.2)' : '#111',
                                                                    color: String(portionAmount) === preset ? '#4ade80' : '#ccc',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {portionUnitType === 'gram' ? `${preset}g` : `${preset}x`}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* CANLI HESAPLANAN KALORİ VE MAKRO ÖZETİ */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', backgroundColor: '#0d1117', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Kalori</div>
                                                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#fcd34d' }}>🔥 {selectedPortionCalc.calories} kcal</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Protein</div>
                                                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#fca5a5' }}>🥩 {selectedPortionCalc.protein}g</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Karbonhidrat</div>
                                                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#93c5fd' }}>🌾 {selectedPortionCalc.carbs}g</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Yağ</div>
                                                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#fcd34d' }}>🥑 {selectedPortionCalc.fat}g</div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleAddFoodToMealForm}
                                                        style={{
                                                            ...styles.submitBtn,
                                                            backgroundColor: '#4ade80',
                                                            color: '#000',
                                                            fontSize: '0.95rem'
                                                        }}
                                                    >
                                                        ✅ ÖĞÜNE EKLE (+{selectedPortionCalc.calories} kcal)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* ÖZEL BESİN TANIMLAMA SEKMESİ */
                                        <form onSubmit={handleCreateCustomFood} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '4px' }}>
                                                Buradan eklediğiniz besin N1FIT yerel veritabanına kalıcı olarak kaydedilir ve sonraki tüm aramalarda anında listelenir.
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                                                <div>
                                                    <label style={styles.label}>Besin Adı *</label>
                                                    <input
                                                        style={styles.input}
                                                        type="text"
                                                        placeholder="Örn: Ev Yapımı Fıstıklı Yulaf Topları"
                                                        value={customFoodForm.name}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label style={styles.label}>Marka / Kaynak</label>
                                                    <input
                                                        style={styles.input}
                                                        type="text"
                                                        placeholder="Örn: Ev Yapımı / Marka"
                                                        value={customFoodForm.brand}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, brand: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                <div>
                                                    <label style={styles.label}>Kategori</label>
                                                    <select
                                                        style={styles.input}
                                                        value={customFoodForm.category}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, category: e.target.value })}
                                                    >
                                                        {FOOD_CATEGORIES.filter(c => c !== 'Tümü').map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={styles.label}>Varsayılan Birim Adı</label>
                                                    <input
                                                        style={styles.input}
                                                        type="text"
                                                        placeholder="Örn: Adet (50g) veya Gram"
                                                        value={customFoodForm.defaultUnit}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, defaultUnit: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={styles.label}>1 Birim Kaç Gram?</label>
                                                    <input
                                                        style={styles.input}
                                                        type="number"
                                                        placeholder="100"
                                                        value={customFoodForm.defaultWeightGrams}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, defaultWeightGrams: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                                <div>
                                                    <label style={styles.label}>🔥 Kalori (100g) *</label>
                                                    <input
                                                        style={styles.input}
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="kcal"
                                                        value={customFoodForm.caloriesPer100g}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, caloriesPer100g: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label style={styles.label}>🥩 Protein (100g)</label>
                                                    <input
                                                        style={styles.input}
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="gram"
                                                        value={customFoodForm.proteinPer100g}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, proteinPer100g: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={styles.label}>🌾 Karb (100g)</label>
                                                    <input
                                                        style={styles.input}
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="gram"
                                                        value={customFoodForm.carbsPer100g}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, carbsPer100g: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={styles.label}>🥑 Yağ (100g)</label>
                                                    <input
                                                        style={styles.input}
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="gram"
                                                        value={customFoodForm.fatPer100g}
                                                        onChange={e => setCustomFoodForm({ ...customFoodForm, fatPer100g: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={savingCustomFood}
                                                style={{
                                                    ...styles.submitBtn,
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    marginTop: '6px'
                                                }}
                                            >
                                                {savingCustomFood ? 'KAYDEDİLİYOR...' : '✨ VERİTABANINA KAYDET & SEÇ'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* KALORİ HESAPLAMA POP-UP MODAL */}
                        {showCalorieModal && (
                            <div style={styles.modalOverlay} onClick={() => setShowCalorieModal(false)}>
                                <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2a2a', paddingBottom: '14px', marginBottom: '18px' }}>
                                        <div>
                                            <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>
                                                🧮 Günlük Kalori İhtiyacı Hesaplayıcı
                                            </h2>
                                            <span style={{ color: '#888', fontSize: '0.82rem' }}>
                                                Mifflin-St Jeor BMR & TDEE Bilimsel Kalori Formülü
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCalorieModal(false)}
                                            style={{ backgroundColor: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
                                        >
                                            ✕ Kapat
                                        </button>
                                    </div>

                                    {/* CİNSİYET SEÇİMİ */}
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={styles.label}>Cinsiyet</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setCalorieForm({ ...calorieForm, gender: 'male' })}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: calorieForm.gender === 'male' ? '2px solid #3b82f6' : '1px solid #333',
                                                    backgroundColor: calorieForm.gender === 'male' ? 'rgba(59, 130, 246, 0.15)' : '#1a1a1a',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ♂ Erkek
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCalorieForm({ ...calorieForm, gender: 'female' })}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: calorieForm.gender === 'female' ? '2px solid #ec4899' : '1px solid #333',
                                                    backgroundColor: calorieForm.gender === 'female' ? 'rgba(236, 72, 153, 0.15)' : '#1a1a1a',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ♀ Kadın
                                            </button>
                                        </div>
                                    </div>

                                    {/* YAŞ, BOY, KİLO */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                        <div>
                                            <label style={styles.label}>Yaş</label>
                                            <input
                                                style={styles.input}
                                                type="number"
                                                placeholder="Örn: 25"
                                                value={calorieForm.age}
                                                onChange={e => setCalorieForm({ ...calorieForm, age: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Boy (cm)</label>
                                            <input
                                                style={styles.input}
                                                type="number"
                                                placeholder="Örn: 178"
                                                value={calorieForm.height}
                                                onChange={e => setCalorieForm({ ...calorieForm, height: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Güncel Kilo (kg)</label>
                                            <input
                                                style={styles.input}
                                                type="number"
                                                step="0.1"
                                                placeholder="Örn: 78"
                                                value={calorieForm.weight}
                                                onChange={e => setCalorieForm({ ...calorieForm, weight: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* AKTİVİTE SEVİYESİ */}
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={styles.label}>Günlük / Haftalık Aktivite Seviyesi</label>
                                        <select
                                            style={styles.input}
                                            value={calorieForm.activity}
                                            onChange={e => setCalorieForm({ ...calorieForm, activity: e.target.value })}
                                        >
                                            {ACTIVITY_OPTIONS.map(act => (
                                                <option key={act.key} value={act.key}>{act.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* HEDEF SEÇİMİ */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={styles.label}>Üyenin Hedefi</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {GOAL_OPTIONS.map(g => {
                                                const isSelected = calorieForm.goal === g.key;
                                                return (
                                                    <div
                                                        key={g.key}
                                                        onClick={() => {
                                                            setCalorieForm({ ...calorieForm, goal: g.key });
                                                            setCustomTargetInput('');
                                                        }}
                                                        style={{
                                                            padding: '10px 14px',
                                                            borderRadius: '8px',
                                                            border: isSelected ? '2px solid #4ade80' : '1px solid #2b2b2b',
                                                            backgroundColor: isSelected ? 'rgba(74, 222, 128, 0.1)' : '#181818',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.92rem' }}>{g.label}</div>
                                                            <div style={{ color: '#888', fontSize: '0.78rem' }}>{g.desc}</div>
                                                        </div>
                                                        <span style={{
                                                            color: g.delta < 0 ? '#f59e0b' : g.delta > 0 ? '#4ade80' : '#93c5fd',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {g.delta > 0 ? `+${g.delta}` : g.delta} kcal
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* HESAPLANAN SONUÇ KARTI */}
                                    {formulaResult ? (
                                        <div style={{
                                            backgroundColor: '#161b22',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Bazal Metabolizma (BMR)</div>
                                                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#ccc' }}>{formulaResult.bmr} kcal</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Günlük Harcama (TDEE)</div>
                                                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#60a5fa' }}>{formulaResult.tdee} kcal</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Önerilen Hedef Kalori</div>
                                                    <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#4ade80' }}>{formulaResult.recommended} kcal</div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid #2a3441', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.82rem', color: '#aaa' }}>
                                                    Kaydedilecek Hedef Kalori (İsterseniz elle değiştirebilirsiniz):
                                                </span>
                                                <input
                                                    type="number"
                                                    style={{ ...styles.input, width: '140px', padding: '8px 10px', fontWeight: 'bold', color: '#4ade80', textAlign: 'center' }}
                                                    value={customTargetInput !== '' ? customTargetInput : formulaResult.recommended}
                                                    onChange={e => setCustomTargetInput(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                                            Kalori hesabı için lütfen geçerli yaş, boy ve kilo bilgilerini giriniz.
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            disabled={!formulaResult || savingTargetCalories}
                                            onClick={handleSaveTargetCalories}
                                            style={{
                                                ...styles.submitBtn,
                                                backgroundColor: '#4ade80',
                                                color: '#000',
                                                fontSize: '0.98rem',
                                                opacity: !formulaResult || savingTargetCalories ? 0.6 : 1
                                            }}
                                        >
                                            {savingTargetCalories ? 'KAYDEDİLİYOR...' : `✅ HEDEF KALORİYİ KAYDET (${effectiveModalCalories} kcal)`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ANTRENMAN SEKMESİ --- */}
                {activeTab === 'workout' && (
                    <div style={styles.grid}>

                        {/* SOL TARAF: HAREKET VE GÜN EKLEME FORMU */}
                        <div style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: '#3b82f6', margin: 0 }}>Programa Hareketi Ekle</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextDay = workoutProgram.days.length + 1;
                                        const newDays = [...workoutProgram.days, { title: `${nextDay}. Gün`, exercises: [] }];
                                        setWorkoutProgram({ days: newDays });
                                        setSelectedDayIndex(newDays.length - 1);
                                        setExpandedDayIndex(newDays.length - 1);

                                        autoSaveWorkout(newDays);
                                    }}
                                    style={{ backgroundColor: '#1a1a1a', color: '#3b82f6', border: '1px solid #3b82f6', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + YENİ GÜN EKLE
                                </button>
                            </div>

                            {workoutProgram.days.length === 0 ? (
                                <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Önce yukarıdan 'Yeni Gün Ekle' butonuna bas!</div>
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
                                            if (!currentAddForm.exerciseId) return alert("Hareketi seç!");
                                            const newDays = [...workoutProgram.days];
                                            newDays[selectedDayIndex].exercises.push({ ...currentAddForm });
                                            setWorkoutProgram({ days: newDays });
                                            setCurrentAddForm({ exerciseId: '', sets: '', reps: '', restTime: '', duration: '', speed: '', incline: '' });
                                            setExpandedDayIndex(selectedDayIndex);

                                            autoSaveWorkout(newDays);
                                        }}
                                        style={{ ...styles.submitBtn, backgroundColor: '#3b82f6', color: 'white', marginTop: '10px' }}
                                    >Hareketi Listeye Ekle</button>
                                </div>
                            )}
                        </div>

                        {/* SAĞ TARAF: GÜNCEL PROGRAM LİSTESİ */}
                        <div style={styles.card}>
                            <h3 style={{ color: 'white', marginTop: 0 }}>Oluşturulan Program</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                {workoutProgram.days.length === 0 && <div style={{ color: '#666' }}>Program henüz boş veya hepsi silindi. (Otomatik Kaydedildi)</div>}

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
                                                    onBlur={() => autoSaveWorkout(workoutProgram.days)}
                                                />
                                            </div>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const newDays = workoutProgram.days.filter((_, i) => i !== dayIdx);
                                                    setWorkoutProgram({ days: newDays });
                                                    if (selectedDayIndex === dayIdx) setSelectedDayIndex(0);

                                                    autoSaveWorkout(newDays);
                                                }}
                                                style={{ color: '#d90429', background: 'transparent', border: '1px solid #d90429', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >Günü Sil</button>
                                        </div>

                                        {expandedDayIndex === dayIdx && (
                                            <div style={{ padding: '10px', borderTop: '1px solid #222' }}>
                                                {day.exercises.length === 0 && <div style={{ color: '#666', fontSize: '0.9rem', padding: '5px' }}>Bu güne henüz hareket eklenmedi.</div>}

                                                {day.exercises.map((ex, exIdx) => {
                                                    const foundEx = allExercises.find(a => a.id === parseInt(ex.exerciseId));
                                                    const isCardio = foundEx?.muscleGroup === "Kardiyo";
                                                    return (
                                                        <div key={exIdx} style={{ padding: '10px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                                                                    {exIdx + 1}. Hareket:
                                                                </span>
                                                                <span style={{ marginLeft: '5px' }}>
                                                                    <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1rem' }}>{foundEx?.name || ex.exerciseName || "Hareket"}</div>
                                                                </span>
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
                                                                        const muscle = foundEx?.muscleGroup;
                                                                        setSelectedMuscleGroup(muscle || "");
                                                                        setSelectedDayIndex(dayIdx);
                                                                        const newDays = [...workoutProgram.days];
                                                                        newDays[dayIdx].exercises = newDays[dayIdx].exercises.filter((_, i) => i !== exIdx);
                                                                        setWorkoutProgram({ days: newDays });

                                                                        autoSaveWorkout(newDays);
                                                                    }}
                                                                    style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                >Düzenle</button>
                                                                <button
                                                                    onClick={() => {
                                                                        const newDays = [...workoutProgram.days];
                                                                        newDays[dayIdx].exercises = newDays[dayIdx].exercises.filter((_, i) => i !== exIdx);
                                                                        setWorkoutProgram({ days: newDays });

                                                                        autoSaveWorkout(newDays);
                                                                    }}
                                                                    style={{ color: '#d90429', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                >Sil</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Tasarım Stilleri
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
    submitBtn: { padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' },
    label: { display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: 'bold' },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
    },
    modalBox: {
        backgroundColor: '#111',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
    }
};

export default MemberDetail;
