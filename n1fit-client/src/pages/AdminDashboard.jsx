import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axiosConfig';
import {
    Search, Calendar, LogOut, UserPlus, Dumbbell, CreditCard, Edit, Trash2,
    Users, Layers, Sparkles, Wallet, Bell, AlertTriangle, Package, Clock,
    CheckCircle2, MessageCircle, ChevronDown, ChevronUp, RefreshCw, X, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const normalizeTurkishSearch = (text) => {
    if (!text) return '';
    return String(text)
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, ' ')
        .trim();
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);

    // 🔔 Bildirim Merkezi (Zil İkonu & Gruplandırılmış Bildirimler) State'leri
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifCategory, setNotifCategory] = useState('all'); // 'all' | 'approvals' | 'leads' | 'stock' | 'debts' | 'expiring'
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [notifLoading, setNotifLoading] = useState(false);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [criticalStockProducts, setCriticalStockProducts] = useState([]);
    const [pendingLeads, setPendingLeads] = useState([]);

    const [showPayDebtModal, setShowPayDebtModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

    const [showRenewModal, setShowRenewModal] = useState(false);
    const [selectedRenewMember, setSelectedRenewMember] = useState(null);
    const [renewForm, setRenewForm] = useState({ packageId: '', paidAmount: '', startDate: '', endDate: '' });

    const [showModal, setShowModal] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '',
        subscriptionEndDate: '', phoneNumber: '',
        membershipStartDate: new Date().toISOString().split('T')[0],
        packageId: '', paidAmount: ''
    });

    const selectedMember = members.find(m => m.id === editingMemberId) || {};

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) {
            navigate('/admin/login');
            return;
        }

        const payload = parseJwt(token);
        if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
            localStorage.removeItem('n1fit_token');
            navigate('/admin/login');
            return;
        }

        const userRole = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        if (userRole !== "1" && userRole !== "Admin") {
            navigate('/');
            return;
        }

        fetchMembers();
        fetchPackages();
        fetchNotificationsData();
    }, [navigate]);

    const fetchNotificationsData = async () => {
        setNotifLoading(true);
        try {
            const [pendingRes, prodRes, leadsRes] = await Promise.allSettled([
                api.get('/Finance/pending-memberships?status=Pending'),
                api.get('/Finance/products'),
                api.get('/Admin/site-leads')
            ]);

            if (pendingRes.status === 'fulfilled' && Array.isArray(pendingRes.value.data)) {
                setPendingPayments(pendingRes.value.data);
            }
            if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data)) {
                const lowStock = prodRes.value.data.filter(
                    p => p.isActive !== false && Number(p.stockQuantity ?? 0) <= Number(p.criticalStockLevel ?? 5)
                );
                setCriticalStockProducts(lowStock);
            }
            if (leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value.data)) {
                const waitingLeads = leadsRes.value.data.filter(l => (l.status || 'Bekliyor') === 'Bekliyor');
                setPendingLeads(waitingLeads);
            }
        } catch (err) {
            console.error("Bildirim verileri çekilemedi:", err);
        } finally {
            setNotifLoading(false);
        }
    };

    const handleMarkLeadContacted = async (leadId) => {
        try {
            await api.put(`/Admin/site-leads/${leadId}/status`, { status: 'Görüşüldü' });
            setPendingLeads(prev => prev.filter(l => l.id !== leadId));
        } catch {
            alert('Başvuru durumu güncellenemedi.');
        }
    };

    const handleWhatsAppLead = async (lead) => {
        const cleanPhone = String(lead.phone || '').replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : cleanPhone.startsWith('0') ? `9${cleanPhone}` : `90${cleanPhone}`;
        const msg = encodeURIComponent(
            `Merhaba ${lead.fullName}, N1FIT Spor Merkezi'ne bıraktığınız "${lead.goal || 'Ücretsiz Tanışma'}" ön kayıt başvurunuz için ulaşıyoruz. Size nasıl yardımcı olabiliriz?`
        );
        window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
        if (lead.status === 'Bekliyor') {
            handleMarkLeadContacted(lead.id);
        }
    };

    const handleWhatsAppExpiringMember = (member, daysLeft) => {
        const cleanPhone = String(member.phoneNumber || '').replace(/\D/g, '');
        if (!cleanPhone) return alert('Üyenin kayıtlı telefon numarası bulunmuyor.');
        const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : cleanPhone.startsWith('0') ? `9${cleanPhone}` : `90${cleanPhone}`;
        const name = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim();
        const msg = encodeURIComponent(
            `Merhaba ${name}, N1FIT Spor Merkezi üyeliğinizin bitmesine ${daysLeft === 0 ? 'bugün son gün' : `${daysLeft} gün kaldı`}. Antrenmanlarınıza kesintisiz devam etmek için üyeliğinizi yenileyebilirsiniz! 💪`
        );
        window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
    };

    const toggleGroupCollapse = (groupKey) => {
        setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    // Üyelerden türetilen bildirim grupları (Cari Borçlular & Süresi 5 Gün İçinde Bitecekler)
    const { debtorMembers, totalReceivableDebt, expiringSoonMembers } = useMemo(() => {
        const debtors = [];
        let debtSum = 0;
        const expiring = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const m of (members || [])) {
            if (!m) continue;
            const name = m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'İsimsiz Üye';
            const kalanBorc = Math.max(0, Number(m.totalDebt || 0) - Number(m.paidAmount || 0));
            if (kalanBorc > 0) {
                debtors.push({ ...m, displayName: name, kalanBorc });
                debtSum += kalanBorc;
            }

            if (!m.isFrozen && m.subscriptionEndDate) {
                const endDate = new Date(m.subscriptionEndDate);
                endDate.setHours(0, 0, 0, 0);
                const startDate = m.membershipStartDate ? new Date(m.membershipStartDate) : null;
                if (startDate) startDate.setHours(0, 0, 0, 0);
                const isStarted = !startDate || startDate <= today;
                const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                if (isStarted && daysLeft >= 0 && daysLeft <= 5) {
                    expiring.push({ ...m, displayName: name, daysLeft });
                }
            }
        }

        debtors.sort((a, b) => b.kalanBorc - a.kalanBorc);
        expiring.sort((a, b) => a.daysLeft - b.daysLeft);

        return {
            debtorMembers: debtors,
            totalReceivableDebt: debtSum,
            expiringSoonMembers: expiring
        };
    }, [members]);

    const pendingApprovalsTotalAmount = useMemo(
        () => pendingPayments.reduce((acc, item) => acc + Number(item.amount || 0), 0),
        [pendingPayments]
    );

    const totalNotificationsCount =
        pendingPayments.length +
        pendingLeads.length +
        criticalStockProducts.length +
        debtorMembers.length +
        expiringSoonMembers.length;

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Admin/members');
            setMembers(res.data || []);
        } catch (error) {
            console.error("Veri çekme hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const res = await api.get('/Admin/packages');
            setPackages(res.data || []);
        } catch (err) {
            console.error("Paketler çekilirken hata oluştu:", err);
        }
    };

    const handleAddNewClick = () => {
        setEditingMemberId(null);
        const todayStr = new Date().toISOString().split('T')[0];
        setFormData({
            firstName: '', lastName: '', email: '', password: '',
            subscriptionEndDate: todayStr,
            phoneNumber: '',
            membershipStartDate: todayStr,
            packageId: '', paidAmount: ''
        });
        setShowModal(true);
    };

    const handleEditClick = (member) => {
        setEditingMemberId(member.id);

        let ad = member.firstName || '';
        let soyad = member.lastName || '';

        if (!ad && !soyad && member.fullName) {
            const parts = member.fullName.trim().split(' ');
            ad = parts[0];
            soyad = parts.slice(1).join(' ');
        }

        setFormData({
            firstName: ad,
            lastName: soyad,
            email: member.email || '',
            password: '',
            phoneNumber: member.phoneNumber || '',
            membershipStartDate: member.membershipStartDate ? member.membershipStartDate.split('T')[0] : '',
            subscriptionEndDate: member.subscriptionEndDate ? member.subscriptionEndDate.split('T')[0] : '',
            packageId: member.packageId || '',
            paidAmount: member.paidAmount ?? 0
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Bu üyeyi sistemden kalıcı olarak siliyoruz, emin misin?")) {
            try {
                await api.delete(`/Admin/delete-member/${id}`);
                fetchMembers();
            } catch {
                alert("Üye silinirken bir hata oluştu.");
            }
        }
    };

    const handleStartDateChange = (newStartDate) => {
        const selectedPkg = packages.find(p => String(p.id || p.Id) === String(formData.packageId));
        let calculatedEnd = formData.subscriptionEndDate;
        if (selectedPkg && newStartDate) {
            const d = new Date(newStartDate);
            if (!isNaN(d.getTime())) {
                const months = Number(selectedPkg.durationMonths || selectedPkg.DurationMonths || 1);
                d.setMonth(d.getMonth() + months);
                calculatedEnd = d.toISOString().split('T')[0];
            }
        }
        setFormData({
            ...formData,
            membershipStartDate: newStartDate,
            subscriptionEndDate: calculatedEnd
        });
    };

    const handleEndDateChange = (newEndDate) => {
        setFormData({
            ...formData,
            subscriptionEndDate: newEndDate
        });
    };

    const handlePackageChangeInNewForm = (pkgId) => {
        const selectedPkg = packages.find(p => String(p.id || p.Id) === String(pkgId));
        let calculatedEnd = formData.subscriptionEndDate;
        const baseStartStr = formData.membershipStartDate || new Date().toISOString().split('T')[0];
        if (selectedPkg && baseStartStr) {
            const start = new Date(baseStartStr);
            if (!isNaN(start.getTime())) {
                const months = Number(selectedPkg.durationMonths || selectedPkg.DurationMonths || 1);
                start.setMonth(start.getMonth() + months);
                calculatedEnd = start.toISOString().split('T')[0];
            }
        }
        setFormData({
            ...formData,
            packageId: pkgId,
            membershipStartDate: baseStartStr,
            subscriptionEndDate: calculatedEnd
        });
    };

    const getDurationSummary = () => {
        if (!formData.membershipStartDate || !formData.subscriptionEndDate) return null;
        const start = new Date(formData.membershipStartDate);
        const end = new Date(formData.subscriptionEndDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const isFuture = start > today;
        const daysUntilStart = isFuture ? Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
            diffDays,
            approxMonths: (diffDays / 30.4).toFixed(1),
            isFuture,
            daysUntilStart,
            isValid: diffDays > 0
        };
    };

    const openRenewModal = (member) => {
        setSelectedRenewMember(member);
        const todayStr = new Date().toISOString().split('T')[0];
        let defaultStart = todayStr;
        if (member && member.subscriptionEndDate) {
            const memberEnd = new Date(member.subscriptionEndDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (memberEnd > today) {
                defaultStart = memberEnd.toISOString().split('T')[0];
            }
        }
        setRenewForm({
            packageId: '',
            paidAmount: '',
            startDate: defaultStart,
            endDate: defaultStart
        });
        setShowRenewModal(true);
    };

    const handleRenewPackageChange = (pkgId) => {
        const selectedPkg = packages.find(p => String(p.id || p.Id) === String(pkgId));
        let calculatedEnd = renewForm.endDate;
        const baseStartStr = renewForm.startDate || new Date().toISOString().split('T')[0];
        if (selectedPkg && baseStartStr) {
            const start = new Date(baseStartStr);
            if (!isNaN(start.getTime())) {
                const months = Number(selectedPkg.durationMonths || selectedPkg.DurationMonths || 1);
                start.setMonth(start.getMonth() + months);
                calculatedEnd = start.toISOString().split('T')[0];
            }
        }
        setRenewForm({
            ...renewForm,
            packageId: pkgId,
            startDate: baseStartStr,
            endDate: calculatedEnd
        });
    };

    const handleRenewStartDateChange = (newStartDate) => {
        const selectedPkg = packages.find(p => String(p.id || p.Id) === String(renewForm.packageId));
        let calculatedEnd = renewForm.endDate;
        if (selectedPkg && newStartDate) {
            const d = new Date(newStartDate);
            if (!isNaN(d.getTime())) {
                const months = Number(selectedPkg.durationMonths || selectedPkg.DurationMonths || 1);
                d.setMonth(d.getMonth() + months);
                calculatedEnd = d.toISOString().split('T')[0];
            }
        }
        setRenewForm({
            ...renewForm,
            startDate: newStartDate,
            endDate: calculatedEnd
        });
    };

    const handleRenewEndDateChange = (newEndDate) => {
        setRenewForm({
            ...renewForm,
            endDate: newEndDate
        });
    };

    const getRenewDurationSummary = () => {
        if (!renewForm.startDate || !renewForm.endDate) return null;
        const start = new Date(renewForm.startDate);
        const end = new Date(renewForm.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const isFuture = start > today;
        const daysUntilStart = isFuture ? Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
            diffDays,
            approxMonths: (diffDays / 30.4).toFixed(1),
            isFuture,
            daysUntilStart,
            isValid: diffDays > 0
        };
    };

    const handleSaveMember = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber?.trim() || '',
                subscriptionEndDate: formData.subscriptionEndDate ? formData.subscriptionEndDate : null,
                packageId: formData.packageId ? parseInt(formData.packageId, 10) : null,
                paidAmount: formData.paidAmount !== '' ? parseFloat(formData.paidAmount) : 0
            };

            if (editingMemberId) {
                await api.put(`/Admin/update-member/${editingMemberId}`, payload);
                alert("Üye bilgileri güncellendi!");
            } else {
                await api.post('/Admin/add-member', payload);
                alert("Yeni üye sisteme eklendi!");
            }

            setShowModal(false);
            fetchMembers();
            fetchNotificationsData();
        } catch (err) {
            alert(err.response?.data?.message || "Kayıt/Güncelleme sırasında bir hata oluştu.");
        }
    };

    const handlePayDebt = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) return alert("Lütfen geçerli bir tutar giriniz!");
        if (!selectedMember?.id) return;
        try {
            const payload = {
                amount: parseFloat(paymentAmount)
            };

            await api.post(`/Admin/members/${selectedMember.id}/pay-debt`, payload);

            alert("Borçtan düşüldü!");
            setShowPayDebtModal(false);
            setPaymentAmount('');
            fetchMembers();
            fetchNotificationsData();

        } catch (err) {
            console.error("Ödeme hatası:", err);
            alert(err.response?.data?.message || "Ödeme alınırken hata oluştu!");
        }
    };

    const filteredMembers = (members || []).filter(m => {
        if (!m) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = m.membershipStartDate ? new Date(m.membershipStartDate) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);
        const endDate = m.subscriptionEndDate ? new Date(m.subscriptionEndDate) : null;
        if (endDate) endDate.setHours(0, 0, 0, 0);

        const isStarted = !startDate || startDate <= today;
        const isNotExpired = !endDate || endDate >= today;
        const isActive = !m.isFrozen && isStarted && isNotExpired;
        const kalanBorc = Math.max(0, (m.totalDebt || 0) - (m.paidAmount || 0));

        const name = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim();
        const searchableTarget = normalizeTurkishSearch(`${name} ${m.email || ""} ${m.phoneNumber || ""}`);
        const searchTokens = normalizeTurkishSearch(searchTerm).split(' ').filter(Boolean);
        const matchesName = searchTokens.length === 0 || searchTokens.every(token => searchableTarget.includes(token));

        let matchesStatus = true;
        if (statusFilter === 'Active') matchesStatus = isActive;
        else if (statusFilter === 'Passive') matchesStatus = !isActive && !m.isFrozen;
        else if (statusFilter === 'Frozen') matchesStatus = m.isFrozen === true;
        else if (statusFilter === 'InDebt') matchesStatus = kalanBorc > 0;
        else if (statusFilter === 'Clean') matchesStatus = kalanBorc === 0;

        const matchesDate = (!dateRange.start || (startDate && startDate >= new Date(dateRange.start))) &&
            (!dateRange.end || (endDate && endDate <= new Date(dateRange.end)));

        return matchesName && matchesStatus && matchesDate;
    });

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const ekrandaGosterilecekAdamlar = filteredMembers.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredMembers.length / recordsPerPage);
    const durationSummary = getDurationSummary();
    const renewDurationSummary = getRenewDurationSummary();

    return (
        <div style={styles.container}>
            <div style={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '14px', position: 'relative' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#d90429', fontWeight: '900' }}>N1FIT</span> YÖNETİM PANELİ
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Hızlı Kritik Durum Rozetleri (Tıklanınca ilgili bildirim grubunu açar) */}
                        {pendingPayments.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setNotifCategory('approvals'); setShowNotifications(true); }}
                                style={{
                                    backgroundColor: 'rgba(245, 158, 11, 0.14)',
                                    border: '1px solid rgba(245, 158, 11, 0.5)',
                                    color: '#fbbf24',
                                    padding: '7px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                title="Kasa onayı bekleyen üyelik tahsilatları"
                            >
                                ⏳ {pendingPayments.length} Tahsilat Onayı ({pendingApprovalsTotalAmount.toLocaleString('tr-TR')} ₺)
                            </button>
                        )}
                        {pendingLeads.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setNotifCategory('leads'); setShowNotifications(true); }}
                                style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.14)',
                                    border: '1px solid rgba(59, 130, 246, 0.5)',
                                    color: '#60a5fa',
                                    padding: '7px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                title="Web sitesinden gelen bekleyen ön kayıt başvuruları"
                            >
                                📋 {pendingLeads.length} Ön Başvuru
                            </button>
                        )}
                        {criticalStockProducts.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setNotifCategory('stock'); setShowNotifications(true); }}
                                style={{
                                    backgroundColor: 'rgba(217, 4, 41, 0.15)',
                                    border: '1px solid rgba(217, 4, 41, 0.55)',
                                    color: '#f87171',
                                    padding: '7px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                title="Kritik stok seviyesinin altına düşen ürünler"
                            >
                                📦 {criticalStockProducts.length} Kritik Stok
                            </button>
                        )}

                        {/* 🔔 ZİL İKONU & BİLDİRİM MERKEZİ BUTONU */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const nextState = !showNotifications;
                                    setShowNotifications(nextState);
                                    if (nextState) fetchNotificationsData();
                                }}
                                style={{
                                    position: 'relative',
                                    backgroundColor: showNotifications ? '#d90429' : '#14161d',
                                    color: '#ffffff',
                                    border: totalNotificationsCount > 0 ? '1px solid #d90429' : '1px solid #333',
                                    padding: '9px 15px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '800',
                                    fontSize: '0.9rem',
                                    boxShadow: totalNotificationsCount > 0 ? '0 0 18px rgba(217, 4, 41, 0.35)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                title="Bildirim ve Uyarı Merkezini Aç"
                            >
                                <Bell size={19} color={showNotifications ? '#fff' : (totalNotificationsCount > 0 ? '#f87171' : '#aaa')} />
                                <span>Bildirimler</span>
                                {totalNotificationsCount > 0 && (
                                    <span style={{
                                        backgroundColor: showNotifications ? '#ffffff' : '#d90429',
                                        color: showNotifications ? '#d90429' : '#ffffff',
                                        fontSize: '0.75rem',
                                        fontWeight: '900',
                                        padding: '2px 8px',
                                        borderRadius: '20px',
                                        minWidth: '22px',
                                        textAlign: 'center'
                                    }}>
                                        {totalNotificationsCount}
                                    </span>
                                )}
                            </button>

                            {/* GRUPLANDIRILMIŞ BİLDİRİM MERKEZİ PANELİ */}
                            {showNotifications && (
                                <>
                                    <div
                                        onClick={() => setShowNotifications(false)}
                                        style={{ position: 'fixed', inset: 0, zIndex: 1999, backgroundColor: 'rgba(0,0,0,0.35)' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 12px)',
                                        right: 0,
                                        width: '560px',
                                        maxWidth: '94vw',
                                        maxHeight: '80vh',
                                        backgroundColor: '#0e1017',
                                        border: '1px solid #2b3040',
                                        borderRadius: '16px',
                                        boxShadow: '0 24px 60px rgba(0,0,0,0.92), 0 0 30px rgba(217, 4, 41, 0.22)',
                                        zIndex: 2000,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Panel Üst Başlık */}
                                        <div style={{
                                            padding: '16px 20px',
                                            backgroundColor: '#141822',
                                            borderBottom: '1px solid #232838',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '10px',
                                                    backgroundColor: 'rgba(217, 4, 41, 0.18)',
                                                    border: '1px solid rgba(217, 4, 41, 0.45)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Bell size={18} color="#f87171" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '900', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span>Önemli Olaylar & Bildirim Merkezi</span>
                                                        <span style={{ backgroundColor: '#d90429', color: '#fff', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: '900' }}>
                                                            {totalNotificationsCount} Kayıt
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.76rem', color: '#8e96a8', marginTop: '2px' }}>
                                                        Unutulmaması gereken tahsilat, başvuru, stok ve üyelik uyarıları
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { fetchNotificationsData(); fetchMembers(); }}
                                                    style={{
                                                        backgroundColor: '#1d2230',
                                                        border: '1px solid #2e364a',
                                                        color: '#cbd5e1',
                                                        padding: '7px 10px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700'
                                                    }}
                                                    title="Bildirimleri Şimdi Yenile"
                                                >
                                                    <RefreshCw size={14} /> {notifLoading ? '...' : 'Yenile'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNotifications(false)}
                                                    style={{
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #2e364a',
                                                        color: '#94a3b8',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Kapat"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Kategori Filtre Sekmeleri */}
                                        <div style={{
                                            padding: '10px 16px',
                                            backgroundColor: '#10131b',
                                            borderBottom: '1px solid #1e2330',
                                            display: 'flex',
                                            gap: '6px',
                                            overflowX: 'auto'
                                        }}>
                                            {[
                                                { id: 'all', label: 'Tümü', count: totalNotificationsCount, color: '#d90429' },
                                                { id: 'approvals', label: '⏳ Tahsilat Onayı', count: pendingPayments.length, color: '#f59e0b' },
                                                { id: 'leads', label: '📋 Ön Başvurular', count: pendingLeads.length, color: '#3b82f6' },
                                                { id: 'stock', label: '📦 Kritik Stok', count: criticalStockProducts.length, color: '#ef4444' },
                                                { id: 'debts', label: '💳 Cari Borçlar', count: debtorMembers.length, color: '#a855f7' },
                                                { id: 'expiring', label: '⏰ Süresi Bitenler', count: expiringSoonMembers.length, color: '#10b981' }
                                            ].map(tab => {
                                                const active = notifCategory === tab.id;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setNotifCategory(tab.id)}
                                                        style={{
                                                            backgroundColor: active ? tab.color : '#181c28',
                                                            color: active ? '#ffffff' : '#94a3b8',
                                                            border: active ? `1px solid ${tab.color}` : '1px solid #252b3b',
                                                            padding: '6px 11px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '800',
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <span>{tab.label}</span>
                                                        <span style={{
                                                            backgroundColor: active ? 'rgba(0,0,0,0.28)' : '#23293a',
                                                            color: '#fff',
                                                            padding: '1px 6px',
                                                            borderRadius: '10px',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            {tab.count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Gruplandırılmış Bildirim Listesi */}
                                        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '62vh' }}>
                                            {totalNotificationsCount === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                                    <CheckCircle2 size={42} color="#4ade80" style={{ marginBottom: '10px' }} />
                                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>Harika! Bekleyen Kritik Uyarı Yok</div>
                                                    <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                                                        Tüm üyelik tahsilatları, ön başvurular ve stok seviyeleri güncel durumda.
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* GRUP 1: TAHSİLAT / KASA ONAYI BEKLEYEN ÜYELİKLER */}
                                                    {(notifCategory === 'all' || notifCategory === 'approvals') && (
                                                        <div style={{ backgroundColor: '#131722', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px', overflow: 'hidden' }}>
                                                            <div
                                                                onClick={() => toggleGroupCollapse('approvals')}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#fbbf24', fontSize: '0.86rem' }}>
                                                                    <Wallet size={17} />
                                                                    <span>Tahsilat / Kasa Onayı Bekleyen Üyelikler ({pendingPayments.length})</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {pendingApprovalsTotalAmount > 0 && (
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fde68a', backgroundColor: 'rgba(245,158,11,0.2)', padding: '3px 8px', borderRadius: '8px' }}>
                                                                            {pendingApprovalsTotalAmount.toLocaleString('tr-TR')} ₺
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setShowNotifications(false); navigate('/admin/finance?tab=approvals'); }}
                                                                        style={{ backgroundColor: '#f59e0b', color: '#0a0a0a', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                                                                    >
                                                                        Onay Ekranı →
                                                                    </button>
                                                                    {collapsedGroups.approvals ? <ChevronDown size={16} color="#fbbf24" /> : <ChevronUp size={16} color="#fbbf24" />}
                                                                </div>
                                                            </div>
                                                            {!collapsedGroups.approvals && (
                                                                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {pendingPayments.length === 0 ? (
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '6px' }}>Onay bekleyen üyelik tahsilatı bulunmuyor.</div>
                                                                    ) : (
                                                                        pendingPayments.slice(0, 8).map(item => (
                                                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#0d1017', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1f2533' }}>
                                                                                <div>
                                                                                    <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.86rem' }}>{item.memberName}</div>
                                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                                        📦 {item.packageName || 'Üyelik Paketi'} • {item.createdDate ? new Date(item.createdDate).toLocaleDateString('tr-TR') : ''}
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <span style={{ fontWeight: '900', color: '#fbbf24', fontSize: '0.88rem' }}>
                                                                                        {Number(item.amount || 0).toLocaleString('tr-TR')} ₺
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => { setShowNotifications(false); navigate('/admin/finance?tab=approvals'); }}
                                                                                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.18)', border: '1px solid #f59e0b', color: '#fcd34d', padding: '5px 10px', borderRadius: '6px', fontSize: '0.73rem', fontWeight: '800', cursor: 'pointer' }}
                                                                                    >
                                                                                        Nakit/POS Seç →
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* GRUP 2: WEB ÖN BAŞVURU & ÜCRETSİZ TANIŞMA FORMLARI */}
                                                    {(notifCategory === 'all' || notifCategory === 'leads') && (
                                                        <div style={{ backgroundColor: '#131722', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '12px', overflow: 'hidden' }}>
                                                            <div
                                                                onClick={() => toggleGroupCollapse('leads')}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#60a5fa', fontSize: '0.86rem' }}>
                                                                    <Sparkles size={17} />
                                                                    <span>Web Ön Başvuru & Tanışma Formları ({pendingLeads.length})</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setShowNotifications(false); navigate('/admin/studio?tab=leads'); }}
                                                                        style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                                                                    >
                                                                        Lead Havuzu →
                                                                    </button>
                                                                    {collapsedGroups.leads ? <ChevronDown size={16} color="#60a5fa" /> : <ChevronUp size={16} color="#60a5fa" />}
                                                                </div>
                                                            </div>
                                                            {!collapsedGroups.leads && (
                                                                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {pendingLeads.length === 0 ? (
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '6px' }}>Bekleyen yeni web ön başvurusu bulunmuyor.</div>
                                                                    ) : (
                                                                        pendingLeads.slice(0, 8).map(lead => (
                                                                            <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#0d1017', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1f2533', flexWrap: 'wrap' }}>
                                                                                <div style={{ flex: 1, minWidth: '180px' }}>
                                                                                    <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                        <span>{lead.fullName}</span>
                                                                                        <span style={{ fontSize: '0.72rem', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.15)', padding: '1px 7px', borderRadius: '10px' }}>
                                                                                            {lead.phone}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                                                                        🎯 {lead.goal || 'Genel Bilgi'} • 🕒 {lead.preferredTime || '-'}
                                                                                    </div>
                                                                                    {lead.note && (
                                                                                        <div style={{ fontSize: '0.73rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: '3px' }}>
                                                                                            "{lead.note}"
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleWhatsAppLead(lead)}
                                                                                        style={{ backgroundColor: '#22c55e', color: '#052e16', border: 'none', padding: '5px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                                    >
                                                                                        <MessageCircle size={13} /> WhatsApp
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMarkLeadContacted(lead.id)}
                                                                                        style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '5px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                                                        title="Görüşüldü olarak işaretle"
                                                                                    >
                                                                                        ✓ Görüşüldü
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* GRUP 3: KRİTİK STOK & TÜKENEN ÜRÜN UYARILARI */}
                                                    {(notifCategory === 'all' || notifCategory === 'stock') && (
                                                        <div style={{ backgroundColor: '#131722', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', overflow: 'hidden' }}>
                                                            <div
                                                                onClick={() => toggleGroupCollapse('stock')}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#f87171', fontSize: '0.86rem' }}>
                                                                    <Package size={17} />
                                                                    <span>Kritik Stok & Tükenen Ürün Uyarıları ({criticalStockProducts.length})</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setShowNotifications(false); navigate('/admin/finance?tab=inventory'); }}
                                                                        style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                                                                    >
                                                                        Stok Yönetimi →
                                                                    </button>
                                                                    {collapsedGroups.stock ? <ChevronDown size={16} color="#f87171" /> : <ChevronUp size={16} color="#f87171" />}
                                                                </div>
                                                            </div>
                                                            {!collapsedGroups.stock && (
                                                                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {criticalStockProducts.length === 0 ? (
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '6px' }}>Kritik stok seviyesinin altında ürün bulunmuyor.</div>
                                                                    ) : (
                                                                        criticalStockProducts.map(prod => {
                                                                            const isOut = Number(prod.stockQuantity ?? 0) <= 0;
                                                                            return (
                                                                                <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#0d1017', padding: '10px 12px', borderRadius: '8px', border: isOut ? '1px solid rgba(239,68,68,0.45)' : '1px solid #1f2533' }}>
                                                                                    <div>
                                                                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.86rem' }}>{prod.name}</div>
                                                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                                            Kategori: {prod.category || 'Genel'} • Satış: {Number(prod.sellingPrice || 0).toLocaleString('tr-TR')} ₺
                                                                                        </div>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                        <span style={{
                                                                                            backgroundColor: isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                                                            border: `1px solid ${isOut ? '#ef4444' : '#f59e0b'}`,
                                                                                            color: isOut ? '#fca5a5' : '#fde68a',
                                                                                            padding: '3px 8px',
                                                                                            borderRadius: '6px',
                                                                                            fontSize: '0.73rem',
                                                                                            fontWeight: '900'
                                                                                        }}>
                                                                                            {isOut ? '🚨 TÜKENDİ (0 Adet)' : `⚠️ Kalan: ${prod.stockQuantity} Adet`}
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => { setShowNotifications(false); navigate('/admin/finance?tab=inventory'); }}
                                                                                            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '5px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                                                                        >
                                                                                            + Stok Gir
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* GRUP 4: CARİ BORCU / VERESİYESİ BULUNAN ÜYELER */}
                                                    {(notifCategory === 'all' || notifCategory === 'debts') && (
                                                        <div style={{ backgroundColor: '#131722', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '12px', overflow: 'hidden' }}>
                                                            <div
                                                                onClick={() => toggleGroupCollapse('debts')}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#c084fc', fontSize: '0.86rem' }}>
                                                                    <CreditCard size={17} />
                                                                    <span>Cari Borcu / Veresiyesi Bulunan Üyeler ({debtorMembers.length})</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {totalReceivableDebt > 0 && (
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#e9d5ff', backgroundColor: 'rgba(168,85,247,0.2)', padding: '3px 8px', borderRadius: '8px' }}>
                                                                            Alacak: {totalReceivableDebt.toLocaleString('tr-TR')} ₺
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setStatusFilter('InDebt');
                                                                            setCurrentPage(1);
                                                                            setShowNotifications(false);
                                                                        }}
                                                                        style={{ backgroundColor: '#a855f7', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                                                                    >
                                                                        Tabloda Filtrele
                                                                    </button>
                                                                    {collapsedGroups.debts ? <ChevronDown size={16} color="#c084fc" /> : <ChevronUp size={16} color="#c084fc" />}
                                                                </div>
                                                            </div>
                                                            {!collapsedGroups.debts && (
                                                                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {debtorMembers.length === 0 ? (
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '6px' }}>Cari borcu bulunan üye yok.</div>
                                                                    ) : (
                                                                        debtorMembers.slice(0, 8).map(m => (
                                                                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#0d1017', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1f2533' }}>
                                                                                <div>
                                                                                    <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.86rem' }}>{m.displayName}</div>
                                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📞 {m.phoneNumber || '-'}</div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <span style={{ fontWeight: '900', color: '#f87171', fontSize: '0.86rem' }}>
                                                                                        {m.kalanBorc.toLocaleString('tr-TR')} ₺ Borç
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setShowNotifications(false);
                                                                                            navigate(`/admin/member/${m.id}`);
                                                                                        }}
                                                                                        style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '5px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                                                                    >
                                                                                        Üye Kartı →
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* GRUP 5: ÜYELİĞİ YAKINDA BİTECEK ÜYELER (SON 5 GÜN) */}
                                                    {(notifCategory === 'all' || notifCategory === 'expiring') && (
                                                        <div style={{ backgroundColor: '#131722', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', overflow: 'hidden' }}>
                                                            <div
                                                                onClick={() => toggleGroupCollapse('expiring')}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#34d399', fontSize: '0.86rem' }}>
                                                                    <Clock size={17} />
                                                                    <span>Üyeliği Yakında Bitecekler - Son 5 Gün ({expiringSoonMembers.length})</span>
                                                                </div>
                                                                {collapsedGroups.expiring ? <ChevronDown size={16} color="#34d399" /> : <ChevronUp size={16} color="#34d399" />}
                                                            </div>
                                                            {!collapsedGroups.expiring && (
                                                                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {expiringSoonMembers.length === 0 ? (
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '6px' }}>Önümüzdeki 5 gün içinde üyeliği bitecek sporcu bulunmuyor.</div>
                                                                    ) : (
                                                                        expiringSoonMembers.map(m => (
                                                                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#0d1017', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1f2533', flexWrap: 'wrap' }}>
                                                                                <div>
                                                                                    <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.86rem' }}>{m.displayName}</div>
                                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                                        📞 {m.phoneNumber || '-'} • Bitiş: {new Date(m.subscriptionEndDate).toLocaleDateString('tr-TR')}
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                    <span style={{
                                                                                        backgroundColor: m.daysLeft === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.18)',
                                                                                        color: m.daysLeft === 0 ? '#fca5a5' : '#fde68a',
                                                                                        padding: '3px 8px',
                                                                                        borderRadius: '6px',
                                                                                        fontSize: '0.72rem',
                                                                                        fontWeight: '900'
                                                                                    }}>
                                                                                        {m.daysLeft === 0 ? '🚨 BUGÜN SON' : `⏳ ${m.daysLeft} Gün Kaldı`}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setShowNotifications(false);
                                                                                            openRenewModal(m);
                                                                                        }}
                                                                                        style={{ backgroundColor: '#10b981', color: '#052e16', border: 'none', padding: '5px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer' }}
                                                                                    >
                                                                                        + Uzat
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleWhatsAppExpiringMember(m, m.daysLeft)}
                                                                                        style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#4ade80', padding: '5px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                                                                        title="WhatsApp'tan Süre Hatırlatması Gönder"
                                                                                    >
                                                                                        💬
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button onClick={() => { localStorage.removeItem('n1fit_token'); navigate('/admin/login'); }} style={styles.logoutBtn}>
                            <LogOut size={18} /> Çıkış
                        </button>
                    </div>
                </div>
                <div style={styles.filterBar}>
                    <div style={styles.searchBox}>
                        <Search size={20} color="#666" />
                        <input
                            placeholder="Müşteri ismini yaz..."
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={styles.input}
                        />
                    </div>
                    <select
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={styles.select}
                    >
                        <option value="All">Tüm Liste</option>
                        <option value="Active">Aktifler</option>
                        <option value="Passive">Pasifler</option>
                        <option value="InDebt">Borçlular</option>
                        <option value="Clean">Cari Temiz</option>
                        <option value="Frozen">Dondurulmuşlar</option>
                    </select>
                    <div style={styles.dateBox}>
                        <Calendar size={18} color="#d90429" />
                        <input
                            type="date"
                            onChange={(e) => {
                                setDateRange({ ...dateRange, start: e.target.value });
                                setCurrentPage(1);
                            }}
                            style={styles.dateInput}
                        />
                        <span style={{ color: '#666' }}> - </span>
                        <input
                            type="date"
                            onChange={(e) => {
                                setDateRange({ ...dateRange, end: e.target.value });
                                setCurrentPage(1);
                            }}
                            style={styles.dateInput}
                        />
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
                    <button onClick={() => navigate('/admin/studio')} style={styles.libraryBtn}>
                        <Sparkles size={18} color="#d90429" /> Web Stüdyosu
                    </button>
                    <button onClick={() => navigate('/admin/finance')} style={styles.libraryBtn}>
                        <Wallet size={18} color="#d90429" /> Finans & Kasa
                    </button>
                    <div style={{
                        marginLeft: 'auto',
                        backgroundColor: '#0a0a0a',
                        border: '2px solid #d90429',
                        color: '#d90429',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '900',
                        fontSize: '1.1rem',
                        boxShadow: '0 0 15px rgba(217, 4, 41, 0.2)'
                    }}>
                        <Users size={20} />
                        LİSTELENEN: {filteredMembers.length}
                    </div>
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
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Yükleniyor...</td></tr>
                            ) : ekrandaGosterilecekAdamlar.length > 0 ? ekrandaGosterilecekAdamlar.map(m => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                const startDate = m.membershipStartDate ? new Date(m.membershipStartDate) : null;
                                if (startDate) startDate.setHours(0, 0, 0, 0);

                                const endDate = m.subscriptionEndDate ? new Date(m.subscriptionEndDate) : null;
                                if (endDate) endDate.setHours(0, 0, 0, 0);

                                const isFrozen = m.isFrozen === true;
                                const isFuture = startDate && startDate > today;
                                const isStarted = !startDate || startDate <= today;
                                const isNotExpired = !endDate || endDate >= today;
                                const isActive = !isFrozen && isStarted && isNotExpired;

                                let daysLeftText = "-";
                                let daysLeftColor = "#fff";

                                if (isFuture) {
                                    const diffToStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
                                    daysLeftText = `Başlamasına ${diffToStart} Gün`;
                                    daysLeftColor = "#f59e0b";
                                } else if (isFrozen) {
                                    daysLeftText = "Donduruldu";
                                    daysLeftColor = "#3b82f6";
                                } else if (endDate) {
                                    const diffTime = endDate - today;
                                    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    if (daysLeft < 0) {
                                        daysLeftText = "Süre Doldu";
                                        daysLeftColor = "#d90429";
                                    } else {
                                        daysLeftText = `${daysLeft} Gün Kaldı`;
                                        daysLeftColor = daysLeft < 5 ? '#d90429' : '#4ade80';
                                    }
                                }

                                const kalanBorc = Math.max(0, (m.totalDebt || 0) - (m.paidAmount || 0));
                                const musteriIsmi = m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "İsimsiz Üye";

                                let statusBadgeText = "PASİF";
                                let statusBadgeBg = "rgba(217, 4, 41, 0.1)";
                                let statusBadgeColor = "#d90429";
                                let statusBadgeBorder = "#d90429";

                                if (isFrozen) {
                                    statusBadgeText = "DONDURULDU";
                                    statusBadgeBg = "rgba(59, 130, 246, 0.1)";
                                    statusBadgeColor = "#3b82f6";
                                    statusBadgeBorder = "#3b82f6";
                                } else if (isFuture) {
                                    statusBadgeText = "PASİF (BAŞLAMADI)";
                                    statusBadgeBg = "rgba(245, 158, 11, 0.12)";
                                    statusBadgeColor = "#f59e0b";
                                    statusBadgeBorder = "#f59e0b";
                                } else if (isActive) {
                                    statusBadgeText = "AKTİF";
                                    statusBadgeBg = "rgba(74, 222, 128, 0.1)";
                                    statusBadgeColor = "#4ade80";
                                    statusBadgeBorder = "#4ade80";
                                }

                                return (
                                    <tr key={m.id} style={styles.tableRow}>
                                        <td style={{ fontWeight: 'bold' }}>{musteriIsmi}</td>
                                        <td>{m.phoneNumber || "-"}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>Bşl: {m.membershipStartDate ? new Date(m.membershipStartDate).toLocaleDateString('tr-TR') : "-"}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#aaa' }}>Bit: {endDate && endDate.getFullYear() > 1970 ? endDate.toLocaleDateString('tr-TR') : "-"}</div>
                                        </td>
                                        <td style={{ color: daysLeftColor, fontWeight: 'bold' }}>
                                            {daysLeftText}
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>
                                            {kalanBorc > 0 ? (
                                                <span style={{ color: '#d90429' }}>{kalanBorc} TL Borçlu</span>
                                            ) : (
                                                <span style={{ color: isActive ? '#4ade80' : '#888' }}>
                                                    {isActive ? 'Temiz' : 'Üyelik Bitti'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{
                                                ...styles.badge,
                                                backgroundColor: statusBadgeBg,
                                                color: statusBadgeColor,
                                                border: `1px solid ${statusBadgeBorder}`
                                            }}>
                                                {statusBadgeText}
                                            </div>
                                        </td>
                                        <td>
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
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Kayıt bulunamadı.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', paddingBottom: '20px' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{ ...styles.actionBtn, backgroundColor: currentPage === 1 ? '#333' : '#d90429', border: 'none', padding: '10px 20px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            &laquo; Önceki
                        </button>
                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            Sayfa {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{ ...styles.actionBtn, backgroundColor: currentPage === totalPages ? '#333' : '#d90429', border: 'none', padding: '10px 20px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            Sonraki &raquo;
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContentMain}>
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
                            <input style={styles.modalInput} placeholder={editingMemberId ? "Şifre (Değişmeyecekse boş bırak)" : "Şifre"} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingMemberId} />

                            {/* BAŞLAMA VE BİTİŞ TARİHLERİ */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.smallLabel}>Başlama Tarihi:</label>
                                    <input
                                        style={{ ...styles.modalInput, width: '100%', boxSizing: 'border-box' }}
                                        type="date"
                                        value={formData.membershipStartDate}
                                        onChange={e => handleStartDateChange(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.smallLabel}>Bitiş Tarihi:</label>
                                    <input
                                        style={{ ...styles.modalInput, width: '100%', boxSizing: 'border-box' }}
                                        type="date"
                                        value={formData.subscriptionEndDate}
                                        onChange={e => handleEndDateChange(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* CANLI SÜRE VE AKTİFLİK DURUM KARTI */}
                            {durationSummary && (
                                <div style={{
                                    backgroundColor: durationSummary.isValid ? (durationSummary.isFuture ? 'rgba(245, 158, 11, 0.12)' : 'rgba(74, 222, 128, 0.1)') : 'rgba(217, 4, 41, 0.15)',
                                    border: `1px solid ${durationSummary.isValid ? (durationSummary.isFuture ? '#f59e0b' : '#4ade80') : '#d90429'}`,
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    fontSize: '0.85rem'
                                }}>
                                    {durationSummary.isValid ? (
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: durationSummary.isFuture ? '#fcd34d' : '#4ade80', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>📅 Toplam Süre: {durationSummary.diffDays} Gün (~{durationSummary.approxMonths} Ay)</span>
                                                <span>{durationSummary.isFuture ? '⏳ PASİF BAŞLAYACAK' : '✅ ANINDA AKTİF'}</span>
                                            </div>
                                            <div style={{ color: '#ccc', marginTop: '5px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                {durationSummary.isFuture ? (
                                                    <>Başlangıç tarihi ileri bir tarih ({new Date(formData.membershipStartDate).toLocaleDateString('tr-TR')}) olduğu için üyelik o güne kadar <strong>PASİF</strong> kalacak, o gün geldiğinde sistem tarafından otomatik <strong>AKTİF</strong> konuma geçecektir.</>
                                                ) : (
                                                    <>Başlangıç tarihi bugünü kapsadığı için üyelik kayıttan itibaren doğrudan <strong>AKTİF</strong> olacaktır.</>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#fca5a5', fontWeight: 'bold' }}>
                                            ⚠️ Bitiş tarihi başlangıç tarihinden sonraki bir tarih olmalıdır!
                                        </div>
                                    )}
                                </div>
                            )}

                            {!editingMemberId && (
                                <>
                                    <label style={styles.smallLabel}>Üyelik Paketi Seç:</label>
                                    <select style={styles.modalInput} value={formData.packageId} onChange={e => handlePackageChangeInNewForm(e.target.value)} required>
                                        <option value="">Paket Seç...</option>
                                        {packages.map(p => (
                                            <option key={p.id || p.Id} value={p.id || p.Id}>{p.name || p.Name} - {p.price || p.Price} TL ({p.durationMonths || p.DurationMonths} Ay)</option>
                                        ))}
                                    </select>

                                    <label style={styles.smallLabel}>Alınan Peşinat (TL):</label>
                                    <input style={styles.modalInput} placeholder="Örn: 1500" type="number" value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: e.target.value })} required />
                                </>
                            )}

                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>İPTAL</button>
                                <button
                                    type="submit"
                                    disabled={durationSummary && !durationSummary.isValid}
                                    style={{
                                        ...styles.saveBtn,
                                        opacity: durationSummary && !durationSummary.isValid ? 0.5 : 1,
                                        cursor: durationSummary && !durationSummary.isValid ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {editingMemberId ? 'BİLGİLERİ GÜNCELLE' : 'KAYDET VE BORÇLANDIR'}
                                </button>
                            </div>
                        </form>

                        {editingMemberId && (
                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #333', display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => openRenewModal(selectedMember)}
                                    style={{ ...styles.submitBtn, backgroundColor: '#3b82f6', color: 'white', flex: 1, padding: '10px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    + ÜYELİĞİ UZAT
                                </button>

                                {selectedMember && ((selectedMember.totalDebt || 0) - (selectedMember.paidAmount || 0)) > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPayDebtModal(true)}
                                        style={{ ...styles.submitBtn, backgroundColor: '#d90429', color: 'white', flex: 1, padding: '10px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        $ BORÇ ÖDE
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showRenewModal && selectedRenewMember && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={{ marginTop: 0, color: '#4ade80', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            {selectedRenewMember.firstName || selectedRenewMember.fullName} İçin Üyelik Yenile / Uzat
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            {/* BAŞLAMA VE BİTİŞ TARİHLERİ */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.modalLabel}>Uzatma Başlangıç Tarihi:</label>
                                    <input
                                        style={{ ...styles.input, width: '100%', boxSizing: 'border-box', backgroundColor: '#1a1a1a', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}
                                        type="date"
                                        value={renewForm.startDate}
                                        onChange={e => handleRenewStartDateChange(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.modalLabel}>Uzatma Bitiş Tarihi:</label>
                                    <input
                                        style={{ ...styles.input, width: '100%', boxSizing: 'border-box', backgroundColor: '#1a1a1a', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}
                                        type="date"
                                        value={renewForm.endDate}
                                        onChange={e => handleRenewEndDateChange(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* CANLI SÜRE VE AKTİFLİK DURUM KARTI */}
                            {renewDurationSummary && (
                                <div style={{
                                    backgroundColor: renewDurationSummary.isValid ? (renewDurationSummary.isFuture ? 'rgba(245, 158, 11, 0.12)' : 'rgba(74, 222, 128, 0.1)') : 'rgba(217, 4, 41, 0.15)',
                                    border: `1px solid ${renewDurationSummary.isValid ? (renewDurationSummary.isFuture ? '#f59e0b' : '#4ade80') : '#d90429'}`,
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    fontSize: '0.85rem'
                                }}>
                                    {renewDurationSummary.isValid ? (
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: renewDurationSummary.isFuture ? '#fcd34d' : '#4ade80', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>📅 Uzatılacak Süre: {renewDurationSummary.diffDays} Gün (~{renewDurationSummary.approxMonths} Ay)</span>
                                                <span>{renewDurationSummary.isFuture ? '⏳ İLERİDE AKTİF' : '✅ ANINDA AKTİF'}</span>
                                            </div>
                                            <div style={{ color: '#ccc', marginTop: '5px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                {renewDurationSummary.isFuture ? (
                                                    <>Başlangıç tarihi ileri bir tarih ({new Date(renewForm.startDate).toLocaleDateString('tr-TR')}) olduğu için yeni dönem o güne kadar beklemede kalır, o gün geldiğinde otomatik olarak devreye girer.</>
                                                ) : (
                                                    <>Uzatılan üyelik süresi seçilen tarihten itibaren kesintisiz devam edecektir.</>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#fca5a5', fontWeight: 'bold' }}>
                                            ⚠️ Bitiş tarihi başlangıç tarihinden sonraki bir tarih olmalıdır!
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label style={styles.modalLabel}>Uzatılacak Paket</label>
                                <select
                                    style={styles.input}
                                    value={renewForm.packageId}
                                    onChange={e => handleRenewPackageChange(e.target.value)}
                                >
                                    <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Paket Seçiniz...</option>
                                    {packages.map(p => (
                                        <option key={p.id || p.Id} value={p.id || p.Id} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                                            {p.name || p.Name} - {p.price || p.Price} ₺ ({p.durationMonths || p.DurationMonths} Ay)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Alınan Ödeme (Peşinat)</label>
                                <input
                                    style={{ ...styles.input, border: '1px solid #edf2f4', borderRadius: '8px', backgroundColor: '#1a1a1a', color: 'white', padding: '10px' }}
                                    type="number"
                                    step="0.1"
                                    placeholder="Kasaya giren nakit"
                                    value={renewForm.paidAmount}
                                    onChange={e => setRenewForm({ ...renewForm, paidAmount: e.target.value })}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px', display: 'block' }}>
                                    Not: Paketin fiyatı üyenin eski borcunun üstüne otomatik eklenecektir.
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button
                                    onClick={async () => {
                                        if (!renewForm.packageId) return alert("Paket Seçiniz!");
                                        if (renewDurationSummary && !renewDurationSummary.isValid) {
                                            return alert("Bitiş tarihi başlangıç tarihinden sonraki bir tarih olmalıdır!");
                                        }
                                        try {
                                            const payload = {
                                                packageId: parseInt(renewForm.packageId, 10),
                                                paidAmount: parseFloat(renewForm.paidAmount) || 0,
                                                startDate: renewForm.startDate || null,
                                                endDate: renewForm.endDate || null
                                            };
                                            await api.post(`/Admin/members/${selectedRenewMember.id}/renew`, payload);
                                            alert("Üyelik Süresi Uzatıldı!");
                                            setShowRenewModal(false);
                                            fetchMembers();
                                            fetchNotificationsData();
                                        } catch {
                                            alert("Üyelik uzatılırken bir hata oluştu!");
                                        }
                                    }}
                                    disabled={renewDurationSummary && !renewDurationSummary.isValid}
                                    style={{
                                        backgroundColor: '#4ade80',
                                        color: '#0a0a0a',
                                        border: 'none',
                                        padding: '12px 20px',
                                        borderRadius: '8px',
                                        cursor: renewDurationSummary && !renewDurationSummary.isValid ? 'not-allowed' : 'pointer',
                                        fontWeight: '900',
                                        flex: 1,
                                        textTransform: 'uppercase',
                                        fontSize: '0.9rem',
                                        boxShadow: '0 4px 10px rgba(74, 222, 128, 0.2)',
                                        opacity: renewDurationSummary && !renewDurationSummary.isValid ? 0.5 : 1
                                    }}
                                >
                                    Onayla ve Uzat
                                </button>

                                <button
                                    onClick={() => setShowRenewModal(false)}
                                    style={{ backgroundColor: 'transparent', color: '#d90429', border: '2px solid #d90429', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '900', flex: 1, textTransform: 'uppercase', fontSize: '0.9rem' }}
                                >
                                    İptal Et
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPayDebtModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{ color: '#d90429', marginTop: 0 }}>Borç Tahsilatı</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                            Kalan Borç: {Math.max(0, (selectedMember.totalDebt || 0) - (selectedMember.paidAmount || 0))} TL
                        </p>
                        <div style={{ marginTop: '15px' }}>
                            <label style={styles.modalLabel}>Ödenen Miktar (TL)</label>
                            <input
                                style={{ ...styles.input, backgroundColor: '#1a1a1a', padding: '10px', border: '1px solid #333', borderRadius: '8px' }}
                                type="number"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="Kasaya giren nakiti yaz..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handlePayDebt} style={{ backgroundColor: '#d90429', color: 'white', flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                ÖDEMEYİ AL
                            </button>
                            <button onClick={() => setShowPayDebtModal(false)} style={{ backgroundColor: '#444', color: 'white', flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                İPTAL
                            </button>
                        </div>
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
    actionBtn: { padding: '6px 10px', color: 'white', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContentMain: { backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '2px solid #d90429', width: '450px', boxShadow: '0 0 20px rgba(217, 4, 41, 0.3)' },
    modalForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
    modalInput: { padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' },
    smallLabel: { color: '#aaa', fontSize: '0.85rem', marginBottom: '3px', display: 'block' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
    saveBtn: { backgroundColor: '#d90429', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { backgroundColor: '#333', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    modalContent: {
        backgroundColor: '#111',
        padding: '30px',
        borderRadius: '16px',
        border: '1px solid #333',
        width: '90%',
        maxWidth: '420px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
    },
    modalLabel: { color: '#888', fontSize: '0.85rem', marginBottom: '8px', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }
};

export default AdminDashboard;
