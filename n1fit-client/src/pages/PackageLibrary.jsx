import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import api from '../api/axiosConfig';

const PackageLibrary = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [form, setForm] = useState({ name: '', price: '', durationMonths: '' });

    useEffect(() => { fetchPackages(); }, []);

    const fetchPackages = async () => {
        try {
            const res = await api.get('/Admin/packages');
            setPackages(res.data);
        } catch (err) { console.error(err); }
    };

    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            setForm({ name: pkg.name, price: pkg.price, durationMonths: pkg.durationMonths });
        } else {
            setEditingPkg(null);
            setForm({ name: '', price: '', durationMonths: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingPkg) await api.put(`/Admin/packages/${editingPkg.id}`, form);
            else await api.post('/Admin/packages', form);
            setShowModal(false);
            fetchPackages();
        } catch (err) { alert("Kaydederken patladık amq!"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu paketi siliyoruz, emin misin? İçerideki üyeler patlamasın?")) {
            await api.delete(`/Admin/packages/${id}`);
            fetchPackages();
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '30px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <ArrowLeft size={18} /> Geri Dön
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><CreditCard color="#d90429" /> Üyelik Paketleri</h2>
                <button onClick={() => openModal()} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Yeni Paket Ekle</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {packages.map(p => (
                    <div key={p.id} style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '20px' }}>
                        <h3 style={{ color: 'white', marginTop: 0 }}>{p.name}</h3>
                        <p style={{ color: '#4ade80', fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0' }}>{p.price} TL</p>
                        <p style={{ color: '#888' }}>Süre: {p.durationMonths} Ay</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => openModal(p)} style={{ flex: 1, padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px', cursor: 'pointer' }}>Düzenle</button>
                            <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '8px', background: 'transparent', color: '#d90429', border: '1px solid #d90429', borderRadius: '5px', cursor: 'pointer' }}>Sil</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '10px', border: '2px solid #d90429', width: '400px' }}>
                        <h3 style={{ color: 'white', marginTop: 0 }}>{editingPkg ? 'Paketi Düzenle' : 'Yeni Paket'}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input placeholder="Paket Adı" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ padding: '10px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px' }} required />
                            <input type="number" placeholder="Fiyat (TL)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={{ padding: '10px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px' }} required />
                            <input type="number" placeholder="Süre (Ay)" value={form.durationMonths} onChange={e => setForm({...form, durationMonths: e.target.value})} style={{ padding: '10px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px' }} required />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '5px' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#d90429', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackageLibrary;