import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Globe, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosConfig';

const PackageLibrary = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [form, setForm] = useState({ name: '', price: '', durationMonths: '', showOnWebsite: false });
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => { fetchPackages(); }, []);

    const fetchPackages = async () => {
        try {
            const res = await api.get('/Admin/packages');
            setPackages(res.data || []);
        } catch (err) { console.error(err); }
    };

    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            setForm({
                name: pkg.name,
                price: pkg.price,
                durationMonths: pkg.durationMonths,
                showOnWebsite: !!pkg.showOnWebsite
            });
        } else {
            setEditingPkg(null);
            setForm({ name: '', price: '', durationMonths: '', showOnWebsite: false });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: form.name.trim(),
                price: parseFloat(form.price) || 0,
                durationMonths: parseInt(form.durationMonths, 10) || 1,
                showOnWebsite: !!form.showOnWebsite
            };
            if (editingPkg) await api.put(`/Admin/packages/${editingPkg.id}`, payload);
            else await api.post('/Admin/packages', payload);
            setShowModal(false);
            fetchPackages();
        } catch {
            alert("Paket kaydedilirken bir hata oluştu!");
        }
    };

    const handleToggleWebsite = async (pkg) => {
        setTogglingId(pkg.id);
        try {
            const res = await api.patch(`/Admin/packages/${pkg.id}/toggle-website`);
            const newState = res.data?.showOnWebsite ?? !pkg.showOnWebsite;
            setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, showOnWebsite: newState } : p));
        } catch (err) {
            console.error(err);
            alert("Vitrin durumu güncellenirken hata oluştu!");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu paketi siliyoruz, emin misin?")) {
            await api.delete(`/Admin/packages/${id}`);
            fetchPackages();
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '30px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <ArrowLeft size={18} /> Geri Dön
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCard color="#d90429" /> Üyelik Paketleri
                    </h2>
                    <p style={{ color: '#888', margin: '6px 0 0 0', fontSize: '0.88rem' }}>
                        Web sitesinde sergilenmesini istediğiniz paketleri <strong>"Web Sitesine Aç"</strong> tuşuyla vitrine ekleyebilirsiniz.
                    </p>
                </div>
                <button onClick={() => openModal()} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Yeni Paket Ekle
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {packages.map(p => {
                    const isVisible = !!p.showOnWebsite;
                    return (
                        <div key={p.id} style={{
                            backgroundColor: '#111317',
                            border: isVisible ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #23272f',
                            borderRadius: '12px',
                            padding: '22px',
                            position: 'relative',
                            boxShadow: isVisible ? '0 4px 20px rgba(34, 197, 94, 0.1)' : 'none'
                        }}>
                            {/* Vitrin Rozeti */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>{p.name}</h3>
                                {isVisible ? (
                                    <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Globe size={13} /> Vitrinde Aktif
                                    </span>
                                ) : (
                                    <span style={{ backgroundColor: 'rgba(150, 150, 150, 0.1)', color: '#888', border: '1px solid #333', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <EyeOff size={13} /> Vitrinde Gizli
                                    </span>
                                )}
                            </div>

                            <p style={{ color: '#4ade80', fontSize: '1.6rem', fontWeight: 'bold', margin: '8px 0' }}>{p.price} TL</p>
                            <p style={{ color: '#888', margin: '0 0 16px 0', fontSize: '0.9rem' }}>Süre: <strong style={{ color: '#ddd' }}>{p.durationMonths} Ay</strong></p>

                            {/* Web Sitesine Aç / Vitrinden Kaldır Toggle Butonu */}
                            <div style={{ marginBottom: '14px' }}>
                                <button
                                    type="button"
                                    disabled={togglingId === p.id}
                                    onClick={() => handleToggleWebsite(p)}
                                    style={{
                                        width: '100%',
                                        padding: '9px 14px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        backgroundColor: isVisible ? 'rgba(217, 4, 41, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                                        color: isVisible ? '#ff4d6d' : '#4ade80',
                                        border: isVisible ? '1px solid rgba(217, 4, 41, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)'
                                    }}
                                >
                                    {isVisible ? (
                                        <>
                                            <EyeOff size={16} /> Web Sitesinden Kaldır
                                        </>
                                    ) : (
                                        <>
                                            <Globe size={16} /> 🌐 Web Sitesine Aç
                                        </>
                                    )}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => openModal(p)} style={{ flex: 1, padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Düzenle</button>
                                <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '8px', background: 'transparent', color: '#d90429', border: '1px solid #d90429', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Sil</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#111317', padding: '30px', borderRadius: '12px', border: '2px solid #d90429', width: '420px', maxWidth: '90%' }}>
                        <h3 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>{editingPkg ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Paket Adı</label>
                                <input placeholder="Örn: 3 Aylık Standart" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px', background: '#1c1f26', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Fiyat (TL)</label>
                                <input type="number" placeholder="Örn: 1500" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ width: '100%', padding: '10px', background: '#1c1f26', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Süre (Ay)</label>
                                <input type="number" placeholder="Örn: 3" value={form.durationMonths} onChange={e => setForm({ ...form, durationMonths: e.target.value })} style={{ width: '100%', padding: '10px', background: '#1c1f26', color: 'white', border: '1px solid #333', borderRadius: '6px', boxSizing: 'border-box' }} required />
                            </div>

                            {/* Web Sitesinde Göster Checkbox */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer', backgroundColor: '#1c1f26', padding: '10px', borderRadius: '6px', border: '1px solid #333' }}>
                                <input
                                    type="checkbox"
                                    checked={form.showOnWebsite}
                                    onChange={e => setForm({ ...form, showOnWebsite: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: '#d90429' }}
                                />
                                <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>🌐 Web sitesi ana sayfasında göster (Vitrinde yer alsın)</span>
                            </label>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#d90429', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackageLibrary;
