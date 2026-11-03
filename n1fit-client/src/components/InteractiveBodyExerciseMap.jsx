import React, { useState, useEffect } from 'react';
import {
    Dumbbell, Play, Search, X, ChevronRight, ChevronDown, Activity,
    Flame, Sparkles, Filter, Info, Eye, CheckCircle2, Video
} from 'lucide-react';
import api from '../api/axiosConfig';

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/shorts/')) {
        const shortId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
        if (shortId) return `https://www.youtube.com/embed/${shortId}`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

// Kas Tanımları ve Bölgeleri (Admin Kütüphanesi ile %100 Birebir Aynı)
const FRONT_MUSCLES = [
    { key: 'Göğüs', label: 'Göğüs (Chest)' },
    { key: 'Omuz', label: 'Omuz (Deltoids)' },
    { key: 'Biceps (Ön Kol)', label: 'Biceps (Ön Kol)' },
    { key: 'Karın (Abs & Core)', label: 'Karın (Abs & Core)' },
    { key: 'Ön Bacak (Quadriceps)', label: 'Ön Bacak (Quadriceps)' },
    { key: 'Kalf & Baldır', label: 'Kalf & Baldır' },
];

const BACK_MUSCLES = [
    { key: 'Trapez & Üst Sırt', label: 'Trapez & Üst Sırt' },
    { key: 'Arka Omuz', label: 'Arka Omuz (Rear Delts)' },
    { key: 'Sırt & Kanat', label: 'Sırt & Kanat (Lats)' },
    { key: 'Triceps (Arka Kol)', label: 'Triceps (Arka Kol)' },
    { key: 'Bel & Alt Sırt', label: 'Bel & Alt Sırt' },
    { key: 'Kalça (Gluteus)', label: 'Kalça (Gluteus)' },
    { key: 'Arka Bacak (Hamstrings)', label: 'Arka Bacak (Hamstrings)' },
    { key: 'Kalf & Baldır', label: 'Kalf & Baldır' },
];

const InteractiveBodyExerciseMap = () => {
    const [viewMode, setViewMode] = useState('front'); // 'front' | 'back'
    const [selectedMuscle, setSelectedMuscle] = useState('Göğüs');
    const [hoveredMuscle, setHoveredMuscle] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        const loadExercises = async () => {
            try {
                setLoading(true);
                const res = await api.get('/Exercise');
                setExercises(res.data || []);
            } catch (err) {
                console.error("Hareketler çekilemedi:", err);
            } finally {
                setLoading(false);
            }
        };
        loadExercises();
    }, []);

    // Kas grubuna göre hareket filtreleme mantığı (%100 eşleşme garantisi)
    const filterExercisesByMuscle = (item, target) => {
        if (!item?.muscleGroup) return false;
        const mg = item.muscleGroup.trim().toLowerCase();
        const t = target.trim().toLowerCase();

        // 1. Birebir eşitlik
        if (mg === t) return true;

        // 2. Kapsam ve Kök Kelime Eşleşmeleri
        if (t.includes('göğüs') || t.includes('chest')) return mg.includes('göğüs') || mg.includes('chest');
        if (t.includes('arka omuz')) return mg.includes('arka omuz');
        if (t.includes('omuz')) return mg.includes('omuz') && !mg.includes('arka');
        if (t.includes('biceps') || t.includes('ön kol')) return mg.includes('biceps') || mg.includes('ön kol');
        if (t.includes('triceps') || t.includes('arka kol')) return mg.includes('triceps') || mg.includes('arka kol');
        if (t.includes('trapez')) return mg.includes('trapez');
        if (t.includes('bel')) return mg.includes('bel');
        if (t.includes('kalça')) return mg.includes('kalça') || mg.includes('glute');
        if (t.includes('arka bacak')) return mg.includes('arka bacak') || mg.includes('hamstring');
        if (t.includes('ön bacak')) return mg.includes('ön bacak') || mg.includes('quad');
        if (t.includes('kalf') || t.includes('baldır')) return mg.includes('kalf') || mg.includes('baldır');
        if (t.includes('karın') || t.includes('abs')) return mg.includes('karın') || mg.includes('abs') || mg.includes('core');
        if (t.includes('sırt') || t.includes('kanat')) return mg.includes('sırt') || mg.includes('kanat') || mg.includes('lats');
        if (t.includes('kardiyo')) return mg.includes('kardiyo');

        return mg.includes(t) || t.includes(mg);
    };

    const scrollToExerciseSection = () => {
        const el = document.getElementById('exercise-results-anchor');
        if (el) {
            const yOffset = -20;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleMuscleClick = (muscleKey) => {
        setSelectedMuscle(muscleKey);
        // Tıklanan bölgenin hareketlerine doğrudan aşağıya otomatik akıcı kaydırma (autoscroll)
        setTimeout(() => {
            scrollToExerciseSection();
        }, 80);
    };

    const isMuscleActive = (muscleKey) => selectedMuscle === muscleKey;
    const isMuscleHovered = (muscleKey) => hoveredMuscle === muscleKey;

    const filteredExercises = exercises.filter(e => {
        const matchesMuscle = selectedMuscle ? filterExercisesByMuscle(e, selectedMuscle) : true;
        const matchesSearch = searchQuery.trim() === ''
            ? true
            : (e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesMuscle && matchesSearch;
    });

    const getMuscleFill = (muscleKey) => {
        if (isMuscleActive(muscleKey)) return '#d90429';
        if (isMuscleHovered(muscleKey)) return '#ff2a51';
        return '#252932';
    };

    const getMuscleStroke = (muscleKey) => {
        if (isMuscleActive(muscleKey)) return '#ff4d6d';
        if (isMuscleHovered(muscleKey)) return '#ffffff';
        return '#3b4352';
    };

    const currentMusclesList = viewMode === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

    return (
        <div style={styles.container}>
            {/* ÖN / ARKA GÖRÜNÜM SEÇİCİ */}
            <div style={styles.viewToggleContainer}>
                <button
                    onClick={() => {
                        setViewMode('front');
                        setSelectedMuscle('Göğüs');
                    }}
                    style={{ ...styles.toggleBtn, ...(viewMode === 'front' ? styles.toggleBtnActive : {}) }}
                >
                    Ön Vücut (Anterior / Ön Kaslar)
                </button>
                <button
                    onClick={() => {
                        setViewMode('back');
                        setSelectedMuscle('Sırt & Kanat');
                    }}
                    style={{ ...styles.toggleBtn, ...(viewMode === 'back' ? styles.toggleBtnActive : {}) }}
                >
                    Arka Vücut (Posterior / Sırt & Arka Kaslar)
                </button>
            </div>

            {/* HIZLI KAS SEÇİM ŞERİDİ */}
            <div style={styles.quickPillsRow}>
                {currentMusclesList.map(m => (
                    <button
                        key={m.key}
                        onClick={() => handleMuscleClick(m.key)}
                        style={{
                            ...styles.musclePill,
                            ...(selectedMuscle === m.key ? styles.musclePillActive : {})
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* 1. ÜST BÖLÜM: ORTALANMIŞ İNTERAKTİF ANATOMİ MODELİ */}
            <div style={styles.anatomyContainer}>
                <div style={styles.anatomyCard}>
                    {/* Aktif Kas Durum Çubuğu */}
                    <div style={styles.activeNoticeBanner}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.activeDot}></div>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.92rem' }}>
                                SEÇİLİ BÖLGE: <span style={{ color: '#ff4d6d' }}>{selectedMuscle.toUpperCase()}</span>
                            </span>
                        </div>
                        <span style={styles.badgeExerciseCount}>
                            {filteredExercises.length} Egzersiz
                        </span>
                    </div>

                    {/* Model Çerçevesi */}
                    <div style={styles.svgContainer}>
                        {viewMode === 'front' ? (
                            /* ===================== ÖN VÜCUT SVG ===================== */
                            <svg viewBox="0 0 440 680" style={styles.anatomySvg}>
                                <defs>
                                    <filter id="neonGlowFront" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="7" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Kafa */}
                                <path d="M220 35 C195 35 185 60 185 85 C185 115 200 135 220 135 C240 135 255 115 255 85 C255 60 245 35 220 35 Z"
                                    fill="#1a1d24" stroke="#2d3340" strokeWidth="2" />
                                {/* Boyun */}
                                <path d="M208 130 L208 152 C214 154 226 154 232 152 L232 130 Z"
                                    fill="#1f232c" stroke="#2d3340" strokeWidth="1.5" />

                                {/* 1. OMUZLAR (DELTOIDLER) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Omuz')}
                                    onMouseEnter={() => setHoveredMuscle('Omuz')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Omuz') ? 'url(#neonGlowFront)' : 'none'}
                                >
                                    <path d="M178 152 C150 155 125 175 130 205 C142 215 168 208 178 190 C182 175 180 160 178 152 Z"
                                        fill={getMuscleFill('Omuz')} stroke={getMuscleStroke('Omuz')} strokeWidth="2" />
                                    <path d="M262 152 C290 155 315 175 310 205 C298 215 272 208 262 190 C258 175 260 160 262 152 Z"
                                        fill={getMuscleFill('Omuz')} stroke={getMuscleStroke('Omuz')} strokeWidth="2" />
                                    <title>Omuz Kasları (Deltoids)</title>
                                </g>

                                {/* 2. GÖĞÜS (PECTORALS) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Göğüs')}
                                    onMouseEnter={() => setHoveredMuscle('Göğüs')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Göğüs') ? 'url(#neonGlowFront)' : 'none'}
                                >
                                    <path d="M182 156 C195 156 216 158 217 215 C200 226 168 222 162 205 C162 182 170 164 182 156 Z"
                                        fill={getMuscleFill('Göğüs')} stroke={getMuscleStroke('Göğüs')} strokeWidth="2.5" />
                                    <path d="M258 156 C245 156 223 158 223 215 C240 226 272 222 278 205 C278 182 270 164 258 156 Z"
                                        fill={getMuscleFill('Göğüs')} stroke={getMuscleStroke('Göğüs')} strokeWidth="2.5" />
                                    <title>Göğüs Kasları (Pectorals)</title>
                                </g>

                                {/* 3. BICEPS (ÖN KOL & PAZI) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Biceps (Ön Kol)')}
                                    onMouseEnter={() => setHoveredMuscle('Biceps (Ön Kol)')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Biceps (Ön Kol)') ? 'url(#neonGlowFront)' : 'none'}
                                >
                                    <path d="M128 210 C118 228 116 265 130 282 C142 276 150 250 144 220 Z"
                                        fill={getMuscleFill('Biceps (Ön Kol)')} stroke={getMuscleStroke('Biceps (Ön Kol)')} strokeWidth="2" />
                                    <path d="M128 288 C116 315 110 360 120 395 C128 395 136 365 142 305 Z"
                                        fill={getMuscleFill('Biceps (Ön Kol)')} stroke={getMuscleStroke('Biceps (Ön Kol)')} strokeWidth="1.5" />
                                    <path d="M312 210 C322 228 324 265 310 282 C298 276 290 250 296 220 Z"
                                        fill={getMuscleFill('Biceps (Ön Kol)')} stroke={getMuscleStroke('Biceps (Ön Kol)')} strokeWidth="2" />
                                    <path d="M312 288 C324 315 330 360 320 395 C312 395 304 365 298 305 Z"
                                        fill={getMuscleFill('Biceps (Ön Kol)')} stroke={getMuscleStroke('Biceps (Ön Kol)')} strokeWidth="1.5" />
                                    <title>Biceps ve Önkol</title>
                                </g>

                                {/* 4. KARIN (ABS / CORE) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Karın (Abs & Core)')}
                                    onMouseEnter={() => setHoveredMuscle('Karın (Abs & Core)')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Karın (Abs & Core)') ? 'url(#neonGlowFront)' : 'none'}
                                >
                                    <rect x="198" y="224" width="20" height="22" rx="4" fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <rect x="222" y="224" width="20" height="22" rx="4" fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <rect x="198" y="250" width="20" height="22" rx="4" fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <rect x="222" y="250" width="20" height="22" rx="4" fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <rect x="200" y="276" width="18" height="24" rx="4" fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <rect x="222" y="276" width="18" height="24" rx="4" fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <path d="M172 230 C182 250 182 280 192 300 L185 305 C172 280 166 250 172 230 Z"
                                        fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <path d="M268 230 C258 250 258 280 248 300 L255 305 C268 280 274 250 268 230 Z"
                                        fill={getMuscleFill('Karın (Abs & Core)')} stroke={getMuscleStroke('Karın (Abs & Core)')} strokeWidth="1.5" />
                                    <title>Karın Kasları (Abs / Core)</title>
                                </g>

                                {/* 5. ÖN BACAK (QUADRICEPS) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Ön Bacak (Quadriceps)')}
                                    onMouseEnter={() => setHoveredMuscle('Ön Bacak (Quadriceps)')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Ön Bacak (Quadriceps)') ? 'url(#neonGlowFront)' : 'none'}
                                >
                                    <path d="M174 320 C156 360 154 445 176 490 C190 490 205 440 210 350 C200 325 186 320 174 320 Z"
                                        fill={getMuscleFill('Ön Bacak (Quadriceps)')} stroke={getMuscleStroke('Ön Bacak (Quadriceps)')} strokeWidth="2.5" />
                                    <path d="M266 320 C284 360 286 445 264 490 C250 490 235 440 230 350 C240 325 254 320 266 320 Z"
                                        fill={getMuscleFill('Ön Bacak (Quadriceps)')} stroke={getMuscleStroke('Ön Bacak (Quadriceps)')} strokeWidth="2.5" />
                                    <circle cx="178" cy="505" r="8" fill="#1c202a" stroke="#2d3340" strokeWidth="1.5" />
                                    <circle cx="262" cy="505" r="8" fill="#1c202a" stroke="#2d3340" strokeWidth="1.5" />
                                    <title>Ön Bacak (Quadriceps)</title>
                                </g>

                                {/* 6. KALF & BALDIR */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Kalf & Baldır')}
                                    onMouseEnter={() => setHoveredMuscle('Kalf & Baldır')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Kalf & Baldır') ? 'url(#neonGlowFront)' : 'none'}
                                >
                                    <path d="M174 520 C162 560 166 615 178 650 C186 650 196 615 198 555 C190 530 180 520 174 520 Z"
                                        fill={getMuscleFill('Kalf & Baldır')} stroke={getMuscleStroke('Kalf & Baldır')} strokeWidth="2" />
                                    <path d="M266 520 C278 560 274 615 262 650 C254 650 244 615 242 555 C250 530 260 520 266 520 Z"
                                        fill={getMuscleFill('Kalf & Baldır')} stroke={getMuscleStroke('Kalf & Baldır')} strokeWidth="2" />
                                    <title>Kalf & Baldır</title>
                                </g>
                            </svg>
                        ) : (
                            /* ===================== ARKA VÜCUT SVG ===================== */
                            <svg viewBox="0 0 440 680" style={styles.anatomySvg}>
                                <defs>
                                    <filter id="neonGlowBack" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="7" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Kafa Arkası */}
                                <path d="M220 35 C195 35 185 60 185 85 C185 115 200 135 220 135 C240 135 255 115 255 85 C255 60 245 35 220 35 Z"
                                    fill="#1a1d24" stroke="#2d3340" strokeWidth="2" />

                                {/* 1. TRAPEZ VE ÜST SIRT */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Trapez & Üst Sırt')}
                                    onMouseEnter={() => setHoveredMuscle('Trapez & Üst Sırt')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Trapez & Üst Sırt') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <polygon points="220,120 182,150 220,205 258,150"
                                        fill={getMuscleFill('Trapez & Üst Sırt')} stroke={getMuscleStroke('Trapez & Üst Sırt')} strokeWidth="2.5" />
                                    <title>Trapez & Üst Sırt</title>
                                </g>

                                {/* 2. ARKA OMUZ (POSTERIOR DELTOIDS) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Arka Omuz')}
                                    onMouseEnter={() => setHoveredMuscle('Arka Omuz')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Arka Omuz') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <path d="M176 150 C150 152 128 175 132 205 C145 210 166 202 174 185 Z"
                                        fill={getMuscleFill('Arka Omuz')} stroke={getMuscleStroke('Arka Omuz')} strokeWidth="2" />
                                    <path d="M264 150 C290 152 312 175 308 205 C295 210 274 202 266 185 Z"
                                        fill={getMuscleFill('Arka Omuz')} stroke={getMuscleStroke('Arka Omuz')} strokeWidth="2" />
                                    <title>Arka Omuz (Rear Delts)</title>
                                </g>

                                {/* 3. SIRT & KANAT (LATISSIMUS DORSI / LATS) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Sırt & Kanat')}
                                    onMouseEnter={() => setHoveredMuscle('Sırt & Kanat')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Sırt & Kanat') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <path d="M180 160 C155 195 160 255 195 285 C202 260 205 200 216 190 Z"
                                        fill={getMuscleFill('Sırt & Kanat')} stroke={getMuscleStroke('Sırt & Kanat')} strokeWidth="2.5" />
                                    <path d="M260 160 C285 195 280 255 245 285 C238 260 235 200 224 190 Z"
                                        fill={getMuscleFill('Sırt & Kanat')} stroke={getMuscleStroke('Sırt & Kanat')} strokeWidth="2.5" />
                                    <title>Kanat & Sırt (Lats)</title>
                                </g>

                                {/* 4. TRICEPS (ARKA KOL) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Triceps (Arka Kol)')}
                                    onMouseEnter={() => setHoveredMuscle('Triceps (Arka Kol)')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Triceps (Arka Kol)') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <path d="M130 205 C118 225 116 265 132 285 C144 275 148 245 144 215 Z"
                                        fill={getMuscleFill('Triceps (Arka Kol)')} stroke={getMuscleStroke('Triceps (Arka Kol)')} strokeWidth="2" />
                                    <path d="M130 290 C118 318 112 360 122 395 C130 395 138 365 144 305 Z"
                                        fill={getMuscleFill('Triceps (Arka Kol)')} stroke={getMuscleStroke('Triceps (Arka Kol)')} strokeWidth="1.5" />
                                    <path d="M310 205 C322 225 324 265 308 285 C296 275 292 245 296 215 Z"
                                        fill={getMuscleFill('Triceps (Arka Kol)')} stroke={getMuscleStroke('Triceps (Arka Kol)')} strokeWidth="2" />
                                    <path d="M310 290 C322 318 328 360 318 395 C310 395 302 365 296 305 Z"
                                        fill={getMuscleFill('Triceps (Arka Kol)')} stroke={getMuscleStroke('Triceps (Arka Kol)')} strokeWidth="1.5" />
                                    <title>Triceps (Arka Kol)</title>
                                </g>

                                {/* 5. BEL & ALT SIRT */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Bel & Alt Sırt')}
                                    onMouseEnter={() => setHoveredMuscle('Bel & Alt Sırt')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Bel & Alt Sırt') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <rect x="204" y="270" width="14" height="35" rx="3"
                                        fill={getMuscleFill('Bel & Alt Sırt')} stroke={getMuscleStroke('Bel & Alt Sırt')} strokeWidth="1.5" />
                                    <rect x="222" y="270" width="14" height="35" rx="3"
                                        fill={getMuscleFill('Bel & Alt Sırt')} stroke={getMuscleStroke('Bel & Alt Sırt')} strokeWidth="1.5" />
                                    <title>Bel ve Alt Sırt</title>
                                </g>

                                {/* 6. KALÇA (GLUTEUS) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Kalça (Gluteus)')}
                                    onMouseEnter={() => setHoveredMuscle('Kalça (Gluteus)')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Kalça (Gluteus)') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <path d="M178 310 C162 335 165 375 216 375 C218 340 200 315 178 310 Z"
                                        fill={getMuscleFill('Kalça (Gluteus)')} stroke={getMuscleStroke('Kalça (Gluteus)')} strokeWidth="2.5" />
                                    <path d="M262 310 C278 335 275 375 224 375 C222 340 240 315 262 310 Z"
                                        fill={getMuscleFill('Kalça (Gluteus)')} stroke={getMuscleStroke('Kalça (Gluteus)')} strokeWidth="2.5" />
                                    <title>Kalça (Gluteus)</title>
                                </g>

                                {/* 7. ARKA BACAK (HAMSTRINGS) */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Arka Bacak (Hamstrings)')}
                                    onMouseEnter={() => setHoveredMuscle('Arka Bacak (Hamstrings)')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Arka Bacak (Hamstrings)') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <path d="M174 385 C162 425 166 470 182 495 C196 495 208 450 212 385 Z"
                                        fill={getMuscleFill('Arka Bacak (Hamstrings)')} stroke={getMuscleStroke('Arka Bacak (Hamstrings)')} strokeWidth="2.5" />
                                    <path d="M266 385 C278 425 274 470 258 495 C244 495 232 450 228 385 Z"
                                        fill={getMuscleFill('Arka Bacak (Hamstrings)')} stroke={getMuscleStroke('Arka Bacak (Hamstrings)')} strokeWidth="2.5" />
                                    <title>Arka Bacak (Hamstrings)</title>
                                </g>

                                {/* 8. ARKA BALDIR & KALF */}
                                <g
                                    cursor="pointer"
                                    onClick={() => handleMuscleClick('Kalf & Baldır')}
                                    onMouseEnter={() => setHoveredMuscle('Kalf & Baldır')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    filter={isMuscleActive('Kalf & Baldır') ? 'url(#neonGlowBack)' : 'none'}
                                >
                                    <path d="M174 520 C158 560 162 615 176 650 C186 650 198 615 198 555 C190 530 180 520 174 520 Z"
                                        fill={getMuscleFill('Kalf & Baldır')} stroke={getMuscleStroke('Kalf & Baldır')} strokeWidth="2.5" />
                                    <path d="M266 520 C282 560 278 615 264 650 C254 650 242 615 242 555 C250 530 260 520 266 520 Z"
                                        fill={getMuscleFill('Kalf & Baldır')} stroke={getMuscleStroke('Kalf & Baldır')} strokeWidth="2.5" />
                                    <title>Kalf / Arka Baldır</title>
                                </g>
                            </svg>
                        )}
                    </div>

                    {/* VÜCUT ALTI DOĞRUDAN HAREKETLERE İNME BUTONU */}
                    <div
                        onClick={() => scrollToExerciseSection()}
                        style={styles.selectedMuscleBar}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>👇</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ color: '#fff', fontWeight: '900', fontSize: '0.98rem' }}>
                                    🎯 {selectedMuscle.toUpperCase()} BÖLGESİ SEÇİLDİ ({filteredExercises.length} HAREKET)
                                </div>
                                <div style={{ color: '#ff4d6d', fontSize: '0.82rem', fontWeight: 'bold' }}>
                                    Hareketler aşağıda listelendi — Görmek için dokunun 👇
                                </div>
                            </div>
                        </div>
                        <div style={styles.viewExercisesActionBtn}>
                            Aşağıya İn ({filteredExercises.length}) <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ALT BÖLÜM: DOĞRUDAN VÜCUDUN ALTINDA YER ALAN FERAH HAREKETLER LİSTESİ */}
            <div id="exercise-results-anchor" style={styles.exerciseSection}>
                {/* Üst Kart: Başlık ve Arama */}
                <div style={styles.exerciseTopCard}>
                    <div style={styles.exerciseListHeader}>
                        <div>
                            <h3 style={styles.exerciseListTitle}>
                                {selectedMuscle.toUpperCase()} BÖLGESİ EGZERSİZLERİ
                            </h3>
                            <span style={styles.exerciseListSubtitle}>
                                N1FIT Hareket Kütüphanesindeki onaylı teknikler ve video rehberler
                            </span>
                        </div>
                        <span style={styles.foundBadge}>
                            {filteredExercises.length} Hareket
                        </span>
                    </div>

                    {/* Arama Çubuğu */}
                    <div style={styles.searchBar}>
                        <Search size={18} color="#777" />
                        <input
                            type="text"
                            placeholder={`${selectedMuscle} hareketleri içinde ara...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Egzersiz Kartları Izgarası (Geniş & Ferah) */}
                {loading ? (
                    <div style={styles.loadingBox}>
                        <div className="spinner"></div>
                        <p style={{ color: '#888', marginTop: '10px' }}>Hareketler yükleniyor...</p>
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <div style={styles.emptyBox}>
                        <Dumbbell size={40} color="#444" />
                        <h4 style={{ color: '#fff', marginTop: '12px', marginBottom: '4px' }}>Egzersiz Bulunamadı</h4>
                        <p style={{ color: '#777', fontSize: '0.85rem' }}>
                            Arama kriterine uygun hareket bulunamadı.
                        </p>
                    </div>
                ) : (
                    <div style={styles.exerciseGrid}>
                        {filteredExercises.map(item => {
                            return (
                                <div key={item.id} style={styles.exerciseCard}>
                                    <div style={styles.exerciseCardHeader}>
                                        <div style={styles.exerciseIconBox}>
                                            <Dumbbell size={20} color="#d90429" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={styles.exerciseName}>{item.name}</h4>
                                            <div style={styles.exerciseTags}>
                                                <span style={styles.muscleBadge}>
                                                    {item.muscleGroup || selectedMuscle}
                                                </span>
                                                {item.equipment && (
                                                    <span style={styles.equipmentBadge}>
                                                        {item.equipment}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {item.videoUrl && (
                                            <button
                                                onClick={() => setSelectedVideo({ url: item.videoUrl, title: item.name })}
                                                style={styles.watchVideoBtn}
                                                title="Form Videosunu İzle"
                                            >
                                                <Play size={14} fill="#fff" /> Video İzle
                                            </button>
                                        )}
                                    </div>

                                    {item.description && (
                                        <p style={styles.exerciseDesc}>
                                            {item.description}
                                        </p>
                                    )}

                                    <div style={styles.exerciseCardFooter}>
                                        <div style={styles.tipRow}>
                                            <CheckCircle2 size={13} color="#22c55e" />
                                            <span>Önerilen: 3-4 Set × 8-12 Tekrar | Kontrollü Form</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* YOUTUBE VİDEO MODAL */}
            {selectedVideo && (
                <div style={styles.modalOverlay} onClick={() => setSelectedVideo(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Video size={18} color="#d90429" />
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    {selectedVideo.title} - Doğru Form Rehberi
                                </h3>
                            </div>
                            <button onClick={() => setSelectedVideo(null)} style={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={styles.videoWrapper}>
                            {getYouTubeEmbedUrl(selectedVideo.url) ? (
                                <iframe
                                    src={`${getYouTubeEmbedUrl(selectedVideo.url)}?autoplay=1`}
                                    title={selectedVideo.title}
                                    style={styles.videoIframe}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
                                    <p>Video doğrudan oynatılamadı. Aşağıdaki bağlantıdan izleyebilirsiniz:</p>
                                    <a
                                        href={selectedVideo.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: '#d90429', fontWeight: 'bold', textDecoration: 'underline' }}
                                    >
                                        YouTube'da Aç
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 16px 50px 16px',
        fontFamily: "'Inter', sans-serif"
    },
    viewToggleContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        margin: '10px 0 16px 0',
        flexWrap: 'wrap'
    },
    toggleBtn: {
        padding: '10px 22px',
        backgroundColor: '#161922',
        color: '#8e96a4',
        border: '1px solid #2a3040',
        borderRadius: '30px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    toggleBtnActive: {
        backgroundColor: '#d90429',
        color: '#ffffff',
        borderColor: '#d90429',
        boxShadow: '0 4px 16px rgba(217, 4, 41, 0.45)'
    },
    quickPillsRow: {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '2px 2px 16px 2px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    musclePill: {
        backgroundColor: '#141720',
        color: '#9ba3b2',
        border: '1px solid #252a38',
        padding: '6px 14px',
        borderRadius: '18px',
        fontSize: '0.82rem',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s'
    },
    musclePillActive: {
        backgroundColor: 'rgba(217, 4, 41, 0.2)',
        borderColor: '#d90429',
        color: '#ff4d6d',
        fontWeight: 'bold'
    },
    anatomyContainer: {
        maxWidth: '540px',
        margin: '0 auto 28px auto',
        width: '100%'
    },
    anatomyCard: {
        backgroundColor: '#101218',
        borderRadius: '16px',
        border: '1px solid #1e2330',
        padding: '18px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        position: 'relative'
    },
    activeNoticeBanner: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#161922',
        padding: '8px 14px',
        borderRadius: '10px',
        border: '1px solid #272d3d',
        marginBottom: '14px'
    },
    activeDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#d90429',
        boxShadow: '0 0 8px #d90429'
    },
    badgeExerciseCount: {
        backgroundColor: 'rgba(217, 4, 41, 0.15)',
        color: '#ff4d6d',
        border: '1px solid rgba(217, 4, 41, 0.4)',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 'bold'
    },
    svgContainer: {
        width: '100%',
        maxHeight: '620px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0c0d12',
        borderRadius: '12px',
        padding: '15px 10px',
        border: '1px solid #1a1e28'
    },
    anatomySvg: {
        width: '100%',
        height: 'auto',
        maxHeight: '580px',
        display: 'block'
    },
    selectedMuscleBar: {
        marginTop: '14px',
        backgroundColor: 'rgba(217, 4, 41, 0.15)',
        border: '1px solid #d90429',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(217, 4, 41, 0.25)'
    },
    viewExercisesActionBtn: {
        backgroundColor: '#d90429',
        color: '#fff',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '0.82rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    },
    exerciseSection: {
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        paddingTop: '6px'
    },
    exerciseTopCard: {
        backgroundColor: '#101218',
        borderRadius: '14px',
        border: '1px solid #1e2330',
        padding: '18px 20px',
        marginBottom: '18px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
    },
    exerciseListHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '14px',
        borderBottom: '1px solid #1d222e',
        marginBottom: '16px'
    },
    exerciseListTitle: {
        fontSize: '1.15rem',
        fontWeight: 'bold',
        color: '#ffffff',
        margin: '0 0 2px 0',
        letterSpacing: '0.5px'
    },
    exerciseListSubtitle: {
        fontSize: '0.82rem',
        color: '#888'
    },
    foundBadge: {
        backgroundColor: '#1a1f2c',
        color: '#bbb',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        border: '1px solid #2a3142'
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#161922',
        border: '1px solid #272d3d',
        borderRadius: '10px',
        padding: '10px 14px',
        gap: '10px'
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ffffff',
        fontSize: '0.9rem',
        outline: 'none'
    },
    clearSearchBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#777',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center'
    },
    exerciseGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px',
        width: '100%'
    },
    exerciseCard: {
        backgroundColor: '#101218',
        border: '1px solid #1e2330',
        borderRadius: '14px',
        padding: '16px 18px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    },
    exerciseCardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '10px'
    },
    exerciseIconBox: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: 'rgba(217, 4, 41, 0.12)',
        border: '1px solid rgba(217, 4, 41, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    exerciseName: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#ffffff',
        margin: '0 0 4px 0'
    },
    exerciseTags: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
    },
    muscleBadge: {
        backgroundColor: 'rgba(217, 4, 41, 0.15)',
        color: '#ff4d6d',
        fontSize: '0.72rem',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '10px'
    },
    equipmentBadge: {
        backgroundColor: '#202533',
        color: '#9aa2b1',
        fontSize: '0.72rem',
        padding: '2px 8px',
        borderRadius: '10px'
    },
    watchVideoBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#d90429',
        color: '#ffffff',
        border: 'none',
        padding: '7px 12px',
        borderRadius: '6px',
        fontSize: '0.78rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(217, 4, 41, 0.35)',
        transition: 'background-color 0.2s',
        flexShrink: 0
    },
    exerciseDesc: {
        color: '#9aa2b1',
        fontSize: '0.85rem',
        lineHeight: '1.45',
        margin: '8px 0 12px 0'
    },
    exerciseCardFooter: {
        borderTop: '1px solid #1c212e',
        paddingTop: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    tipRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#7e8799',
        fontSize: '0.78rem'
    },
    loadingBox: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    emptyBox: {
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: '#101218',
        borderRadius: '14px',
        border: '1px solid #1e2330'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
    },
    modalContent: {
        backgroundColor: '#141720',
        borderRadius: '14px',
        border: '1px solid #2a3142',
        maxWidth: '750px',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid #202636'
    },
    closeBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#aaa',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center'
    },
    videoWrapper: {
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        backgroundColor: '#000'
    },
    videoIframe: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    }
};

export default InteractiveBodyExerciseMap;
