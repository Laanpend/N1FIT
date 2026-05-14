import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Search, Calendar, LogOut, Plus, UserPlus, Dumbbell, CreditCard, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);


    // Modal ve Form Stateleri
    const [showModal, setShowModal] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null); // YENİ: Kimi düzenliyoruz amq?

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '',
        subscriptionEndDate: '', phoneNumber: '',
        membershipStartDate: new Date().toISOString().split('T')[0],
        packageId: '', paidAmount: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Token'ı kontrol et
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userRole = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

            if (userRole !== "2" && userRole !== "Admin") {
                // Adam Admin değilse siktiri çek
                navigate('/member/dashboard');
            }
        } catch {
            navigate('/login');
        }
        fetchMembers();
        api.get('/Admin/packages').then(res => setPackages(res.data)).catch(err => console.log("Paketler patladı", err));
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Admin/members');
            setMembers(res.data || []);
        } catch (error) {
            console.error("Veri çekme patladı:", error);
        } finally {
            setLoading(false);
        }
    };

    // YENİ: Yeni Üye Ekle Butonuna Basınca Formu Temizle
    const handleAddNewClick = () => {
        setEditingMemberId(null);
        setFormData({
            firstName: '', lastName: '', email: '', password: '',
            subscriptionEndDate: '', phoneNumber: '',
            membershipStartDate: new Date().toISOString().split('T')[0],
            packageId: '', paidAmount: ''
        });
        setShowModal(true);
    };

    // YENİ: Düzenle Butonuna Basınca Formu Doldur
    const handleEditClick = (member) => {
        setEditingMemberId(member.id);

        // YENİ: İsim ayıklama motoru (FullName gelirse ortadan ikiye yarıyoruz)
        let ad = member.firstName || '';
        let soyad = member.lastName || '';

        if (!ad && !soyad && member.fullName) {
            const parts = member.fullName.trim().split(' ');
            ad = parts[0]; // İlk kelimeyi Ad yap
            soyad = parts.slice(1).join(' '); // Kalanları Soyad yap
        }

        setFormData({
            firstName: ad,
            lastName: soyad,
            email: member.email || '',
            password: '', // Şifreyi boş bırakıyoruz
            phoneNumber: member.phoneNumber || '',
            membershipStartDate: member.membershipStartDate ? member.membershipStartDate.split('T')[0] : '',
            subscriptionEndDate: member.subscriptionEndDate ? member.subscriptionEndDate.split('T')[0] : '',
            packageId: member.packageId || '',
            paidAmount: member.paidAmount || 0
        });
        setShowModal(true);
    };

    // YENİ: Sil Butonuna Basınca Acımadan Şutla
    const handleDeleteClick = async (id) => {
        if (window.confirm("Bu adamı dükkandan kalıcı olarak siliyoruz, emin misin dayıoğlu?")) {
            try {
                await api.delete(`/Admin/delete-member/${id}`); // C#'ta bu uç yoksa patlarsın haberin olsun!
                fetchMembers();
            } catch (err) {
                alert("Silerken patladık amq! C# tarafını kontrol et.");
            }
        }
    };

    const handleSaveMember = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                packageId: formData.packageId ? parseInt(formData.packageId) : null,
                paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0
            };

            if (editingMemberId) {
                // Adamı güncelliyoruz (C#'ta update-member ucu olmalı)
                await api.put(`/Admin/update-member/${editingMemberId}`, payload);
                alert("Canavarın bilgileri zımba gibi güncellendi!");
            } else {
                // Yeni adam ekliyoruz
                await api.post('/Admin/add-member', payload);
                alert("Yeni canavar dükkana eklendi!");
            }

            setShowModal(false);
            fetchMembers();
        } catch (err) {
            alert("Kayıt/Güncelleme patladı, C# tarafına giden verilere bak.");
        }
    };

    const filteredMembers = (members || []).filter(m => {
        if (!m) return false;
        const today = new Date();
        const startDate = m.membershipStartDate ? new Date(m.membershipStartDate) : null;
        const endDate = m.subscriptionEndDate ? new Date(m.subscriptionEndDate) : null;

        const isActive = endDate ? endDate >= today : false;

        // Adam fazla para verdiyse eksiye düşmesin diye Math.max ile 0'a sabitliyoruz
        const kalanBorc = Math.max(0, (m.totalDebt || 0) - (m.paidAmount || 0));

        const name = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim();
        // searchTerm undefined gelirse patlamasın diye (searchTerm || "") kalkanı ekledik
        const matchesName = name.toLowerCase().includes((searchTerm || "").toLowerCase());

        // YENİ: CYBORG BORÇ VE DURUM MOTORU (FROZEN VİTESİ EKLENDİ)
        let matchesStatus = true;
        if (statusFilter === 'Active') matchesStatus = isActive && !m.isFrozen;
        else if (statusFilter === 'Passive') matchesStatus = !isActive && !m.isFrozen;
        else if (statusFilter === 'Frozen') matchesStatus = m.isFrozen === true;
        else if (statusFilter === 'InDebt') matchesStatus = kalanBorc > 0;
        else if (statusFilter === 'Clean') matchesStatus = kalanBorc === 0;

        const matchesDate = (!dateRange.start || (startDate && startDate >= new Date(dateRange.start))) &&
            (!dateRange.end || (endDate && endDate <= new Date(dateRange.end)));
            
        return matchesName && matchesStatus && matchesDate;
    });

    if (loading) return <div style={{ color: 'white', padding: '20px' }}>Yükleniyor dayıoğlu, bekle...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--n1fit-red)' }}>N1FIT PROFESYONEL YÖNETİM</h2>
                    <button onClick={() => { localStorage.removeItem('n1fit_token'); window.location.href = '/login' }} style={styles.logoutBtn}>
                        <LogOut size={18} /> Çıkış
                    </button>
                </div>
                <div style={styles.filterBar}>
                    <div style={styles.searchBox}>
                        <Search size={20} color="#666" />
                        <input
                            placeholder="Müşteri ismini yaz..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    <select onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
                        <option value="All">Tüm Liste</option>
                        <option value="Active">Aktifler</option>
                        <option value="Passive">Pasifler</option>
                        <option value="InDebt">Borçlular</option>
                        <option value="Clean">Cari Temiz</option>
                        <option value="Frozen">Dondurulmuşlar</option>
                    </select>
                    <div style={styles.dateBox}>
                        <Calendar size={18} color="#d90429" />
                        <input type="date" onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={styles.dateInput} />
                        <span style={{ color: '#666' }}> - </span>
                        <input type="date" onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={styles.dateInput} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                    <button onClick={handleAddNewClick} style={styles.addBtn}>
                        <UserPlus size={18} /> Yeni Üye Ekle
                    </button>
                    <button onClick={() => navigate('/admin/exercises')} style={styles.libraryBtn}>
                        <Dumbbell size={18} /> Hareket Kütüphanesi
                    </button>
                    <button onClick={() => navigate('/admin/packages')} style={styles.libraryBtn}>
                        <CreditCard size={18} /> Üyelik Paketleri
                    </button>
                </div>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th>MÜŞTERİ</th>
                                <th>TELEFON</th>
                                <th>TARİHLER</th>
                                <th>KALAN SÜRE</th>
                                <th>CARİ HESAP</th>
                                <th>DURUM</th>
                                <th>İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? filteredMembers.map(m => {
                                // 1. Bitiş tarihi
                                const endDate = m.subscriptionEndDate ? new Date(m.subscriptionEndDate) : null;

                                // 2. YENİ: Zamanı Dondurma Zekası
                                let diffTime = 0;
                                if (endDate) {
                                    // Eğer adam donuksa, bugünü değil, dondurulduğu günü referans al (zaman dursun)
                                    const referansTarih = (m.isFrozen && m.freezeDate) ? new Date(m.freezeDate) : new Date();
                                    diffTime = endDate - referansTarih;
                                }

                                // 3. Matematiksel hesaplar (SADECE BİRER KERE YAZIYORUZ AMQ)
                                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isActive = daysLeft >= 0;
                                const kalanBorc = (m.totalDebt || 0) - (m.paidAmount || 0);
                                const musteriIsmi = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "İsimsiz Canavar";
                                return (
                                    <tr key={m.id} style={styles.tableRow}>
                                        <td style={{ fontWeight: 'bold' }}>{musteriIsmi}</td>
                                        <td>{m.phoneNumber || "-"}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>Bşl: {m.membershipStartDate ? new Date(m.membershipStartDate).toLocaleDateString() : "-"}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#aaa' }}>Bit: {endDate && endDate.getFullYear() > 1970 ? endDate.toLocaleDateString() : "-"}</div>
                                        </td>
                                        <td style={{ color: daysLeft < 5 ? '#d90429' : '#fff' }}>
                                            {daysLeft > 0 ? `${daysLeft} Gün` : "Süre Doldu"}
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>
                                            {kalanBorc > 0 ? (
                                                <span style={{ color: '#d90429' }}>{kalanBorc} TL Borçlu</span>
                                            ) : (
                                                /* İŞTE SENİN VİZYONUN: Adam aktifse Temiz yaz, süresi bittiyse Üyelik Bitti yaz amq! */
                                                <span style={{ color: isActive ? '#4ade80' : '#888' }}>
                                                    {isActive ? 'Temiz' : 'Üyelik Bitti'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{
                                                ...styles.badge,
                                                backgroundColor: m.isFrozen ? 'rgba(59, 130, 246, 0.1)' : (isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(217, 4, 41, 0.1)'),
                                                color: m.isFrozen ? '#3b82f6' : (isActive ? '#4ade80' : '#d90429'),
                                                border: `1px solid ${m.isFrozen ? '#3b82f6' : (isActive ? '#4ade80' : '#d90429')}`
                                            }}>
                                                {m.isFrozen ? 'DONDURULDU' : (isActive ? 'AKTİF' : 'PASİF')}
                                            </div>
                                        </td>
                                        <td>
                                            {/* YENİ: İŞLEM BUTONLARI */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button onClick={() => navigate(`/admin/member/${m.id}`)} style={{ ...styles.actionBtn, backgroundColor: '#1a1a1a', border: '1px solid #444' }}>
                                                    Aç
                                                </button>
                                                <button onClick={() => handleEditClick(m)} style={{ ...styles.actionBtn, backgroundColor: '#2b6cb0', border: '1px solid #4299e1' }} title="Düzenle">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(m.id)} style={{ ...styles.actionBtn, backgroundColor: '#742a2a', border: '1px solid #fc8181' }} title="Sil">
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        await api.patch(`/Admin/toggle-freeze/${m.id}`);
                                                        fetchMembers();
                                                    }}
                                                    style={{ ...styles.actionBtn, backgroundColor: m.isFrozen ? '#4ade80' : '#333', border: '1px solid #444' }}
                                                    title={m.isFrozen ? "Üyeliği Çöz" : "Üyeliği Dondur"}
                                                >
                                                    {m.isFrozen ? "Çöz" : "Dondur"}
                                                </button>
                                            </div>
                                        </td>


                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Kayıt bulunamadı kral.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* MODAL EKRANI */}
            {showModal && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContent}>
                        <h3 style={{ color: 'white', marginBottom: '20px', marginTop: 0 }}>
                            {editingMemberId ? 'Üye Bilgilerini Düzenle' : 'Yeni Üye Kaydı'}
                        </h3>
                        <form onSubmit={handleSaveMember} style={styles.modalForm}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input style={{ ...styles.modalInput, flex: 1 }} placeholder="Ad" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                                <input style={{ ...styles.modalInput, flex: 1 }} placeholder="Soyad" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <input style={styles.modalInput} placeholder="Telefon (05...)" type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} required />
                            <input style={styles.modalInput} placeholder="E-Posta" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />

                            {/* Şifreyi sadece yeni üyeyse zorunlu yap, düzenlemede boş geçilebilir */}
                            <input style={styles.modalInput} placeholder={editingMemberId ? "Şifre (Değişmeyecekse boş bırak)" : "Şifre"} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingMemberId} />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.smallLabel}>Başlama Tarihi:</label>
                                    <input style={{ ...styles.modalInput, width: '100%', boxSizing: 'border-box' }} type="date" value={formData.membershipStartDate} onChange={e => setFormData({ ...formData, membershipStartDate: e.target.value })} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.smallLabel}>Bitiş Tarihi:</label>
                                    <input style={{ ...styles.modalInput, width: '100%', boxSizing: 'border-box' }} type="date" value={formData.subscriptionEndDate} onChange={e => setFormData({ ...formData, subscriptionEndDate: e.target.value })} required />
                                </div>
                            </div>

                            <label style={styles.smallLabel}>Üyelik Paketi Seç:</label>
                            <select style={styles.modalInput} value={formData.packageId} onChange={e => setFormData({ ...formData, packageId: e.target.value })} required>
                                <option value="">Paket Seç Dayı...</option>
                                {packages.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - {p.price} TL</option>
                                ))}
                            </select>

                            <label style={styles.smallLabel}>Alınan Peşinat (TL):</label>
                            <input style={styles.modalInput} placeholder="Örn: 1500" type="number" value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: e.target.value })} required />

                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>İPTAL</button>
                                <button type="submit" style={styles.saveBtn}>{editingMemberId ? 'GÜNCELLE' : 'KAYDET VE BORÇLANDIR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#edf2f4', padding: '20px' },
    main: { maxWidth: '1200px', margin: '0 auto' },
    filterBar: { display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
    searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1a1a1a', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333' },
    input: { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '1rem' },
    select: { backgroundColor: '#1a1a1a', color: 'white', padding: '10px', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' },
    dateBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1a1a1a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #333' },
    dateInput: { backgroundColor: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: '0.9rem' },
    tableWrapper: { backgroundColor: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: { backgroundColor: '#1a1a1a', textAlign: 'left', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase' },
    tableRow: { borderBottom: '1px solid #222', transition: '0.2s' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    logoutBtn: { backgroundColor: 'transparent', color: '#666', border: '1px solid #333', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    addBtn: { backgroundColor: '#111', color: '#d90429', border: '1px solid #d90429', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s' },
    libraryBtn: { backgroundColor: '#111', color: '#d90429', border: '1px solid #d90429', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s' },
    actionBtn: { padding: '6px 10px', color: 'white', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }, // YENİ BUTON STİLİ
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '2px solid #d90429', width: '450px', boxShadow: '0 0 20px rgba(217, 4, 41, 0.3)' },
    modalForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
    modalInput: { padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' },
    smallLabel: { color: '#aaa', fontSize: '0.85rem', marginBottom: '3px', display: 'block' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
    saveBtn: { backgroundColor: '#d90429', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { backgroundColor: '#333', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default AdminDashboard;