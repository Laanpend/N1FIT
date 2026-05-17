import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const WorkoutTab = () => {
    const [workoutProgram, setWorkoutProgram] = useState({ days: [] });
    const [expandedDay, setExpandedDay] = useState(null);
    const [playingVideo, setPlayingVideo] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) return;
        const fetchData = async () => {
            try {
                // ARTIK ADMİN KAPISINA GİTMİYORUZ, HER ŞEY BURADAN HAZIR GELİYOR AMQ!
                const progRes = await api.get('/Member/my-workout');
                setWorkoutProgram(progRes.data || { days: [] });
            } catch (err) {
                console.error("Program çekilirken motor yaktı:", err);
            }
        };
        fetchData();
    }, []);

    if (!workoutProgram.days || workoutProgram.days.length === 0) {
        return <div style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>Hocan henüz sana program yazmamış aslanım, git darlamaya başla!</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#d90429', borderBottom: '2px solid #333', paddingBottom: '10px' }}>ANTRENMAN PROGRAMIN</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {workoutProgram.days.map((day, dayIdx) => (
                    <div key={dayIdx} style={{ backgroundColor: '#111', borderRadius: '8px', overflow: 'hidden', border: '1px solid #222' }}>

                        <div
                            onClick={() => {
                                setExpandedDay(expandedDay === dayIdx ? null : dayIdx);
                                setPlayingVideo(null);
                            }}
                            style={{ padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderLeft: '4px solid #d90429' }}
                        >
                            <h3 style={{ margin: 0, color: 'white' }}>{day.title}</h3>
                            <span style={{ color: '#d90429', fontWeight: 'bold' }}>{expandedDay === dayIdx ? '▼ Kapat' : '▶ İncele'}</span>
                        </div>

                        {expandedDay === dayIdx && (
                            <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                {day.exercises.map((ex, i) => {
                                    // C#'TAN GELEN HAZIR İSİM VE VİDEOYU (ex.name, ex.videoUrl) KULLANIYORUZ!
                                    const videoId = ex.videoUrl?.split('v=')?.[1]?.split('&')?.[0];
                                    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : `https://placehold.co/300x200/111111/d90429.png?text=VIDEO+YOK`;
                                    const uniqueKey = `${dayIdx}-${i}`;
                                    const isCardio = ex.muscleGroup === "Kardiyo";

                                    return (
                                        <div key={i} style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>

                                            <div style={{ position: 'relative', height: '160px', backgroundColor: '#000' }}>
                                                {playingVideo === uniqueKey && videoId ? (
                                                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} title={ex.name} frameBorder="0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen></iframe>
                                                ) : (
                                                    <img
                                                        src={thumbUrl}
                                                        alt={ex.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: videoId ? 'pointer' : 'default' }}
                                                        onClick={() => { if (videoId) setPlayingVideo(uniqueKey); }}
                                                    />
                                                )}
                                            </div>

                                            <div style={{ padding: '12px' }}>
                                                {/* İSİM DİREKT BURADAN EKRANA BASILIYOR */}
                                                <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '8px', fontSize: '1.1rem' }}>
                                                    <span style={{ color: '#d90429', marginRight: '8px' }}>{i + 1}. Hareket:</span>
                                                    {ex.name || "Bilinmeyen Hareket"}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.9rem' }}>
                                                    {isCardio ? (
                                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                            {ex.duration && <span>Süre: <b style={{ color: '#4ade80' }}>{ex.duration} dk</b></span>}
                                                            {ex.speed && <span>Hız: <b style={{ color: '#4ade80' }}>{ex.speed}</b></span>}
                                                            {ex.incline && <span>Eğim: <b style={{ color: '#4ade80' }}>{ex.incline}</b></span>}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span>Set: <b style={{ color: '#4ade80' }}>{ex.sets}</b></span>
                                                            <span>Tekrar: <b style={{ color: '#4ade80' }}>{ex.reps}</b></span>
                                                        </>
                                                    )}
                                                </div>
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
    );
};

export default WorkoutTab;