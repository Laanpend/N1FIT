import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const DietTab = () => {
    const [dietProgram, setDietProgram] = useState({ meals: [] });

    useEffect(() => {
        // C# tarafında bu ucu bağlaman lazım!
        api.get('/Member/my-diet')
            .then(res => setDietProgram(res.data || { meals: [] }))
            .catch(err => console.error("Diyet çekilemedi:", err));
    }, []);

    if (!dietProgram.meals || dietProgram.meals.length === 0) {
        return <div style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>Kardeşim sana daha diyet yazılmamış, pilav tavuğa devam!</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#3b82f6', borderBottom: '2px solid #333', paddingBottom: '10px' }}>BESLENME PROGRAMIN</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {dietProgram.meals.map((meal, index) => (
                    // DietTab.jsx içindeki meal div'ini bununla değiştir:
                    <div key={index} style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                        <h3 style={{ color: 'white', marginTop: 0, marginBottom: '10px' }}>
                            {meal.mealName} <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>({meal.time || "Saat Belirtilmemiş"})</span>
                        </h3>

                        {/* Veritabanından gelen Content düz metin olduğu için tek parça basıyoruz! */}
                        <div style={{ color: '#aaa', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            🥩 {meal.content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DietTab;