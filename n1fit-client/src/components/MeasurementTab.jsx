import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import BodyCompositionCalculator from './BodyCompositionCalculator';

const MeasurementTab = () => {
    const [measurements, setMeasurements] = useState([]);
    const [subTab, setSubTab] = useState('history'); // 'history' | 'calculator'

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) return;
        api.get('/Member/my-measurements')
           .then(res => setMeasurements(res.data || []))
           .catch(err => console.error("Ölçüler çekilirken hata:", err));
    }, []);

    // ==========================================
    // FARK (DELTA) HESAPLAMA MOTORU
    // ==========================================
    const renderDiff = (current, previous, isWeightOrFat = false) => {
        if (current == null || previous == null || current === '' || previous === '') return null;
        const diff = parseFloat((Number(current) - Number(previous)).toFixed(2));
        if (isNaN(diff) || diff === 0) return null;

        let color = '';
        // KİLO / BEL / KALÇA / BACAK MANTIĞI: Artış kırmızı (#d90429), azalış yeşil (#4ade80)
        if (isWeightOrFat) {
            color = diff > 0 ? '#d90429' : '#4ade80'; 
        } 
        // KAS MANTIĞI: Artış yeşil (#4ade80), azalış kırmızı (#d90429)
        else {
            color = diff > 0 ? '#4ade80' : '#d90429'; 
        }

        const sign = diff > 0 ? '+' : '';
        return (
            <span style={{ color: color, fontSize: '0.9rem', marginLeft: '10px', fontWeight: '900' }}>
                ({sign}{diff})
            </span>
        );
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* SAYFA İÇİ ALT SEKMELER (SEGMENTED SUB-TABS) */}
            <div style={styles.subTabContainer}>
                <button
                    type="button"
                    onClick={() => setSubTab('history')}
                    style={{
                        ...styles.subTabBtn,
                        backgroundColor: subTab === 'history' ? '#f59e0b' : '#161616',
                        color: subTab === 'history' ? '#000' : '#aaa',
                        borderColor: subTab === 'history' ? '#f59e0b' : '#2a2a2a'
                    }}
                >
                    📏 Vücut Ölçülerim ({measurements.length})
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('calculator')}
                    style={{
                        ...styles.subTabBtn,
                        backgroundColor: subTab === 'calculator' ? '#f59e0b' : '#161616',
                        color: subTab === 'calculator' ? '#000' : '#aaa',
                        borderColor: subTab === 'calculator' ? '#f59e0b' : '#2a2a2a'
                    }}
                >
                    ⚡ Yağ Oranı & FFMI Hesapla
                </button>
            </div>

            {subTab === 'history' && (
                <>
                    <h2 style={{ color: '#f59e0b', borderBottom: '2px solid #333', paddingBottom: '10px', marginTop: 0 }}>
                        VÜCUT ÖLÇÜLERİN
                    </h2>

                    {measurements.length === 0 ? (
                        <div style={{ color: '#aaa', textAlign: 'center', marginTop: '40px', padding: '30px', backgroundColor: '#111', borderRadius: '8px' }}>
                            Daha hiç ölçün alınmamış. Yağ oranını hesaplamak için üstteki <b>"⚡ Yağ Oranı & FFMI Hesapla"</b> sekmesini kullanabilirsin.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                            {measurements.map((m, index) => {
                                const prev = measurements[index + 1];

                                return (
                                    <div key={index} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                        <h4 style={{ color: 'white', marginTop: 0, marginBottom: '15px' }}>📅 {new Date(m.date || m.recordDate).toLocaleDateString('tr-TR')}</h4>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', color: '#aaa', fontSize: '1rem' }}>
                                            {/* isWeightOrFat = true olanlar: Kilo, Bel, Kalça, Sağ Bacak, Sol Bacak (Azalış yeşil, artış kırmızı) */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Kilo:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.weight} kg</b> {renderDiff(m.weight, prev?.weight, true)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Bel:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.waist} cm</b> {renderDiff(m.waist, prev?.waist, true)}</div>
                                            </div>
                                            
                                            {/* isWeightOrFat = false olanlar: Omuz, Göğüs, Sağ Kol, Sol Kol, Boyun */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Omuz:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.shoulder} cm</b> {renderDiff(m.shoulder, prev?.shoulder, false)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Göğüs:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.chest} cm</b> {renderDiff(m.chest, prev?.chest, false)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Sağ Kol:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.rightArm} cm</b> {renderDiff(m.rightArm, prev?.rightArm, false)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Sol Kol:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.leftArm} cm</b> {renderDiff(m.leftArm, prev?.leftArm, false)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Boyun:</span> 
                                                <div><b style={{ color: '#f59e0b' }}>{m.neck} cm</b> {renderDiff(m.neck, prev?.neck, false)}</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Kalça:</span> 
                                                <div>
                                                    {m.hips != null ? (
                                                        <><b style={{ color: '#f59e0b' }}>{m.hips} cm</b> {renderDiff(m.hips, prev?.hips, true)}</>
                                                    ) : (
                                                        <b style={{ color: '#666' }}>-</b>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Sağ Bacak:</span> 
                                                <div>
                                                    {m.rightLeg != null ? (
                                                        <><b style={{ color: '#f59e0b' }}>{m.rightLeg} cm</b> {renderDiff(m.rightLeg, prev?.rightLeg, true)}</>
                                                    ) : (
                                                        <b style={{ color: '#666' }}>-</b>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                <span>Sol Bacak:</span> 
                                                <div>
                                                    {m.leftLeg != null ? (
                                                        <><b style={{ color: '#f59e0b' }}>{m.leftLeg} cm</b> {renderDiff(m.leftLeg, prev?.leftLeg, true)}</>
                                                    ) : (
                                                        <b style={{ color: '#666' }}>-</b>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {subTab === 'calculator' && (
                <div style={{ marginTop: '-20px' }}>
                    <BodyCompositionCalculator measurements={measurements} />
                </div>
            )}
        </div>
    );
};

const styles = {
    subTabContainer: {
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        backgroundColor: '#0f0f0f',
        padding: '6px',
        borderRadius: '10px',
        border: '1px solid #222'
    },
    subTabBtn: {
        flex: 1,
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid transparent',
        cursor: 'pointer',
        fontWeight: '800',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease'
    }
};

export default MeasurementTab;
