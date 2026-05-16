import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const MeasurementTab = () => {
    const [measurements, setMeasurements] = useState([]);

    useEffect(() => {
        api.get('/Member/my-measurements')
           .then(res => setMeasurements(res.data || []))
           .catch(err => console.error("Ölçüler patladı:", err));
    }, []);

    if (measurements.length === 0) {
        return <div style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>Daha hiç ölçün alınmamış dayı, hocana söyle mezurayı getirsin!</div>;
    }

    // ==========================================
    // 🛠️ FARK (DELTA) HESAPLAMA MOTORU
    // ==========================================
    const renderDiff = (current, previous, isWeightOrFat = false) => {
        if (current == null || previous == null) return null; // Veri yoksa hesaplama
        const diff = parseFloat((current - previous).toFixed(2));
        if (diff === 0) return null; // Fark yoksa boş bırak

        let color = '';
        // KİLO/BEL MANTIĞI: Artış kötüdür (Kırmızı), azalış iyidir (Yeşil)
        if (isWeightOrFat) {
            color = diff > 0 ? '#d90429' : '#4ade80'; 
        } 
        // KAS MANTIĞI: Artış iyidir (Yeşil), azalış kötüdür (Kırmızı)
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
            <h2 style={{ color: '#f59e0b', borderBottom: '2px solid #333', paddingBottom: '10px' }}>VÜCUT ÖLÇÜLERİN</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {measurements.map((m, index) => {
                    // DİZİ TERSTEN GELDİĞİ İÇİN BİR ÖNCEKİ ÖLÇÜM (ESKİSİ) BİR ALTTAKİDİR (index + 1)
                    const prev = measurements[index + 1];

                    return (
                        <div key={index} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                            <h4 style={{ color: 'white', marginTop: 0, marginBottom: '15px' }}>📅 {new Date(m.date).toLocaleDateString('tr-TR')}</h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', color: '#aaa', fontSize: '1rem' }}>
                                {/* isWeightOrFat = true olanlar Kilo ve Bel (Artarsa kırmızı yakar) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                    <span>Kilo:</span> 
                                    <div><b style={{ color: '#f59e0b' }}>{m.weight} kg</b> {renderDiff(m.weight, prev?.weight, true)}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                    <span>Bel:</span> 
                                    <div><b style={{ color: '#f59e0b' }}>{m.waist} cm</b> {renderDiff(m.waist, prev?.waist, true)}</div>
                                </div>
                                
                                {/* isWeightOrFat = false olanlar Kaslar (Artarsa yeşil yakar) */}
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
                                
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MeasurementTab;