import {
    bodyFatNavy,
    leanBodyMassFromBodyFat,
    ffmi,
    bmi,
    waistToHeightRatio
} from 'health-fitness-formulas';

/**
 * health-fitness-formulas kütüphanesini kullanarak U.S. Navy Yağ Oranı,
 * Yağsız Kütle (LBM), İdeal Kilo Aralığı, Referans Yağ Oranı ve FFMI (Doğal Sınır / Doping Analizi) hesaplar.
 */
export function calculateBodyCompositionLocal({ age, height, gender, weight, neck, waist, hips }) {
    const parsedAge = Number(age);
    const parsedHeight = Number(height);
    const parsedWeight = Number(weight);
    const parsedNeck = Number(neck);
    const parsedWaist = Number(waist);
    const parsedHips = hips != null && hips !== '' ? Number(hips) : null;
    const isFemale = String(gender).toLowerCase() === 'female';

    if (!parsedAge || parsedAge < 10 || parsedAge > 100) {
        throw new Error('Lütfen geçerli bir yaş giriniz (10 - 100).');
    }
    if (!parsedHeight || parsedHeight < 100 || parsedHeight > 250) {
        throw new Error('Lütfen geçerli bir boy (cm) giriniz (100 - 250).');
    }
    if (!parsedWeight || parsedWeight < 25 || parsedWeight > 300) {
        throw new Error('Lütfen geçerli bir kilo (kg) giriniz.');
    }
    if (!parsedNeck || parsedNeck <= 15 || !parsedWaist || parsedWaist <= 30) {
        throw new Error('Lütfen geçerli boyun ve bel ölçüleri (cm) giriniz.');
    }

    if (!isFemale && parsedWaist - parsedNeck <= 0) {
        throw new Error('Erkek ölçümünde bel çevresi boyun çevresinden büyük olmalıdır.');
    }
    if (isFemale) {
        if (!parsedHips || parsedHips <= 40) {
            throw new Error('Kadın yağ oranı hesaplaması (U.S. Navy) için kalça ölçüsü zorunludur.');
        }
        if (parsedWaist + parsedHips - parsedNeck <= 0) {
            throw new Error('Bel ve kalça toplamı boyun ölçüsünden büyük olmalıdır.');
        }
    }

    // 1. U.S. Navy Yağ Oranı (health-fitness-formulas)
    const rawBf = bodyFatNavy({
        sex: isFemale ? 'female' : 'male',
        neckCm: parsedNeck,
        waistCm: parsedWaist,
        heightCm: parsedHeight,
        hipCm: isFemale ? parsedHips : undefined
    });

    const bodyFatPercentage = Math.max(3.0, Math.min(60.0, rawBf));

    // 2. Yağsız Kütle (LBM) ve Yağ Kütlesi (health-fitness-formulas)
    const leanBodyMassKg = leanBodyMassFromBodyFat(parsedWeight, bodyFatPercentage);
    const fatMassKg = parsedWeight - leanBodyMassKg;

    // 3. FFMI & Normalleştirilmiş FFMI (Kouri et al. 1995 - health-fitness-formulas)
    const ffmiResult = ffmi({
        kg: parsedWeight,
        cm: parsedHeight,
        bodyFatPct: bodyFatPercentage
    });

    // 4. BMI & Bel/Boy Oranı (health-fitness-formulas)
    const bmiValue = bmi(parsedWeight, parsedHeight);
    const wthrValue = waistToHeightRatio(parsedWaist, parsedHeight);

    // 5. Boy ve Yaşa Göre Referans Kilo Aralığı (DSÖ Sağlıklı BMI 18.5 - 24.9)
    const heightM = parsedHeight / 100.0;
    const idealWeightMinKg = 18.5 * (heightM * heightM);
    const idealWeightMaxKg = 24.9 * (heightM * heightM);

    // 6. Yaş ve Cinsiyete Göre Referans Yağ Oranı Aralığı (Gallagher / ACSM)
    let idealBodyFatMinPct, idealBodyFatMaxPct;
    if (!isFemale) {
        if (parsedAge < 40) { idealBodyFatMinPct = 8.0; idealBodyFatMaxPct = 19.0; }
        else if (parsedAge < 60) { idealBodyFatMinPct = 11.0; idealBodyFatMaxPct = 21.0; }
        else { idealBodyFatMinPct = 13.0; idealBodyFatMaxPct = 24.0; }
    } else {
        if (parsedAge < 40) { idealBodyFatMinPct = 21.0; idealBodyFatMaxPct = 32.0; }
        else if (parsedAge < 60) { idealBodyFatMinPct = 23.0; idealBodyFatMaxPct = 33.0; }
        else { idealBodyFatMinPct = 24.0; idealBodyFatMaxPct = 35.0; }
    }

    // 7. Yağ Oranı Kategorisi
    let bodyFatCategory = '';
    let bodyFatColor = '';
    if (!isFemale) {
        if (bodyFatPercentage < 6.0) { bodyFatCategory = 'Zayıf (Esansiyel Yağ Sınırında)'; bodyFatColor = '#38bdf8'; }
        else if (bodyFatPercentage < 14.0) { bodyFatCategory = 'Atletik / Çok Fit'; bodyFatColor = '#4ade80'; }
        else if (bodyFatPercentage < 18.0) { bodyFatCategory = 'Fit / İdeal'; bodyFatColor = '#4ade80'; }
        else if (bodyFatPercentage < 25.0) { bodyFatCategory = 'Normal / Hafif Kilolu'; bodyFatColor = '#f59e0b'; }
        else { bodyFatCategory = 'Fazla Kilolu / Yüksek Yağlı'; bodyFatColor = '#d90429'; }
    } else {
        if (bodyFatPercentage < 14.0) { bodyFatCategory = 'Zayıf (Esansiyel Yağ Sınırında)'; bodyFatColor = '#38bdf8'; }
        else if (bodyFatPercentage < 21.0) { bodyFatCategory = 'Atletik / Çok Fit'; bodyFatColor = '#4ade80'; }
        else if (bodyFatPercentage < 25.0) { bodyFatCategory = 'Fit / İdeal'; bodyFatColor = '#4ade80'; }
        else if (bodyFatPercentage < 32.0) { bodyFatCategory = 'Normal / Hafif Kilolu'; bodyFatColor = '#f59e0b'; }
        else { bodyFatCategory = 'Fazla Kilolu / Yüksek Yağlı'; bodyFatColor = '#d90429'; }
    }

    // 8. BMI Kategorisi
    let bmiCategory = '';
    if (bmiValue < 18.5) bmiCategory = 'Zayıf';
    else if (bmiValue < 25.0) bmiCategory = 'Normal Kilolu';
    else if (bmiValue < 30.0) bmiCategory = 'Hafif Kilolu';
    else bmiCategory = 'Obezite Sınırında';

    // 9. FFMI & Doğal Sınır / Potansiyel Dopingli Analizi
    let ffmiCategory = '';
    let ffmiColor = '';
    let isPotentialDoping = false;
    const normFfmi = ffmiResult.normalised;

    if (!isFemale) {
        if (normFfmi > 25.0) {
            isPotentialDoping = true;
            ffmiCategory = 'Potansiyel Dopingli (Doğal Genetik Sınır Üstü)';
            ffmiColor = '#a855f7';
        } else if (normFfmi >= 22.0) {
            ffmiCategory = 'Mükemmel / Doğal Genetik Zirve';
            ffmiColor = '#4ade80';
        } else if (normFfmi >= 20.0) {
            ffmiCategory = 'Fit / Gelişmiş Kas Kütlesi';
            ffmiColor = '#4ade80';
        } else if (normFfmi >= 18.0) {
            ffmiCategory = 'Normal / Ortalama Kas Kütlesi';
            ffmiColor = '#f59e0b';
        } else {
            ffmiCategory = 'Zayıf / Düşük Kas Kütlesi';
            ffmiColor = '#38bdf8';
        }
    } else {
        if (normFfmi > 21.5) {
            isPotentialDoping = true;
            ffmiCategory = 'Potansiyel Dopingli (Doğal Genetik Sınır Üstü)';
            ffmiColor = '#a855f7';
        } else if (normFfmi >= 18.5) {
            ffmiCategory = 'Mükemmel / Doğal Genetik Zirve';
            ffmiColor = '#4ade80';
        } else if (normFfmi >= 16.5) {
            ffmiCategory = 'Fit / Gelişmiş Kas Kütlesi';
            ffmiColor = '#4ade80';
        } else if (normFfmi >= 14.5) {
            ffmiCategory = 'Normal / Ortalama Kas Kütlesi';
            ffmiColor = '#f59e0b';
        } else {
            ffmiCategory = 'Zayıf / Düşük Kas Kütlesi';
            ffmiColor = '#38bdf8';
        }
    }

    return {
        bodyFatPercentage: Number(bodyFatPercentage.toFixed(1)),
        fatMassKg: Number(fatMassKg.toFixed(1)),
        leanBodyMassKg: Number(leanBodyMassKg.toFixed(1)),
        bmi: Number(bmiValue.toFixed(1)),
        ffmi: Number(ffmiResult.ffmi.toFixed(1)),
        normalizedFfmi: Number(normFfmi.toFixed(1)),
        waistToHeightRatio: Number(wthrValue.toFixed(2)),
        idealWeightMinKg: Number(idealWeightMinKg.toFixed(1)),
        idealWeightMaxKg: Number(idealWeightMaxKg.toFixed(1)),
        idealBodyFatMinPct,
        idealBodyFatMaxPct,
        bodyFatCategory,
        bodyFatColor,
        bmiCategory,
        ffmiCategory,
        ffmiColor,
        isPotentialDoping,
        summaryStatus: isPotentialDoping ? 'Potansiyel Dopingli' : bodyFatCategory
    };
}
