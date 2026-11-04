import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
    ArrowLeft, DollarSign, CreditCard, Banknote, TrendingUp, TrendingDown,
    ShoppingCart, Package, AlertTriangle, CheckCircle2, XCircle, Plus,
    Trash2, Edit, Search, Calendar, FileDown, RefreshCw, Clock, Layers,
    PlusCircle, MinusCircle, BarChart3, PieChart, Wallet, Receipt,
    DownloadCloud, Percent, Tag, ArrowUpRight, Check, Sparkles, Lock, Award, Filter
} from 'lucide-react';

const BULK_INCOME_CATEGORIES = [
    'Spor Üyeliği',
    'Açılış Kasası / Devir',
    'Havale / EFT',
    'Özel Ders (PT)',
    'Bar / Mağaza Satışı',
    'Kayıt / Kart Bedeli',
    'Diğer Gelir'
];

const EXPENSE_CATEGORIES = [
    'Kira',
    'Elektrik / Su / Doğalgaz',
    'Toptan Ürün Alımı (Stok)',
    'Tek Seferlik Ürün / Demirbaş Alımı',
    'Personel / Antrenör Maaşı',
    'Temizlik & Hijyen',
    'Bakım & Onarım',
    'Reklam & Pazarlama',
    'İnternet / Muhasebe / Vergi',
    'Diğer Gider'
];

const PRODUCT_CATEGORIES = [
    'İçecek',
    'Supplement',
    'Atıştırmalık',
    'Ekipman',
    'Diğer'
];

const formatCurrency = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

const FinanceManager = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => {
        const t = new URLSearchParams(window.location.search).get('tab');
        if (t === 'inventory') return 'products';
        if (t === 'bulk') return 'bulk_income';
        return ['dashboard', 'pos', 'bulk_income', 'products', 'expenses', 'approvals', 'cashops', 'ledger'].includes(t) ? t : 'dashboard';
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // 1. Dashboard State
    const [period, setPeriod] = useState('this_month');
    const [customStart, setCustomStart] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);
    const [dashboard, setDashboard] = useState({
        totalIncome: 0, totalTurnover: 0, totalExpense: 0, netProfit: 0,
        posMembershipGrossIncome: 0, posMembershipVatDeduction: 0, posMembershipNetIncome: 0,
        cashIncome: 0, cashExpense: 0, cashBalance: 0,
        posIncome: 0, posExpense: 0, posBalance: 0,
        membershipIncome: 0, storeSaleIncome: 0, storeSaleGrossProfit: 0, totalSoldProductUnits: 0,
        pendingApprovalsCount: 0, pendingApprovalsAmount: 0, lowStockProductsCount: 0,
        dailyTrend: [], incomeByCategory: [], expenseByCategory: [],
        packageRevenueBreakdown: [], topSellingProducts: [], allProductsDemand: [],
        topSellingPackages: [], allPackagesDemand: []
    });
    const [demandChartMode, setDemandChartMode] = useState('quantity'); // 'quantity' | 'revenue'
    const [packageDemandMode, setPackageDemandMode] = useState('count'); // 'count' | 'revenue'

    // 2. Products & POS State
    const [products, setProducts] = useState([]);
    const [membersList, setMembersList] = useState([]);
    const [selectedPosMemberId, setSelectedPosMemberId] = useState('');
    const [posMemberSearch, setPosMemberSearch] = useState('');
    const [tenderedCash, setTenderedCash] = useState('');
    const [posSearch, setPosSearch] = useState('');
    const [posCategory, setPosCategory] = useState('Tümü');
    const [cart, setCart] = useState([]);
    const [discountAmount, setDiscountAmount] = useState('');
    const [priceSurcharge, setPriceSurcharge] = useState('');
    const [percentDiscountInput, setPercentDiscountInput] = useState('');
    const [posCashInput, setPosCashInput] = useState('');
    const [posCardInput, setPosCardInput] = useState('');
    const [saleNote, setSaleNote] = useState('');
    const [recentSales, setRecentSales] = useState([]);

    // 2.1 Toplu / Ay Başı Gelir Girişi Modülü State
    const [bulkIncomeList, setBulkIncomeList] = useState([
        {
            id: 1,
            date: new Date().toISOString().split('T')[0],
            category: 'Spor Üyeliği',
            title: 'Kasım Ay Başı Spor Üyelikleri Toplamı',
            amount: '',
            paymentMethod: 'Cash',
            cashAmount: '',
            posAmount: '',
            description: 'Ay başı devir / başlangıç üyelik gelirleri'
        }
    ]);
    const [bulkBatchNote, setBulkBatchNote] = useState('');
    const [bulkSaving, setBulkSaving] = useState(false);

    // 3. Product CRUD State
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '', category: 'İçecek', barcode: '', buyingPrice: '', sellingPrice: '', stockQuantity: '', minStockAlert: '5', isActive: true
    });

    // 4. Expenses State
    const [expenses, setExpenses] = useState([]);
    const [expenseForm, setExpenseForm] = useState({
        title: '', category: 'Kira', amount: '', paymentMethod: 'Cash',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '', linkedProductId: '', addedStockQuantity: ''
    });

    // 5. Pending Membership Payments State
    const [pendingPayments, setPendingPayments] = useState([]);
    const [approvalFilter, setApprovalFilter] = useState('Pending');
    const [customApprovalAmounts, setCustomApprovalAmounts] = useState({});
    const [approvalSplits, setApprovalSplits] = useState({});

    // 6. Ledger / Transactions State
    const [transactions, setTransactions] = useState([]);
    const [txTypeFilter, setTxTypeFilter] = useState('All');
    const [txMethodFilter, setTxMethodFilter] = useState('All');
    const [txSearch, setTxSearch] = useState('');
    const [txDateRangeMode, setTxDateRangeMode] = useState('all'); // 'all', 'today', 'yesterday', '7d', 'this_month', 'last_month', 'single_date', 'custom'
    const [txCustomDate, setTxCustomDate] = useState('');
    const [txStartDate, setTxStartDate] = useState('');
    const [txEndDate, setTxEndDate] = useState('');

    // 7. Kasa Virman & Gün Sonu Z-Raporu State
    const [transferForm, setTransferForm] = useState({
        transferType: 'CashToPos',
        amount: '',
        note: ''
    });
    const [zReportForm, setZReportForm] = useState({
        countedCash: '',
        handedOverCash: '',
        autoAdjustDiscrepancy: true,
        note: ''
    });

    const showMessage = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchDashboard = async (selectedPeriod = period) => {
        try {
            setLoading(true);
            let url = `/Finance/dashboard?period=${selectedPeriod}`;
            if (selectedPeriod === 'custom') {
                url += `&customStart=${customStart}&customEnd=${customEnd}`;
            }
            const res = await api.get(url);
            if (res.data) setDashboard(res.data);
        } catch (err) {
            console.error('Dashboard yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/Finance/products');
            setProducts(res.data || []);
        } catch (err) {
            console.error('Ürünler yüklenemedi:', err);
        }
    };

    const fetchRecentSales = async () => {
        try {
            const res = await api.get('/Finance/sales?count=30');
            setRecentSales(res.data || []);
        } catch (err) {
            console.error('Satışlar yüklenemedi:', err);
        }
    };

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/Finance/expenses');
            setExpenses(res.data || []);
        } catch (err) {
            console.error('Giderler yüklenemedi:', err);
        }
    };

    const fetchPendingPayments = async () => {
        try {
            const res = await api.get('/Finance/pending-memberships?status=All');
            setPendingPayments(res.data || []);
        } catch (err) {
            console.error('Üyelik onayları yüklenemedi:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/Finance/transactions');
            setTransactions(res.data || []);
        } catch (err) {
            console.error('Kasa hareketleri yüklenemedi:', err);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/Admin/members');
            setMembersList(res.data || []);
        } catch (err) {
            console.error('Üyeler yüklenemedi:', err);
        }
    };

    const refreshAll = async () => {
        await Promise.all([
            fetchDashboard(period),
            fetchProducts(),
            fetchRecentSales(),
            fetchExpenses(),
            fetchPendingPayments(),
            fetchTransactions(),
            fetchMembers()
        ]);
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            fetchDashboard(newPeriod);
        }
    };

    // ==========================================
    // TOPLU GELİR HESAPLAMALARI
    // ==========================================
    const totalBulkAmount = useMemo(() => {
        return bulkIncomeList.reduce((sum, item) => {
            const amt = parseFloat(item.amount || 0);
            const cash = parseFloat(item.cashAmount || 0);
            const pos = parseFloat(item.posAmount || 0);
            if (item.paymentMethod === 'Split') {
                return sum + (cash + pos > 0 ? cash + pos : amt);
            }
            return sum + amt;
        }, 0);
    }, [bulkIncomeList]);

    const totalBulkCash = useMemo(() => {
        return bulkIncomeList.reduce((sum, item) => {
            const amt = parseFloat(item.amount || 0);
            const cash = parseFloat(item.cashAmount || 0);
            if (item.paymentMethod === 'Cash') return sum + amt;
            if (item.paymentMethod === 'Split') return sum + cash;
            return sum;
        }, 0);
    }, [bulkIncomeList]);

    const totalBulkPos = useMemo(() => {
        return bulkIncomeList.reduce((sum, item) => {
            const amt = parseFloat(item.amount || 0);
            const pos = parseFloat(item.posAmount || 0);
            if (item.paymentMethod === 'POS') return sum + amt;
            if (item.paymentMethod === 'Split') return sum + pos;
            return sum;
        }, 0);
    }, [bulkIncomeList]);

    const historicalBulkIncomes = useMemo(() => {
        return transactions.filter(t => t.source === 'BulkIncome' || (t.category && t.category.includes('Açılış')));
    }, [transactions]);

    // ==========================================
    // POS / HIZLI SATIŞ FONKSİYONLARI
    // ==========================================
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            const sPrice = Number(product.sellingPrice || 0);
            return [...prev, {
                productId: product.id,
                name: product.name,
                originalPrice: sPrice,
                price: sPrice,
                stock: product.stockQuantity,
                quantity: 1
            }];
        });
    };

    const updateCartQty = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }).filter(Boolean));
    };

    const updateCartItemPrice = (productId, newPrice) => {
        const parsed = newPrice === '' ? '' : Math.max(0, parseFloat(newPrice) || 0);
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;
            return {
                ...item,
                price: parsed
            };
        }));
        setPosCashInput('');
        setPosCardInput('');
    };

    const resetCartItemPrice = (productId) => {
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;
            return {
                ...item,
                price: item.originalPrice
            };
        }));
        setPosCashInput('');
        setPosCardInput('');
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    // Sepetin standart liste fiyatları alt toplamı
    const cartOriginalSubTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (Number(item.originalPrice ?? item.price ?? 0) * item.quantity), 0);
    }, [cart]);

    // Sepetteki güncel fiyatlar alt toplamı
    const cartSubTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);
    }, [cart]);

    // Nihai Net Toplam (İndirim veya Fiyat Artışı / Zam Dahil)
    const cartTotal = useMemo(() => {
        const disc = Math.max(0, parseFloat(discountAmount || 0));
        const surcharge = Math.max(0, parseFloat(priceSurcharge || 0));
        return Math.max(0, Math.round((cartSubTotal - disc + surcharge) * 100) / 100);
    }, [cartSubTotal, discountAmount, priceSurcharge]);

    // POS indirim yardımcı fonksiyonları
    const applyPercentDiscount = (pct) => {
        if (cartSubTotal <= 0) return;
        const disc = Math.round((cartSubTotal * (pct / 100)) * 100) / 100;
        setDiscountAmount(String(disc));
        setPriceSurcharge('');
        setPercentDiscountInput(String(pct));
        setPosCashInput('');
        setPosCardInput('');
    };

    const applyDirectAmountDiscount = (amount) => {
        if (cartSubTotal <= 0) return;
        const disc = Math.min(cartSubTotal, Math.max(0, parseFloat(amount || 0)));
        setDiscountAmount(String(disc));
        setPriceSurcharge('');
        setPercentDiscountInput('');
        setPosCashInput('');
        setPosCardInput('');
    };

    // Kullanıcı toplam tutarı elle değiştirirse (Örn: 120 TL'lik sepeti doğrudan 100 TL veya 140 TL yapma)
    const handleDirectTotalChange = (val) => {
        if (val === '') {
            setDiscountAmount('');
            setPriceSurcharge('');
            setPosCashInput('');
            setPosCardInput('');
            return;
        }
        const target = Math.max(0, parseFloat(val) || 0);
        if (target < cartSubTotal) {
            // Otomatik İndirim
            const diff = Math.round((cartSubTotal - target) * 100) / 100;
            setDiscountAmount(String(diff));
            setPriceSurcharge('');
        } else if (target > cartSubTotal) {
            // Otomatik Zam
            const diff = Math.round((target - cartSubTotal) * 100) / 100;
            setPriceSurcharge(String(diff));
            setDiscountAmount('');
        } else {
            setDiscountAmount('');
            setPriceSurcharge('');
        }
        setPosCashInput('');
        setPosCardInput('');
    };

    const applyRoundDownDiscount = () => {
        if (cartSubTotal <= 10) return;
        const remainder = cartSubTotal % 50 !== 0 ? (cartSubTotal % 10 !== 0 ? cartSubTotal % 10 : cartSubTotal % 50) : 10;
        setDiscountAmount(String(remainder));
        setPriceSurcharge('');
        setPercentDiscountInput('');
        setPosCashInput('');
        setPosCardInput('');
    };

    const splitPosHalfAndHalf = () => {
        if (cartTotal <= 0) return;
        const half = Math.round((cartTotal / 2) * 100) / 100;
        const rest = Math.round((cartTotal - half) * 100) / 100;
        setPosCashInput(String(half));
        setPosCardInput(String(rest));
    };

    const handlePosCashChange = (val) => {
        setPosCashInput(val);
        if (val === '') {
            setPosCardInput('');
            return;
        }
        const cashVal = Math.max(0, parseFloat(val || 0));
        const remaining = Math.max(0, Math.round((cartTotal - cashVal) * 100) / 100);
        setPosCardInput(String(remaining));
    };

    const handlePosCardChange = (val) => {
        setPosCardInput(val);
        if (val === '') {
            setPosCashInput('');
            return;
        }
        const cardVal = Math.max(0, parseFloat(val || 0));
        const remaining = Math.max(0, Math.round((cartTotal - cardVal) * 100) / 100);
        setPosCashInput(String(remaining));
    };

    const fillRemainingPosCash = () => {
        const cardVal = Math.max(0, parseFloat(posCardInput || 0));
        const remaining = Math.max(0, Math.round((cartTotal - cardVal) * 100) / 100);
        setPosCashInput(String(remaining));
    };

    const fillRemainingPosCard = () => {
        const cashVal = Math.max(0, parseFloat(posCashInput || 0));
        const remaining = Math.max(0, Math.round((cartTotal - cashVal) * 100) / 100);
        setPosCardInput(String(remaining));
    };

    const handleCheckout = async (paymentMethod) => {
        if (cart.length === 0) {
            showMessage('Sepetiniz boş! Önce satılacak ürünleri seçin.', 'error');
            return;
        }
        if (paymentMethod === 'Veresiye' && !selectedPosMemberId) {
            showMessage('Veresiye (Cari Hesaba) satış yapabilmek için lütfen bir üye seçin!', 'error');
            return;
        }
        try {
            setLoading(true);
            const disc = Math.max(0, parseFloat(discountAmount || 0));
            const surcharge = Math.max(0, parseFloat(priceSurcharge || 0));
            const cashVal = Math.max(0, parseFloat(posCashInput || 0));
            const cardVal = Math.max(0, parseFloat(posCardInput || 0));

            let finalNote = saleNote?.trim() || '';
            if (surcharge > 0) {
                finalNote = finalNote ? `${finalNote} [Otomatik Zam: +${surcharge} ₺]` : `[Otomatik Zam: +${surcharge} ₺]`;
            }

            let payload = {
                paymentMethod,
                discountAmount: disc,
                memberId: selectedPosMemberId ? parseInt(selectedPosMemberId, 10) : null,
                note: finalNote,
                items: cart.map(c => ({
                    productId: c.productId,
                    quantity: c.quantity,
                    customUnitPrice: (c.price !== undefined && Number(c.price) !== Number(c.originalPrice)) ? Number(c.price) : null
                }))
            };

            if (paymentMethod === 'Split') {
                if (cashVal <= 0 && cardVal <= 0) {
                    showMessage('Parçalı ödeme için Nakit veya POS tutarlarını girin.', 'error');
                    setLoading(false);
                    return;
                }
                payload.cashAmount = cashVal;
                payload.posAmount = cardVal;
            } else if (paymentMethod === 'Cash') {
                payload.cashAmount = cartTotal;
                payload.posAmount = 0;
            } else if (paymentMethod === 'POS') {
                payload.cashAmount = 0;
                payload.posAmount = cartTotal;
            } else if (paymentMethod === 'Veresiye') {
                payload.cashAmount = 0;
                payload.posAmount = 0;
            }

            await api.post('/Finance/sales', payload);
            setCart([]);
            setDiscountAmount('');
            setPriceSurcharge('');
            setPercentDiscountInput('');
            setPosCashInput('');
            setPosCardInput('');
            setTenderedCash('');
            setSelectedPosMemberId('');
            setPosMemberSearch('');
            setSaleNote('');

            const label = paymentMethod === 'Veresiye'
                ? 'Veresiye (Üye Cari Borcuna Eklendi)'
                : paymentMethod === 'Split'
                    ? `Parçalı (Nakit: ${cashVal} ₺ + POS: ${cardVal} ₺)`
                    : paymentMethod === 'POS' ? 'POS / Kart' : 'Nakit';
            showMessage(`Satış (${label}) başarıyla tamamlandı!`);
            await Promise.all([fetchProducts(), fetchRecentSales(), fetchDashboard(period), fetchTransactions(), fetchMembers()]);
        } catch (err) {
            showMessage(err.response?.data?.message || 'Satış kaydedilirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // TOPLU / AY BAŞI GELİR GİRİŞİ FONKSİYONLARI
    // ==========================================
    const addBulkIncomeRow = () => {
        setBulkIncomeList(prev => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                date: new Date().toISOString().split('T')[0],
                category: 'Spor Üyeliği',
                title: '',
                amount: '',
                paymentMethod: 'Cash',
                cashAmount: '',
                posAmount: '',
                description: ''
            }
        ]);
    };

    const removeBulkIncomeRow = (id) => {
        setBulkIncomeList(prev => {
            if (prev.length <= 1) {
                return [{
                    id: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    category: 'Spor Üyeliği',
                    title: '',
                    amount: '',
                    paymentMethod: 'Cash',
                    cashAmount: '',
                    posAmount: '',
                    description: ''
                }];
            }
            return prev.filter(r => r.id !== id);
        });
    };

    const updateBulkIncomeRow = (id, field, value) => {
        setBulkIncomeList(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            if (field === 'paymentMethod' && value === 'Split') {
                const totalAmt = parseFloat(updated.amount || 0);
                if (totalAmt > 0 && !updated.cashAmount && !updated.posAmount) {
                    const half = Math.round((totalAmt / 2) * 100) / 100;
                    updated.cashAmount = String(half);
                    updated.posAmount = String(Math.round((totalAmt - half) * 100) / 100);
                }
            }
            return updated;
        }));
    };

    const applyBulkPreset = (presetType) => {
        const todayStr = new Date().toISOString().split('T')[0];
        if (presetType === 'opening_package') {
            setBulkIncomeList([
                {
                    id: 1,
                    date: todayStr,
                    category: 'Spor Üyeliği',
                    title: 'Kasım Ay Başı Devreden Üyelik Gelirleri',
                    amount: '',
                    paymentMethod: 'Split',
                    cashAmount: '',
                    posAmount: '',
                    description: 'Eski üyelerden bu ayın başına devreden spor üyelikleri toplamı'
                },
                {
                    id: 2,
                    date: todayStr,
                    category: 'Açılış Kasası / Devir',
                    title: 'Ay Başı Açılış Nakit Kasa Bakiyesi',
                    amount: '',
                    paymentMethod: 'Cash',
                    cashAmount: '',
                    posAmount: '',
                    description: 'Kasada fiziki olarak devreden nakit açılış parası'
                },
                {
                    id: 3,
                    date: todayStr,
                    category: 'Açılış Kasası / Devir',
                    title: 'Ay Başı Banka / POS Hesap Bakiyesi',
                    amount: '',
                    paymentMethod: 'POS',
                    cashAmount: '',
                    posAmount: '',
                    description: 'Banka hesabında devreden POS / kart bakiyesi'
                }
            ]);
            showMessage('Kasım Ay Başı Açılış Şablonu yüklendi. Tutarları girip kaydedebilirsiniz.');
        } else if (presetType === 'membership_pool') {
            setBulkIncomeList([
                {
                    id: 1,
                    date: todayStr,
                    category: 'Spor Üyeliği',
                    title: 'Toplu Üyelik Tahsilatları [Nakit]',
                    amount: '',
                    paymentMethod: 'Cash',
                    cashAmount: '',
                    posAmount: '',
                    description: 'Eski ve güncel üyelerin nakit üyelik gelirleri toplamı'
                },
                {
                    id: 2,
                    date: todayStr,
                    category: 'Spor Üyeliği',
                    title: 'Toplu Üyelik Tahsilatları [Kredi Kartı / POS]',
                    amount: '',
                    paymentMethod: 'POS',
                    cashAmount: '',
                    posAmount: '',
                    description: 'Üyeliklerin kredi kartı ve POS çekim toplamı'
                }
            ]);
            showMessage('Toplu Spor Üyelik Devir Şablonu yüklendi.');
        } else if (presetType === 'eft_transfer') {
            setBulkIncomeList([
                {
                    id: 1,
                    date: todayStr,
                    category: 'Havale / EFT',
                    title: 'Banka Havale / EFT ile Gelen Gelirler',
                    amount: '',
                    paymentMethod: 'POS',
                    cashAmount: '',
                    posAmount: '',
                    description: 'Banka IBAN hesabına doğrudan gönderilen üyelik ve diğer gelirler'
                }
            ]);
            showMessage('Havale / EFT Şablonu yüklendi.');
        }
    };

    const handleSaveBulkIncome = async (e) => {
        e?.preventDefault();
        const validItems = bulkIncomeList.filter(item => {
            const amt = parseFloat(item.amount || 0);
            const cash = parseFloat(item.cashAmount || 0);
            const pos = parseFloat(item.posAmount || 0);
            return amt > 0 || cash > 0 || pos > 0;
        });

        if (validItems.length === 0) {
            showMessage('Lütfen en az bir satır için geçerli bir tutar girin!', 'error');
            return;
        }

        try {
            setBulkSaving(true);
            const payload = {
                batchNote: bulkBatchNote || 'Toplu Gelir Girişi',
                items: validItems.map(item => ({
                    title: item.title?.trim() || `${item.category} Geliri`,
                    category: item.category || 'Spor Üyeliği',
                    amount: parseFloat(item.amount || 0),
                    paymentMethod: item.paymentMethod || 'Cash',
                    cashAmount: item.paymentMethod === 'Split' ? parseFloat(item.cashAmount || 0) : null,
                    posAmount: item.paymentMethod === 'Split' ? parseFloat(item.posAmount || 0) : null,
                    transactionDate: item.date ? `${item.date}T12:00:00` : new Date().toISOString(),
                    description: item.description?.trim() || null
                }))
            };

            await api.post('/Finance/bulk-income', payload);
            showMessage(`${validItems.length} adet gelir kalemi başarıyla kasaya ve raporlara işlendi!`);
            setBulkBatchNote('');
            setBulkIncomeList([{
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                category: 'Spor Üyeliği',
                title: '',
                amount: '',
                paymentMethod: 'Cash',
                cashAmount: '',
                posAmount: '',
                description: ''
            }]);
            await refreshAll();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Toplu gelir kaydedilirken hata oluştu.', 'error');
        } finally {
            setBulkSaving(false);
        }
    };

    const handleDeleteTransaction = async (id) => {
        if (!window.confirm('Bu kasa hareketini silmek istediğinize emin misiniz? İlgili tutar kasadan düşülecektir.')) return;
        try {
            await api.delete(`/Finance/transactions/${id}`);
            showMessage('Kasa hareketi başarıyla silindi.');
            await refreshAll();
        } catch (err) {
            showMessage('Kasa hareketi silinirken hata oluştu.', 'error');
        }
    };

    const handleDeleteSale = async (saleId) => {
        if (!window.confirm('Bu satış fişini iptal etmek istediğinize emin misiniz? Ürün stokları geri iade edilecek ve tutar kasadan düşülecektir.')) return;
        try {
            await api.delete(`/Finance/sales/${saleId}`);
            showMessage('Satış iptal edildi ve stoklar geri yüklendi.');
            await refreshAll();
        } catch (err) {
            showMessage('Satış silinirken hata oluştu.', 'error');
        }
    };

    // ==========================================
    // ÜRÜN YÖNETİMİ FONKSİYONLARI
    // ==========================================
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!productForm.name.trim()) {
            showMessage('Lütfen ürün adını girin.', 'error');
            return;
        }
        try {
            const payload = {
                name: productForm.name.trim(),
                category: productForm.category,
                barcode: productForm.barcode || '',
                buyingPrice: parseFloat(productForm.buyingPrice || 0),
                sellingPrice: parseFloat(productForm.sellingPrice || 0),
                stockQuantity: parseInt(productForm.stockQuantity || 0, 10),
                minStockAlert: parseInt(productForm.minStockAlert || 5, 10),
                isActive: productForm.isActive
            };

            if (editingProduct) {
                await api.put(`/Finance/products/${editingProduct.id}`, payload);
                showMessage('Ürün başarıyla güncellendi.');
            } else {
                await api.post('/Finance/products', payload);
                showMessage('Yeni ürün envantere eklendi.');
            }

            setEditingProduct(null);
            setProductForm({ name: '', category: 'İçecek', barcode: '', buyingPrice: '', sellingPrice: '', stockQuantity: '', minStockAlert: '5', isActive: true });
            await Promise.all([fetchProducts(), fetchDashboard(period)]);
        } catch (err) {
            showMessage(err.response?.data?.message || 'Ürün kaydedilemedi.', 'error');
        }
    };

    const handleEditProductClick = (p) => {
        setEditingProduct(p);
        setProductForm({
            name: p.name,
            category: p.category || 'İçecek',
            barcode: p.barcode || '',
            buyingPrice: String(p.buyingPrice ?? 0),
            sellingPrice: String(p.sellingPrice ?? 0),
            stockQuantity: String(p.stockQuantity ?? 0),
            minStockAlert: String(p.minStockAlert ?? 5),
            isActive: p.isActive !== false
        });
    };

    const handleQuickStockAdd = async (p, addQty) => {
        try {
            await api.put(`/Finance/products/${p.id}`, {
                name: p.name,
                category: p.category,
                barcode: p.barcode,
                buyingPrice: p.buyingPrice,
                sellingPrice: p.sellingPrice,
                stockQuantity: Math.max(0, (p.stockQuantity || 0) + addQty),
                minStockAlert: p.minStockAlert,
                isActive: p.isActive
            });
            showMessage(`${p.name} stoğu güncellendi (${addQty > 0 ? '+' : ''}${addQty}).`);
            await Promise.all([fetchProducts(), fetchDashboard(period)]);
        } catch (err) {
            showMessage('Stok güncellenemedi.', 'error');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/Finance/products/${id}`);
            showMessage('Ürün silindi.');
            await Promise.all([fetchProducts(), fetchDashboard(period)]);
        } catch (err) {
            showMessage('Ürün silinemedi.', 'error');
        }
    };

    // ==========================================
    // GİDER YÖNETİMİ FONKSİYONLARI
    // ==========================================
    const handleSaveExpense = async (e) => {
        e.preventDefault();
        if (!expenseForm.title.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
            showMessage('Lütfen geçerli bir gider başlığı ve tutar girin.', 'error');
            return;
        }
        try {
            await api.post('/Finance/expenses', {
                title: expenseForm.title.trim(),
                category: expenseForm.category,
                amount: parseFloat(expenseForm.amount),
                paymentMethod: expenseForm.paymentMethod,
                expenseDate: expenseForm.expenseDate || new Date().toISOString(),
                description: expenseForm.description?.trim() || '',
                linkedProductId: expenseForm.linkedProductId ? parseInt(expenseForm.linkedProductId, 10) : null,
                AddedStockQuantity: expenseForm.addedStockQuantity ? parseInt(expenseForm.addedStockQuantity, 10) : null
            });
            showMessage('Gider başarıyla kaydedildi ve kasadan düşüldü.');
            setExpenseForm({
                title: '', category: 'Kira', amount: '', paymentMethod: 'Cash',
                expenseDate: new Date().toISOString().split('T')[0],
                description: '', linkedProductId: '', addedStockQuantity: ''
            });
            await refreshAll();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Gider kaydedilemedi.', 'error');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/Finance/expenses/${id}`);
            showMessage('Gider kaydı silindi.');
            await refreshAll();
        } catch (err) {
            showMessage('Gider silinemedi.', 'error');
        }
    };

    // ==========================================
    // ÜYELİK GELİR ONAYI FONKSİYONLARI
    // ==========================================
    const getApprovalTotal = (item) => {
        return customApprovalAmounts[item.id] !== undefined
            ? Math.max(0, parseFloat(customApprovalAmounts[item.id] || 0))
            : Number(item.amount || 0);
    };

    const handleApprovalCashChange = (item, val) => {
        const total = getApprovalTotal(item);
        if (val === '') {
            setApprovalSplits(prev => ({ ...prev, [item.id]: { cash: '', pos: '' } }));
            return;
        }
        const cashVal = Math.max(0, parseFloat(val || 0));
        const remaining = Math.max(0, Math.round((total - cashVal) * 100) / 100);
        setApprovalSplits(prev => ({
            ...prev,
            [item.id]: { cash: val, pos: String(remaining) }
        }));
    };

    const handleApprovalPosChange = (item, val) => {
        const total = getApprovalTotal(item);
        if (val === '') {
            setApprovalSplits(prev => ({ ...prev, [item.id]: { cash: '', pos: '' } }));
            return;
        }
        const posVal = Math.max(0, parseFloat(val || 0));
        const remaining = Math.max(0, Math.round((total - posVal) * 100) / 100);
        setApprovalSplits(prev => ({
            ...prev,
            [item.id]: { cash: String(remaining), pos: val }
        }));
    };

    const handleApprovalHalfSplit = (item) => {
        const total = getApprovalTotal(item);
        const half = Math.round((total / 2) * 100) / 100;
        const rest = Math.round((total - half) * 100) / 100;
        setApprovalSplits(prev => ({
            ...prev,
            [item.id]: { cash: String(half), pos: String(rest) }
        }));
    };

    const handleApproveMembership = async (item, paymentMethod) => {
        try {
            const overrideAmt = getApprovalTotal(item);
            const split = approvalSplits[item.id] || { cash: '', pos: '' };
            const cashVal = Math.max(0, parseFloat(split.cash || 0));
            const posVal = Math.max(0, parseFloat(split.pos || 0));

            let payload = {
                paymentMethod,
                amount: overrideAmt
            };

            if (paymentMethod === 'Split') {
                if (cashVal <= 0 && posVal <= 0) {
                    showMessage('Parçalı onay için Nakit veya POS kutularına tutar girin.', 'error');
                    return;
                }
                payload.cashAmount = cashVal;
                payload.posAmount = posVal;
                payload.amount = cashVal + posVal;
                payload.note = `Parçalı (${cashVal} ₺ Nakit + ${posVal} ₺ POS) olarak onaylandı`;
            } else if (paymentMethod === 'Cash') {
                payload.cashAmount = overrideAmt;
                payload.posAmount = 0;
                payload.note = 'Tamamı Nakit olarak onaylandı';
            } else if (paymentMethod === 'POS') {
                payload.cashAmount = 0;
                payload.posAmount = overrideAmt;
                payload.note = 'Tamamı POS / Kredi Kartı olarak onaylandı';
            }

            await api.post(`/Finance/pending-memberships/${item.id}/approve`, payload);
            const label = paymentMethod === 'Split'
                ? `Parçalı (Nakit: ${cashVal} ₺ + POS: ${posVal} ₺)`
                : paymentMethod === 'POS' ? 'POS' : 'Nakit';
            showMessage(`${item.memberFullName} üyelik ödemesi (${label}) kasaya işlendi!`);
            await refreshAll();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Onaylama sırasında hata oluştu.', 'error');
        }
    };

    const handleRejectMembership = async (item) => {
        if (!window.confirm(`${item.memberFullName} adlı üyenin bu tahsilat kaydını iptal/reddetmek istediğinize emin misiniz?`)) return;
        try {
            await api.post(`/Finance/pending-memberships/${item.id}/reject`);
            showMessage('Tahsilat kaydı reddedildi / geri çekildi.');
            await refreshAll();
        } catch (err) {
            showMessage('İşlem başarısız.', 'error');
        }
    };

    // ==========================================
    // KASA VİRMAN & GÜN SONU Z-RAPORU FONKSİYONLARI
    // ==========================================
    const handleCreateTransfer = async (e) => {
        e.preventDefault();
        if (!transferForm.amount || Number(transferForm.amount) <= 0) {
            showMessage('Lütfen geçerli bir transfer tutarı girin.', 'error');
            return;
        }
        try {
            setLoading(true);
            await api.post('/Finance/transfers', {
                transferType: transferForm.transferType,
                amount: parseFloat(transferForm.amount),
                note: transferForm.note?.trim() || ''
            });
            showMessage('Kasa virman / transfer işlemi başarıyla uygulandı.');
            setTransferForm({ transferType: 'CashToPos', amount: '', note: '' });
            await refreshAll();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Transfer işlemi başarısız.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateZReport = async (e) => {
        e.preventDefault();
        if (zReportForm.countedCash === '' || Number(zReportForm.countedCash) < 0) {
            showMessage('Lütfen çekmecede sayılan fiziki nakit tutarını girin.', 'error');
            return;
        }
        try {
            setLoading(true);
            await api.post('/Finance/z-report', {
                countedCash: parseFloat(zReportForm.countedCash || 0),
                handedOverCash: parseFloat(zReportForm.handedOverCash || 0),
                autoAdjustDiscrepancy: zReportForm.autoAdjustDiscrepancy,
                note: zReportForm.note?.trim() || ''
            });
            showMessage('Gün Sonu Z-Raporu kaydedildi ve kasa devri tamamlandı!');
            setZReportForm({ countedCash: '', handedOverCash: '', autoAdjustDiscrepancy: true, note: '' });
            await refreshAll();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Z-Raporu kaydedilemedi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // KASA DEFTERİ DIŞA AKTARIM (CSV)
    // ==========================================
    const exportLedgerToCSV = () => {
        if (!filteredTransactions.length) {
            showMessage('Dışa aktarılacak kayıt bulunamadı.', 'error');
            return;
        }
        const headers = ['Tarih', 'Tür', 'Kategori', 'Başlık', 'Ödeme Yöntemi', 'Brüt Tutar (TL)', 'POS KDV (%20)', 'Net Kâr / Tutar (TL)', 'Açıklama'];
        const rows = filteredTransactions.map(t => {
            const isInc = t.transactionType === 'Income' || t.transactionType === 'TransferIn';
            const isPos = String(t.paymentMethod).toUpperCase() === 'POS';
            const isMem = (t.source === 'Membership') || (t.category && (t.category.includes('Üyelik') || t.category.includes('Spor')));
            const isPosMem = isInc && isPos && isMem;
            const vatAmt = isPosMem ? Math.round(Number(t.amount || 0) * 0.20 * 100) / 100 : 0;
            const netAmt = isInc ? (Number(t.amount || 0) - vatAmt) : -Number(t.amount || 0);

            return [
                formatDate(t.transactionDate),
                t.transactionType === 'Income' ? 'GELİR' : t.transactionType === 'Expense' ? 'GİDER' : t.transactionType,
                `"${(t.category || '').replace(/"/g, '""')}"`,
                `"${(t.title || '').replace(/"/g, '""')}"`,
                t.paymentMethod === 'POS' ? 'POS / Kart' : 'Nakit',
                (isInc ? '' : '-') + Number(t.amount).toFixed(2),
                vatAmt > 0 ? `-${vatAmt.toFixed(2)}` : '0.00',
                netAmt.toFixed(2),
                `"${(t.description || '').replace(/"/g, '""')}"`
            ];
        });
        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `N1FIT_Kasa_Raporu_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Filtered lists (Türkçe karakter ve büyük/küçük harf tam uyumlu)
    const filteredPosProducts = useMemo(() => {
        const searchTokens = normalizeTurkishSearch(posSearch).split(' ').filter(Boolean);
        return products.filter(p => {
            if (!p.isActive) return false;
            const matchCat = posCategory === 'Tümü' || p.category === posCategory;
            const target = normalizeTurkishSearch(`${p.name} ${p.category}`);
            const matchSearch = searchTokens.length === 0 || searchTokens.every(tok => target.includes(tok));
            return matchCat && matchSearch;
        });
    }, [products, posCategory, posSearch]);

    const filteredPosMembers = useMemo(() => {
        const searchTokens = normalizeTurkishSearch(posMemberSearch).split(' ').filter(Boolean);
        if (searchTokens.length === 0) return membersList.slice(0, 25);
        return membersList.filter(m => {
            const full = m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim();
            const target = normalizeTurkishSearch(`${full} ${m.phoneNumber || ''} ${m.email || ''}`);
            return searchTokens.every(tok => target.includes(tok));
        }).slice(0, 25);
    }, [membersList, posMemberSearch]);

    const selectedPosMember = useMemo(() => {
        if (!selectedPosMemberId) return null;
        return membersList.find(m => String(m.id) === String(selectedPosMemberId)) || null;
    }, [membersList, selectedPosMemberId]);

    const filteredApprovals = useMemo(() => {
        if (approvalFilter === 'All') return pendingPayments;
        return pendingPayments.filter(p => p.status === approvalFilter);
    }, [pendingPayments, approvalFilter]);

    const filteredTransactions = useMemo(() => {
        const searchTokens = normalizeTurkishSearch(txSearch).split(' ').filter(Boolean);
        const todayStr = new Date().toISOString().split('T')[0];

        return transactions.filter(t => {
            const matchType = txTypeFilter === 'All' || t.transactionType === txTypeFilter;
            const matchMethod = txMethodFilter === 'All' || t.paymentMethod === txMethodFilter;

            // Tarih Filtresi
            let matchDate = true;
            if (t.transactionDate) {
                const tDateStr = t.transactionDate.split('T')[0];

                if (txDateRangeMode === 'today') {
                    matchDate = tDateStr === todayStr;
                } else if (txDateRangeMode === 'yesterday') {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    const yStr = y.toISOString().split('T')[0];
                    matchDate = tDateStr === yStr;
                } else if (txDateRangeMode === '7d') {
                    const d7 = new Date();
                    d7.setDate(d7.getDate() - 6);
                    const d7Str = d7.toISOString().split('T')[0];
                    matchDate = tDateStr >= d7Str && tDateStr <= todayStr;
                } else if (txDateRangeMode === 'this_month') {
                    const mStart = new Date();
                    mStart.setDate(1);
                    const mStartStr = mStart.toISOString().split('T')[0];
                    matchDate = tDateStr >= mStartStr;
                } else if (txDateRangeMode === 'last_month') {
                    const d = new Date();
                    const lmStart = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
                    const lmEnd = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
                    matchDate = tDateStr >= lmStart && tDateStr <= lmEnd;
                } else if (txDateRangeMode === 'single_date') {
                    if (txCustomDate) matchDate = tDateStr === txCustomDate;
                } else if (txDateRangeMode === 'custom') {
                    if (txStartDate && tDateStr < txStartDate) matchDate = false;
                    if (txEndDate && tDateStr > txEndDate) matchDate = false;
                }
            }

            const target = normalizeTurkishSearch(`${t.title || ''} ${t.category || ''} ${t.description || ''}`);
            const matchSearch = searchTokens.length === 0 || searchTokens.every(tok => target.includes(tok));
            return matchType && matchMethod && matchSearch && matchDate;
        });
    }, [transactions, txTypeFilter, txMethodFilter, txSearch, txDateRangeMode, txCustomDate, txStartDate, txEndDate]);

    // Seçili tarihe / filtrelere özel anlık özet istatistikleri
    const ledgerStats = useMemo(() => {
        let totalInc = 0;
        let totalExp = 0;
        let posGross = 0;
        let posVat = 0;

        filteredTransactions.forEach(t => {
            const isInc = t.transactionType === 'Income' || t.transactionType === 'TransferIn';
            const isExp = t.transactionType === 'Expense' || t.transactionType === 'TransferOut';
            if (isInc) {
                totalInc += Number(t.amount || 0);
                const isPos = String(t.paymentMethod).toUpperCase() === 'POS';
                const isMem = (t.source === 'Membership') ||
                    (t.category && (t.category.includes('Üyelik') || t.category.includes('Spor')));
                if (isPos && isMem) {
                    const amt = Number(t.amount || 0);
                    posGross += amt;
                    posVat += Math.round(amt * 0.20 * 100) / 100;
                }
            } else if (isExp) {
                totalExp += Number(t.amount || 0);
            }
        });

        return {
            totalIncome: totalInc,
            totalExpense: totalExp,
            posGross,
            posVat,
            netProfit: totalInc - totalExp - posVat,
            count: filteredTransactions.length
        };
    }, [filteredTransactions]);

    const pendingCount = useMemo(() => pendingPayments.filter(p => p.status === 'Pending').length, [pendingPayments]);
    const lowStockProducts = useMemo(() => products.filter(p => p.isActive && p.stockQuantity <= p.minStockAlert), [products]);

    const PIE_COLORS = [
        '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
        '#14b8a6', '#eab308', '#a855f7', '#fb7185', '#38bdf8'
    ];

    const renderPieChart = (slices, centerTopText, centerBottomText) => {
        if (!slices || slices.length === 0) {
            return <div style={styles.emptyText}>Pasta grafiği için bu dönemde henüz veri bulunmuyor.</div>;
        }
        const radius = 72;
        const circumference = 2 * Math.PI * radius;
        let cumulativePercent = 0;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', padding: '10px 0' }}>
                <div style={{ position: 'relative', width: '190px', height: '190px', flexShrink: 0 }}>
                    <svg width="190" height="190" viewBox="0 0 190 190" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="95" cy="95" r={radius} fill="transparent" stroke="#1f1f1f" strokeWidth="26" />
                        {slices.map((s, idx) => {
                            const pct = Math.max(0, Math.min(100, Number(s.percentage || 0)));
                            const strokeLength = (pct / 100) * circumference;
                            const strokeOffset = -((cumulativePercent / 100) * circumference);
                            cumulativePercent += pct;
                            const color = PIE_COLORS[idx % PIE_COLORS.length];
                            return (
                                <circle
                                    key={idx}
                                    cx="95"
                                    cy="95"
                                    r={radius}
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="26"
                                    strokeDasharray={`${strokeLength} ${circumference}`}
                                    strokeDashoffset={strokeOffset}
                                >
                                    <title>{`${s.label}: %${pct} (${s.subLabel})`}</title>
                                </circle>
                            );
                        })}
                    </svg>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        padding: '28px'
                    }}>
                        <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: '700' }}>{centerTopText}</span>
                        <span style={{ fontSize: '1.02rem', color: '#fff', fontWeight: '900', marginTop: '2px' }}>{centerBottomText}</span>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '220px', overflowY: 'auto' }}>
                    {slices.map((s, idx) => {
                        const color = PIE_COLORS[idx % PIE_COLORS.length];
                        return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '5px 8px', backgroundColor: '#161616', borderRadius: '6px', border: '1px solid #242424' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                    <span style={{ width: '11px', height: '11px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
                                    <span style={{ color: '#e5e7eb', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{s.subLabel}</span>
                                    <span style={{ color, fontWeight: '900', minWidth: '42px', textAlign: 'right' }}>%{s.percentage}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Chart scaling helper
    const maxTrendValue = useMemo(() => {
        if (!dashboard.dailyTrend || !dashboard.dailyTrend.length) return 1000;
        const maxVal = Math.max(...dashboard.dailyTrend.map(d => Math.max(d.income || 0, d.expense || 0)));
        return maxVal > 0 ? maxVal : 1000;
    }, [dashboard.dailyTrend]);

    return (
        <div style={styles.page}>
            {/* Bildirim Toast */}
            {toast && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: toast.type === 'error' ? '#991b1b' : '#065f46',
                    borderColor: toast.type === 'error' ? '#ef4444' : '#10b981'
                }}>
                    {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Üst Bar */}
            <div style={styles.topHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                        <ArrowLeft size={18} /> Üye Paneline Dön
                    </button>
                    <div>
                        <h1 style={styles.pageTitle}>
                            <Wallet size={24} color="#d90429" /> N1FIT FİNANS, SATIŞ & KASA MERKEZİ
                        </h1>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                            Hızlı POS Satışı, Stok Envanteri, Dükkan Giderleri, Üyelik Gelir Onayı ve Kasa Analitiği
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {pendingCount > 0 && (
                        <button onClick={() => setActiveTab('approvals')} style={styles.alertBadgePending}>
                            <Clock size={16} /> {pendingCount} Bekleyen Üyelik Tahsilatı ({formatCurrency(dashboard.pendingApprovalsAmount)})
                        </button>
                    )}
                    {lowStockProducts.length > 0 && (
                        <button onClick={() => setActiveTab('products')} style={styles.alertBadgeStock}>
                            <AlertTriangle size={16} /> {lowStockProducts.length} Kritik Stok
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('cashops')}
                        style={{
                            ...styles.refreshBtn,
                            backgroundColor: 'rgba(139, 92, 246, 0.16)',
                            borderColor: '#8b5cf6',
                            color: '#c4b5fd'
                        }}
                    >
                        <Layers size={16} /> Kasa Virman & Gün Sonu (Z)
                    </button>
                    <button onClick={refreshAll} style={styles.refreshBtn} title="Verileri Yenile">
                        <RefreshCw size={16} /> Yenile
                    </button>
                </div>
            </div>

            {/* KRİTİK STOK ÜST BİLDİRİM BANDI */}
            {lowStockProducts.length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(127, 29, 29, 0.35)',
                    border: '1px solid #ef4444',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <AlertTriangle size={20} color="#f87171" />
                        <span style={{ fontWeight: '900', color: '#fca5a5', fontSize: '0.88rem' }}>
                            ⚠️ KRİTİK STOK UYARISI ({lowStockProducts.length} Ürün Azaldı / Bitti):
                        </span>
                        <span style={{ color: '#fde68a', fontSize: '0.84rem', fontWeight: '700' }}>
                            {lowStockProducts.map(p => `${p.name} (${p.stockQuantity} Adet kaldı)`).join(' • ')}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setActiveTab('products')}
                            style={{ ...styles.stockQuickBtn, borderColor: '#f59e0b', color: '#fcd34d', padding: '6px 12px' }}
                        >
                            📦 Hızlı Stok Ekle
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            style={{ ...styles.stockQuickBtn, borderColor: '#10b981', color: '#6ee7b7', padding: '6px 12px' }}
                        >
                            🚚 Toptan Alış Gir
                        </button>
                    </div>
                </div>
            )}

            {/* Ana Sekmeler (8 Sekme) */}
            <div style={styles.tabContainer}>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    style={activeTab === 'dashboard' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <BarChart3 size={17} /> Finansal Özet & Grafikler
                </button>
                <button
                    onClick={() => setActiveTab('pos')}
                    style={activeTab === 'pos' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <ShoppingCart size={17} /> Hızlı Satış (POS)
                </button>
                <button
                    onClick={() => setActiveTab('bulk_income')}
                    style={activeTab === 'bulk_income' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <DownloadCloud size={17} /> Toplu Gelir Girişi
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    style={activeTab === 'products' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <Package size={17} /> Ürün & Stok ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    style={activeTab === 'expenses' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <TrendingDown size={17} /> Giderler & Alışlar
                </button>
                <button
                    onClick={() => setActiveTab('approvals')}
                    style={activeTab === 'approvals' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <CheckCircle2 size={17} /> Üyelik Gelir Onayı
                    {pendingCount > 0 && <span style={styles.badgeCount}>{pendingCount}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('cashops')}
                    style={activeTab === 'cashops' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <Layers size={17} /> Kasa Virman & Z-Raporu
                </button>
                <button
                    onClick={() => setActiveTab('ledger')}
                    style={activeTab === 'ledger' ? styles.activeTabBtn : styles.tabBtn}
                >
                    <Receipt size={17} /> Kasa Defteri
                </button>
            </div>

            {/* ========================================================= */}
            {/* SEKME 1: FİNANSAL ÖZET & GRAFİKLER                        */}
            {/* ========================================================= */}
            {activeTab === 'dashboard' && (
                <div>
                    {/* Zaman Aralığı Seçici & Hızlı Toplu Gelir Butonu */}
                    <div style={{ ...styles.filterBar, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: '700', marginRight: '4px' }}>
                                <Calendar size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                DÖNEM SEÇİMİ:
                            </span>
                            {[
                                { id: 'today', label: 'Bugün (1 Gün)' },
                                { id: '7d', label: 'Son 7 Gün' },
                                { id: '15d', label: 'Son 15 Gün' },
                                { id: 'this_month', label: 'Bu Ay' },
                                { id: 'last_month', label: 'Geçen Ay' },
                                { id: 'this_year', label: 'Bu Yıl (1 Yıl)' },
                                { id: 'custom', label: 'Özel Tarih' }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePeriodChange(p.id)}
                                    style={period === p.id ? styles.periodBtnActive : styles.periodBtn}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setActiveTab('bulk_income')}
                            style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981',
                                color: '#10b981',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontWeight: '800',
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px'
                            }}
                            title="Ay başı açılış gelirlerini ve devreden üyelikleri topluca girin"
                        >
                            <DownloadCloud size={16} /> + Toplu / Ay Başı Gelir Girişi
                        </button>

                        {period === 'custom' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={e => setCustomStart(e.target.value)}
                                    style={styles.input}
                                />
                                <span style={{ color: '#888' }}>-</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={e => setCustomEnd(e.target.value)}
                                    style={styles.input}
                                />
                                <button onClick={() => fetchDashboard('custom')} style={styles.primaryBtn}>
                                    Filtrele
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 6 Ana KPI Kartı (Ciro, POS %20 KDV, Gider, Net Kâr ve Kasa Bakiyeleri) */}
                    <div style={styles.kpiGrid}>
                        {/* 1. TOPLAM CİRO */}
                        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #10b981' }}>
                            <div style={styles.kpiHeader}>
                                <span style={styles.kpiLabel}>TOPLAM CİRO (BRÜT)</span>
                                <TrendingUp size={20} color="#10b981" />
                            </div>
                            <div style={{ ...styles.kpiValue, color: '#10b981' }}>
                                {formatCurrency(dashboard.totalIncome)}
                            </div>
                            <div style={styles.kpiSub}>
                                Üyelik (Brüt): <b>{formatCurrency(dashboard.membershipIncome)}</b> | Mağaza: <b>{formatCurrency(dashboard.storeSaleIncome)}</b>
                            </div>
                        </div>

                        {/* 2. POS ÜYELİK %20 KDV KESİNTİSİ */}
                        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #f59e0b' }}>
                            <div style={styles.kpiHeader}>
                                <span style={styles.kpiLabel}>POS ÜYELİK KDV (%20)</span>
                                <Percent size={20} color="#f59e0b" />
                            </div>
                            <div style={{ ...styles.kpiValue, color: '#f59e0b' }}>
                                -{formatCurrency(dashboard.posMembershipVatDeduction || 0)}
                            </div>
                            <div style={styles.kpiSub}>
                                POS Brüt: <b>{formatCurrency(dashboard.posMembershipGrossIncome || 0)}</b> ➔ Net: <b style={{ color: '#10b981' }}>{formatCurrency(dashboard.posMembershipNetIncome || 0)}</b>
                            </div>
                        </div>

                        {/* 3. TOPLAM GİDER */}
                        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #ef4444' }}>
                            <div style={styles.kpiHeader}>
                                <span style={styles.kpiLabel}>TOPLAM GİDER</span>
                                <TrendingDown size={20} color="#ef4444" />
                            </div>
                            <div style={{ ...styles.kpiValue, color: '#ef4444' }}>
                                {formatCurrency(dashboard.totalExpense)}
                            </div>
                            <div style={styles.kpiSub}>
                                Nakit Çıkış: <b>{formatCurrency(dashboard.cashExpense)}</b> | Banka/POS: <b>{formatCurrency(dashboard.posExpense)}</b>
                            </div>
                        </div>

                        {/* 4. NET KÂR (CİRO - GİDERLER - POS %20 KDV) */}
                        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #38bdf8' }}>
                            <div style={styles.kpiHeader}>
                                <span style={styles.kpiLabel}>NET KÂR (GERÇEK KAZANÇ)</span>
                                <DollarSign size={20} color="#38bdf8" />
                            </div>
                            <div style={{
                                ...styles.kpiValue,
                                color: dashboard.netProfit >= 0 ? '#38bdf8' : '#ef4444'
                            }}>
                                {formatCurrency(dashboard.netProfit)}
                            </div>
                            <div style={styles.kpiSub}>
                                Ciro - Giderler - POS %20 KDV | Ürün Kârı: <b style={{ color: '#10b981' }}>{formatCurrency(dashboard.storeSaleGrossProfit)}</b>
                            </div>
                        </div>

                        {/* 5. FİZİKİ NAKİT KASA */}
                        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #22c55e' }}>
                            <div style={styles.kpiHeader}>
                                <span style={styles.kpiLabel}>💵 FİZİKİ NAKİT KASA</span>
                                <Banknote size={20} color="#22c55e" />
                            </div>
                            <div style={{ ...styles.kpiValue, color: '#22c55e' }}>
                                {formatCurrency(dashboard.cashBalance)}
                            </div>
                            <div style={styles.kpiSub}>
                                Giriş: +{formatCurrency(dashboard.cashIncome)} | Çıkış: -{formatCurrency(dashboard.cashExpense)}
                            </div>
                        </div>

                        {/* 6. POS / BANKA KASASI */}
                        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #3b82f6' }}>
                            <div style={styles.kpiHeader}>
                                <span style={styles.kpiLabel}>💳 POS / BANKA KASASI</span>
                                <CreditCard size={20} color="#3b82f6" />
                            </div>
                            <div style={{ ...styles.kpiValue, color: '#3b82f6' }}>
                                {formatCurrency(dashboard.posBalance)}
                            </div>
                            <div style={styles.kpiSub}>
                                POS Çekim: +{formatCurrency(dashboard.posIncome)} | Banka Gider: -{formatCurrency(dashboard.posExpense)}
                            </div>
                        </div>
                    </div>

                    {/* Zaman Serisi Trend Grafiği (Gelir vs Gider) */}
                    <div style={{ ...styles.card, marginTop: '20px' }}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>
                                <BarChart3 size={18} color="#d90429" /> Dönemsel Gelir & Gider Grafiği ({dashboard.startDate} — {dashboard.endDate})
                            </h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                                    <span style={{ width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 3, display: 'inline-block' }} /> Gelir
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                                    <span style={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: 3, display: 'inline-block' }} /> Gider
                                </span>
                            </div>
                        </div>

                        {dashboard.dailyTrend && dashboard.dailyTrend.length > 0 ? (
                            <div style={styles.chartScrollWrapper}>
                                <div style={styles.barChartContainer}>
                                    {dashboard.dailyTrend.map((pt, idx) => {
                                        const incHeight = Math.max(4, Math.round(((pt.income || 0) / maxTrendValue) * 170));
                                        const expHeight = Math.max(4, Math.round(((pt.expense || 0) / maxTrendValue) * 170));
                                        return (
                                            <div key={idx} style={styles.barColumn} title={`${pt.label}\nGelir: ${formatCurrency(pt.income)}\nGider: ${formatCurrency(pt.expense)}\nNet: ${formatCurrency(pt.net)}`}>
                                                <div style={styles.barsArea}>
                                                    <div style={{
                                                        width: '14px',
                                                        height: `${pt.income > 0 ? incHeight : 3}px`,
                                                        backgroundColor: pt.income > 0 ? '#10b981' : '#222',
                                                        borderRadius: '4px 4px 0 0',
                                                        transition: 'height 0.3s ease'
                                                    }} />
                                                    <div style={{
                                                        width: '14px',
                                                        height: `${pt.expense > 0 ? expHeight : 3}px`,
                                                        backgroundColor: pt.expense > 0 ? '#ef4444' : '#222',
                                                        borderRadius: '4px 4px 0 0',
                                                        transition: 'height 0.3s ease'
                                                    }} />
                                                </div>
                                                <div style={styles.barLabel}>{pt.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={styles.emptyText}>Seçilen dönemde grafik verisi bulunmuyor.</div>
                        )}
                    </div>

                    {/* ========================================================= */}
                    {/* SATILAN BÜTÜN ÜRÜNLERİN RAĞBET TAKİBİ & PASTA GRAFİĞİ     */}
                    {/* ========================================================= */}
                    <div style={{ ...styles.card, marginTop: '20px', border: '1px solid #333' }}>
                        <div style={styles.cardHeader}>
                            <div>
                                <h3 style={styles.cardTitle}>
                                    <PieChart size={20} color="#f59e0b" /> Ürünlerin Rağbet Takibi & Satılan Bütün Ürünlerin Pasta Grafiği
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px' }}>
                                    Seçili dönemde hangi ürünün kaç adet satıldığını, toplam satış içindeki rağbet oranını (%) ve getirdiği net kârı gösterir.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setDemandChartMode('quantity')}
                                    style={demandChartMode === 'quantity' ? styles.periodBtnActive : styles.periodBtn}
                                >
                                    📊 Adet Bazlı Rağbet (%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDemandChartMode('revenue')}
                                    style={demandChartMode === 'revenue' ? styles.periodBtnActive : styles.periodBtn}
                                >
                                    💰 Ciro Payı (%)
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
                            {/* Sol: Satılan Bütün Ürünlerin Pasta Grafiği */}
                            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #242424', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fcd34d', marginBottom: '8px' }}>
                                    🥧 SATILAN BÜTÜN ÜRÜNLERİN PASTA GRAFİĞİ ({demandChartMode === 'quantity' ? 'Satış Adedine Göre' : 'Ciro Payına Göre'})
                                </div>
                                {renderPieChart(
                                    (dashboard.topSellingProducts || []).map(p => ({
                                        label: p.productName,
                                        subLabel: demandChartMode === 'quantity' ? `${p.totalQuantity} Adet` : formatCurrency(p.totalRevenue),
                                        percentage: demandChartMode === 'quantity' ? p.quantityPercentage : p.revenuePercentage
                                    })),
                                    demandChartMode === 'quantity' ? 'TOPLAM SATILAN' : 'TOPLAM CİRO',
                                    demandChartMode === 'quantity'
                                        ? `${dashboard.totalSoldProductUnits || 0} Adet`
                                        : formatCurrency((dashboard.topSellingProducts || []).reduce((s, x) => s + (x.totalRevenue || 0), 0))
                                )}
                            </div>

                            {/* Sağ: Tüm Ürünlerin Rağbet Sıralaması Tablosu (Hiç satılmayanlar dahil) */}
                            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #242424', borderRadius: '10px', padding: '16px', maxHeight: '320px', overflowY: 'auto' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10b981', marginBottom: '10px' }}>
                                    📈 TÜM ÜRÜNLERİN RAĞBET & SATIŞ TABLOSU
                                </div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>#</th>
                                            <th style={styles.th}>Ürün Adı</th>
                                            <th style={styles.th}>Satılan</th>
                                            <th style={styles.th}>Rağbet Oranı</th>
                                            <th style={styles.th}>Ciro</th>
                                            <th style={styles.th}>Net Kâr</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((dashboard.allProductsDemand && dashboard.allProductsDemand.length > 0)
                                            ? dashboard.allProductsDemand
                                            : (dashboard.topSellingProducts || [])
                                        ).map((prod, idx) => {
                                            const pct = demandChartMode === 'quantity' ? (prod.quantityPercentage || 0) : (prod.revenuePercentage || 0);
                                            const color = prod.totalQuantity > 0 ? PIE_COLORS[idx % PIE_COLORS.length] : '#555';
                                            return (
                                                <tr key={idx} style={styles.tr}>
                                                    <td style={{ ...styles.td, color: '#888', fontWeight: '800' }}>{idx + 1}</td>
                                                    <td style={styles.td}>
                                                        <div style={{ fontWeight: '700', color: prod.totalQuantity > 0 ? '#fff' : '#777' }}>{prod.productName}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>Stok: {prod.currentStock ?? '-'}</div>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '900', color: prod.totalQuantity > 0 ? '#fcd34d' : '#666' }}>
                                                        {prod.totalQuantity} Adet
                                                    </td>
                                                    <td style={{ ...styles.td, minWidth: '120px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                                                            <span style={{ color, fontWeight: '800' }}>%{pct}</span>
                                                        </div>
                                                        <div style={styles.progressTrack}>
                                                            <div style={{ ...styles.progressFill, width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                                                        </div>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '700', color: '#10b981' }}>
                                                        {formatCurrency(prod.totalRevenue)}
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '700', color: '#f59e0b' }}>
                                                        {formatCurrency(prod.totalProfit)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* EN ÇOK TERCİH EDİLEN ÜYELİK PAKETLERİ & RAĞBET ANALİZİ      */}
                    {/* ========================================================= */}
                    <div style={{ ...styles.card, marginTop: '20px', border: '1px solid #333' }}>
                        <div style={styles.cardHeader}>
                            <div>
                                <h3 style={styles.cardTitle}>
                                    <Award size={20} color="#3b82f6" /> Üyelik Paketlerinin Rağbet Takibi & Satılan Bütün Paketlerin Pasta Grafiği
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px' }}>
                                    Seçili dönemde hangi spor üyelik paketinin kaç adet satıldığını, rağbet oranını (%), brüt cirosunu, POS tahsilatından düşülen %20 KDV kesintisini ve net kârını gösterir.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setPackageDemandMode('count')}
                                    style={packageDemandMode === 'count' ? styles.periodBtnActive : styles.periodBtn}
                                >
                                    📊 Adet Bazlı Rağbet (%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPackageDemandMode('revenue')}
                                    style={packageDemandMode === 'revenue' ? styles.periodBtnActive : styles.periodBtn}
                                >
                                    💰 Ciro Payı (%)
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
                            {/* Sol: Satılan Bütün Paketlerin Pasta Grafiği */}
                            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #242424', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#60a5fa', marginBottom: '8px' }}>
                                    🥧 SATILAN BÜTÜN PAKETLERİN PASTA GRAFİĞİ ({packageDemandMode === 'count' ? 'Satış Adedine Göre' : 'Ciro Payına Göre'})
                                </div>
                                {renderPieChart(
                                    (dashboard.topSellingPackages || []).map(p => ({
                                        label: p.packageName,
                                        subLabel: packageDemandMode === 'count' ? `${p.totalSalesCount} Adet Satış` : formatCurrency(p.totalRevenue),
                                        percentage: packageDemandMode === 'count' ? p.salesPercentage : p.revenuePercentage
                                    })),
                                    packageDemandMode === 'count' ? 'TOPLAM PAKET' : 'TOPLAM PAKET CİRO',
                                    packageDemandMode === 'count'
                                        ? `${(dashboard.topSellingPackages || []).reduce((s, x) => s + (x.totalSalesCount || 0), 0)} Adet`
                                        : formatCurrency((dashboard.topSellingPackages || []).reduce((s, x) => s + (x.totalRevenue || 0), 0))
                                )}
                            </div>

                            {/* Sağ: Tüm Paketlerin Rağbet Sıralaması Tablosu */}
                            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #242424', borderRadius: '10px', padding: '16px', maxHeight: '360px', overflowY: 'auto' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10b981', marginBottom: '10px' }}>
                                    📈 TÜM ÜYELİK PAKETLERİNİN RAĞBET & GELİR TABLOSU
                                </div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>#</th>
                                            <th style={styles.th}>Paket Adı</th>
                                            <th style={styles.th}>Satılan</th>
                                            <th style={styles.th}>Rağbet Oranı</th>
                                            <th style={styles.th}>Brüt Ciro</th>
                                            <th style={styles.th}>POS Tahsilat</th>
                                            <th style={styles.th}>POS KDV (%20)</th>
                                            <th style={styles.th}>Net Kâr</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {((dashboard.allPackagesDemand && dashboard.allPackagesDemand.length > 0)
                                            ? dashboard.allPackagesDemand
                                            : (dashboard.topSellingPackages || [])
                                        ).map((pkg, idx) => {
                                            const pct = packageDemandMode === 'count' ? (pkg.salesPercentage || 0) : (pkg.revenuePercentage || 0);
                                            const color = pkg.totalSalesCount > 0 ? PIE_COLORS[idx % PIE_COLORS.length] : '#555';
                                            return (
                                                <tr key={pkg.packageId || idx} style={styles.tr}>
                                                    <td style={{ ...styles.td, color: '#888', fontWeight: '800' }}>{idx + 1}</td>
                                                    <td style={styles.td}>
                                                        <div style={{ fontWeight: '700', color: pkg.totalSalesCount > 0 ? '#fff' : '#777' }}>
                                                            {pkg.packageName}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                                            {pkg.durationMonths ? `${pkg.durationMonths} Ay` : ''}{pkg.price ? ` | Liste: ${formatCurrency(pkg.price)}` : ''}
                                                        </div>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '900', color: pkg.totalSalesCount > 0 ? '#60a5fa' : '#666' }}>
                                                        {pkg.totalSalesCount} Adet
                                                    </td>
                                                    <td style={{ ...styles.td, minWidth: '110px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                                                            <span style={{ color, fontWeight: '800' }}>%{pct}</span>
                                                        </div>
                                                        <div style={styles.progressTrack}>
                                                            <div style={{ ...styles.progressFill, width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                                                        </div>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '700', color: '#10b981' }}>
                                                        {formatCurrency(pkg.totalRevenue)}
                                                    </td>
                                                    <td style={{ ...styles.td, color: '#38bdf8', fontSize: '0.82rem' }}>
                                                        {formatCurrency(pkg.posRevenue)}
                                                    </td>
                                                    <td style={{ ...styles.td, color: pkg.posVatDeduction > 0 ? '#f59e0b' : '#666', fontSize: '0.82rem' }}>
                                                        {pkg.posVatDeduction > 0 ? `-${formatCurrency(pkg.posVatDeduction)}` : '0 ₺'}
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '800', color: '#34d399' }}>
                                                        {formatCurrency(pkg.netProfit)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Alt Dağılım Panelleri (Gelir Dağılımı, Gider Dağılımı, Paket Bazlı Gelir Pasta Grafiği) */}
                    <div style={styles.threeColGrid}>
                        {/* Gelir Dağılımı */}
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                <PieChart size={18} color="#10b981" /> Gelir Kaynakları Dağılımı
                            </h3>
                            {dashboard.incomeByCategory && dashboard.incomeByCategory.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                    {dashboard.incomeByCategory.map((item, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                <span style={{ color: '#ddd', fontWeight: '600' }}>{item.category}</span>
                                                <span style={{ color: '#10b981', fontWeight: '700' }}>{formatCurrency(item.amount)} (%{item.percentage})</span>
                                            </div>
                                            <div style={styles.progressTrack}>
                                                <div style={{ ...styles.progressFill, width: `${Math.min(100, item.percentage)}%`, backgroundColor: '#10b981' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={styles.emptyText}>Bu dönemde henüz gelir kaydı yok.</div>
                            )}
                        </div>

                        {/* Gider Dağılımı */}
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                <PieChart size={18} color="#ef4444" /> Gider Kalemleri Dağılımı
                            </h3>
                            {dashboard.expenseByCategory && dashboard.expenseByCategory.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                    {dashboard.expenseByCategory.map((item, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                <span style={{ color: '#ddd', fontWeight: '600' }}>{item.category}</span>
                                                <span style={{ color: '#ef4444', fontWeight: '700' }}>{formatCurrency(item.amount)} (%{item.percentage})</span>
                                            </div>
                                            <div style={styles.progressTrack}>
                                                <div style={{ ...styles.progressFill, width: `${Math.min(100, item.percentage)}%`, backgroundColor: '#ef4444' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={styles.emptyText}>Bu dönemde henüz gider kaydı yok.</div>
                            )}
                        </div>

                        {/* Üyelik Paketleri Gelir Dağılımı Pasta Grafiği */}
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>
                                <PieChart size={18} color="#3b82f6" /> Paket Bazlı Üyelik Gelir Dağılımı
                            </h3>
                            {renderPieChart(
                                (dashboard.packageRevenueBreakdown || []).map(p => ({
                                    label: p.category,
                                    subLabel: formatCurrency(p.amount),
                                    percentage: p.percentage
                                })),
                                'ÜYELİK CİRO',
                                formatCurrency(dashboard.membershipIncome)
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 2: HIZLI SATIŞ (POS EKRANI)                         */}
            {/* ========================================================= */}
            {activeTab === 'pos' && (
                <div style={styles.posLayout}>
                    {/* Sol Taraf: Ürün Seçim Izgarası */}
                    <div style={styles.posProductsColumn}>
                        <div style={styles.card}>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '15px', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                    <Search size={16} color="#888" style={{ position: 'absolute', left: 12, top: 12 }} />
                                    <input
                                        type="text"
                                        placeholder="Satılacak ürünü ara (Su, Protein, Bar...)"
                                        value={posSearch}
                                        onChange={e => setPosSearch(e.target.value)}
                                        style={{ ...styles.input, paddingLeft: '36px', width: '100%' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {['Tümü', ...PRODUCT_CATEGORIES].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setPosCategory(cat)}
                                            style={posCategory === cat ? styles.periodBtnActive : styles.periodBtn}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.posGrid}>
                                {filteredPosProducts.map(p => {
                                    const isLow = p.stockQuantity <= p.minStockAlert;
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => addToCart(p)}
                                            style={{
                                                ...styles.posProductCard,
                                                borderColor: isLow ? '#f59e0b' : '#262626'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={styles.catBadge}>{p.category}</span>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: '700',
                                                    padding: '2px 7px',
                                                    borderRadius: '4px',
                                                    backgroundColor: p.stockQuantity <= 0 ? '#7f1d1d' : isLow ? '#78350f' : '#1f2937',
                                                    color: p.stockQuantity <= 0 ? '#fca5a5' : isLow ? '#fcd34d' : '#9ca3af'
                                                }}>
                                                    Stok: {p.stockQuantity}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: '800', fontSize: '0.98rem', color: '#fff', marginBottom: '10px', minHeight: '40px' }}>
                                                {p.name}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981' }}>
                                                    {formatCurrency(p.sellingPrice)}
                                                </span>
                                                <span style={styles.posAddBadge}>+ Ekle</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Son Kesilen Satış Fişleri */}
                        <div style={{ ...styles.card, marginTop: '20px' }}>
                            <h3 style={styles.cardTitle}>
                                <Receipt size={18} color="#d90429" /> Son Yapılan Hızlı Satışlar
                            </h3>
                            <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Fiş No</th>
                                            <th style={styles.th}>Tarih</th>
                                            <th style={styles.th}>Satılan Ürünler</th>
                                            <th style={styles.th}>Ödeme</th>
                                            <th style={styles.th}>Toplam</th>
                                            <th style={styles.th}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentSales.slice(0, 12).map(sale => {
                                            const isSplit = String(sale.paymentMethod || '').startsWith('Split');
                                            const isVeresiye = String(sale.paymentMethod || '').startsWith('Veresiye');
                                            return (
                                                <tr key={sale.id} style={styles.tr}>
                                                    <td style={styles.td}><code style={{ color: '#aaa' }}>{sale.receiptNo}</code></td>
                                                    <td style={styles.td}>{formatDate(sale.saleDate)}</td>
                                                    <td style={styles.td}>
                                                        {sale.items && sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span style={
                                                            isVeresiye
                                                                ? { ...styles.posBadge, backgroundColor: 'rgba(139, 92, 246, 0.18)', color: '#c4b5fd', borderColor: 'rgba(139, 92, 246, 0.45)' }
                                                                : isSplit
                                                                    ? { ...styles.posBadge, backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.45)' }
                                                                    : sale.paymentMethod === 'POS' ? styles.posBadge : styles.cashBadge
                                                        }>
                                                            {isVeresiye
                                                                ? `📒 ${sale.paymentMethod}`
                                                                : isSplit
                                                                    ? `🔀 ${sale.paymentMethod.replace('Split', 'Parçalı')}`
                                                                    : sale.paymentMethod === 'POS' ? '💳 POS / Kart' : '💵 Nakit'}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '800', color: '#10b981' }}>
                                                        {formatCurrency(sale.totalAmount)}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <button onClick={() => handleDeleteSale(sale.id)} style={styles.iconBtnDanger} title="Satışı İptal Et ve Stoğu İade Al">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Taraf: Adisyon / Sepet & Tahsilat */}
                    <div style={styles.posCartColumn}>
                        <div style={{ ...styles.card, position: 'sticky', top: '20px', border: '2px solid #d90429' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262626', paddingBottom: '12px', marginBottom: '14px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShoppingCart size={20} color="#d90429" /> SATIŞ SEPETİ
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setCart([]);
                                            setDiscountAmount('');
                                            setPosCashInput('');
                                            setPosCardInput('');
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                                    >
                                        Sepeti Temizle
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div style={{ padding: '32px 15px', textAlign: 'center', color: '#666' }}>
                                    <ShoppingCart size={36} style={{ marginBottom: '8px', opacity: 0.3 }} />
                                    <div>Sepet boş. Soldaki ürün kartlarına tıklayarak sepete ekleyin.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '290px', overflowY: 'auto', marginBottom: '14px' }}>
                                    {cart.map(item => {
                                        const isCustomPrice = item.price !== undefined && Number(item.price) !== Number(item.originalPrice);
                                        const lineOrigTotal = (item.originalPrice || 0) * item.quantity;
                                        const lineCurrentTotal = (Number(item.price || 0)) * item.quantity;
                                        const diff = lineCurrentTotal - lineOrigTotal;
                                        const isDiscount = diff < 0;
                                        const isSurcharge = diff > 0;
                                        const absDiff = Math.abs(diff);
                                        const pct = item.originalPrice > 0 ? Math.round((absDiff / lineOrigTotal) * 100 * 10) / 10 : 0;

                                        return (
                                            <div key={item.productId} style={{ ...styles.cartItemRow, flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1, paddingRight: '8px' }}>
                                                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.92rem' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.74rem', color: '#888' }}>
                                                            Liste Fiyatı: <span style={{ textDecoration: isCustomPrice ? 'line-through' : 'none', color: isCustomPrice ? '#777' : '#aaa' }}>{formatCurrency(item.originalPrice)}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <button onClick={() => updateCartQty(item.productId, -1)} style={styles.qtyBtn}>-</button>
                                                        <span style={{ fontWeight: '800', minWidth: '22px', textAlign: 'center', color: '#fff' }}>{item.quantity}</span>
                                                        <button onClick={() => updateCartQty(item.productId, 1)} style={styles.qtyBtn}>+</button>
                                                        <button onClick={() => removeFromCart(item.productId)} style={{ ...styles.iconBtnDanger, marginLeft: '4px' }} title="Sepetten Kaldır">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Fiyat Düzenleme ve Otomatik İndirim/Zam Rozeti */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: '8px',
                                                    padding: '6px 8px',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#141414',
                                                    border: isDiscount ? '1px solid #059669' : isSurcharge ? '1px solid #d97706' : '1px solid #282828'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '0.74rem', color: '#aaa', fontWeight: '700' }}>Birim Fiyat:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            value={item.price}
                                                            onChange={e => updateCartItemPrice(item.productId, e.target.value)}
                                                            style={{
                                                                width: '80px',
                                                                padding: '3px 8px',
                                                                fontSize: '0.82rem',
                                                                fontWeight: '800',
                                                                backgroundColor: '#0a0a0a',
                                                                border: isDiscount ? '1px solid #10b981' : isSurcharge ? '1px solid #f59e0b' : '1px solid #444',
                                                                borderRadius: '4px',
                                                                color: '#fff'
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '0.78rem', color: '#999' }}>₺</span>
                                                        {isCustomPrice && (
                                                            <button
                                                                type="button"
                                                                onClick={() => resetCartItemPrice(item.productId)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: '1px solid #444',
                                                                    borderRadius: '4px',
                                                                    color: '#ccc',
                                                                    padding: '2px 6px',
                                                                    fontSize: '0.68rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                                title={`Orijinal fiyata dön (${item.originalPrice} ₺)`}
                                                            >
                                                                ↺ Sıfırla
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: isDiscount ? '#34d399' : isSurcharge ? '#fbbf24' : '#10b981' }}>
                                                            {formatCurrency(lineCurrentTotal)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Otomatik İndirim veya Zam Bildirim Rozeti */}
                                                {isDiscount && (
                                                    <div style={{
                                                        fontSize: '0.73rem',
                                                        color: '#6ee7b7',
                                                        fontWeight: '800',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px'
                                                    }}>
                                                        <Tag size={12} />
                                                        <span>Otomatik İndirim: -{formatCurrency(absDiff)} (%{pct} indirim uygulandı)</span>
                                                    </div>
                                                )}
                                                {isSurcharge && (
                                                    <div style={{
                                                        fontSize: '0.73rem',
                                                        color: '#fcd34d',
                                                        fontWeight: '800',
                                                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px'
                                                    }}>
                                                        <ArrowUpRight size={12} />
                                                        <span>Otomatik Zam / Özel Fiyat: +{formatCurrency(absDiff)} (+%{pct} fiyat artışı)</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Hızlı İndirim & Fiyat Düzenleme Araçları */}
                            <div style={{
                                backgroundColor: '#0e0e0e',
                                border: '1px solid #262626',
                                borderRadius: '10px',
                                padding: '12px',
                                marginBottom: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#f59e0b', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Tag size={14} /> İNDİRİM & FİYAT DÜZENLEME SEÇENEKLERİ
                                    </span>
                                    {(parseFloat(discountAmount || 0) > 0 || parseFloat(priceSurcharge || 0) > 0) && (
                                        <button
                                            type="button"
                                            onClick={() => { setDiscountAmount(''); setPriceSurcharge(''); setPercentDiscountInput(''); setPosCashInput(''); setPosCardInput(''); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                        >
                                            Düzenlemeyi Kaldır
                                        </button>
                                    )}
                                </div>

                                {/* Yüzdelik İndirim Butonları & Inputu */}
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: '700', marginBottom: '5px' }}>
                                        📊 Yüzdelik İndirim Uygula (%):
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {[5, 10, 15, 20, 50].map(pct => (
                                            <button
                                                key={pct}
                                                type="button"
                                                disabled={cart.length === 0}
                                                onClick={() => applyPercentDiscount(pct)}
                                                style={{
                                                    ...styles.stockQuickBtn,
                                                    borderColor: percentDiscountInput === String(pct) ? '#f59e0b' : '#333',
                                                    color: percentDiscountInput === String(pct) ? '#fcd34d' : '#ccc'
                                                }}
                                            >
                                                %{pct} {pct === 50 ? 'Yarı Fiyat' : ''}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={cart.length === 0}
                                            onClick={applyRoundDownDiscount}
                                            style={styles.stockQuickBtn}
                                            title="Küsuratı silip düz hesaba yuvarlar"
                                        >
                                            ✨ Düz Hesap
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#888' }}>%</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="Özel %"
                                                value={percentDiscountInput}
                                                onChange={e => applyPercentDiscount(e.target.value)}
                                                style={{ ...styles.input, width: '65px', padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Direkt Tutar İndirimi Butonları & Inputu */}
                                <div style={{ marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #1f1f1f' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: '700', marginBottom: '5px' }}>
                                        💵 Direkt Tutar İndirimi Yap (₺):
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {[10, 20, 50, 100].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                disabled={cart.length === 0}
                                                onClick={() => applyDirectAmountDiscount(amt)}
                                                style={styles.stockQuickBtn}
                                            >
                                                -{amt} ₺
                                            </button>
                                        ))}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#888' }}>₺</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="İndirim ₺"
                                                value={discountAmount}
                                                onChange={e => applyDirectAmountDiscount(e.target.value)}
                                                style={{ ...styles.input, width: '90px', padding: '4px 8px', fontSize: '0.8rem', color: '#f59e0b', fontWeight: '800' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Nihai Sepet Tutarını Elle Değiştirme (Örn: 120 ₺'yi direkt 100 ₺ yapma) */}
                                <div style={{ paddingTop: '8px', borderTop: '1px solid #1f1f1f' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.73rem', color: '#6ee7b7', fontWeight: '800' }}>
                                            🎯 Sepet Nihai Tutarını Elle Belirle (Otomatik İndirim/Zam):
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder={`Örn: ${cartSubTotal > 0 ? (cartSubTotal > 20 ? cartSubTotal - 20 : cartSubTotal) : 100}`}
                                            value={cartTotal > 0 ? cartTotal : ''}
                                            onChange={e => handleDirectTotalChange(e.target.value)}
                                            style={{
                                                ...styles.input,
                                                padding: '7px 10px',
                                                fontSize: '0.88rem',
                                                color: '#10b981',
                                                fontWeight: '900',
                                                flex: 1
                                            }}
                                        />
                                        <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: '700' }}>₺</span>
                                        {(parseFloat(discountAmount || 0) > 0 || parseFloat(priceSurcharge || 0) > 0) && (
                                            <button
                                                type="button"
                                                onClick={() => { setDiscountAmount(''); setPriceSurcharge(''); setPercentDiscountInput(''); setPosCashInput(''); setPosCardInput(''); }}
                                                style={{ ...styles.stockQuickBtn, color: '#f87171' }}
                                                title="Varsayılan hesaplanan tutara dön"
                                            >
                                                ↺ Sıfırla
                                            </button>
                                        )}
                                    </div>
                                    {parseFloat(discountAmount || 0) > 0 && (
                                        <div style={{ fontSize: '0.73rem', color: '#34d399', fontWeight: '800', marginTop: '5px' }}>
                                            ✓ {formatCurrency(cartSubTotal)} yerine {formatCurrency(cartTotal)} belirlendi (Otomatik İndirim: -{formatCurrency(discountAmount)}).
                                        </div>
                                    )}
                                    {parseFloat(priceSurcharge || 0) > 0 && (
                                        <div style={{ fontSize: '0.73rem', color: '#fbbf24', fontWeight: '800', marginTop: '5px' }}>
                                            ✓ {formatCurrency(cartSubTotal)} yerine {formatCurrency(cartTotal)} belirlendi (Otomatik Zam / Ek Tutar: +{formatCurrency(priceSurcharge)}).
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Üyeye Satış Bağlama & Veresiye (Cari Hesaba Yazma) Seçimi */}
                            <div style={{
                                backgroundColor: '#0e0e0e',
                                border: '1px solid #2b2b2b',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                marginBottom: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#c4b5fd' }}>
                                        👤 ÜYEYE SATIŞ BAĞLA / VERESİYE SEÇİMİ
                                    </span>
                                    {selectedPosMemberId && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedPosMemberId(''); setPosMemberSearch(''); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Seçimi Kaldır
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Üye adı ara (Örn: Furkan, Meliha...)"
                                    value={posMemberSearch}
                                    onChange={e => setPosMemberSearch(e.target.value)}
                                    style={{ ...styles.input, padding: '7px 10px', fontSize: '0.82rem', marginBottom: '6px' }}
                                />
                                <select
                                    value={selectedPosMemberId}
                                    onChange={e => setSelectedPosMemberId(e.target.value)}
                                    style={{ ...styles.input, padding: '7px 10px', fontSize: '0.83rem', borderColor: selectedPosMemberId ? '#8b5cf6' : '#333' }}
                                >
                                    <option value="">-- Üye Seçilmedi (Anonim / Misafir Satış) --</option>
                                    {filteredPosMembers.map(m => {
                                        const name = m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim();
                                        const debt = Math.max(0, (m.totalDebt || 0) - (m.paidAmount || 0));
                                        return (
                                            <option key={m.id} value={m.id}>
                                                {name} {debt > 0 ? `(Mevcut Borç: ${debt} ₺)` : '(Borçsuz)'}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedPosMember && (
                                    <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#c4b5fd', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Seçili: <b>{selectedPosMember.fullName || `${selectedPosMember.firstName} ${selectedPosMember.lastName}`}</b></span>
                                        <span>Kalan Cari Borç: <b style={{ color: '#f87171' }}>{formatCurrency(Math.max(0, (selectedPosMember.totalDebt || 0) - (selectedPosMember.paidAmount || 0)))}</b></span>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Ek satış notu (Opsiyonel)"
                                    value={saleNote}
                                    onChange={e => setSaleNote(e.target.value)}
                                    style={{ ...styles.input, width: '100%' }}
                                />
                            </div>

                            {/* Toplam Tutar Özeti */}
                            <div style={{ ...styles.cartTotalBox, flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                                {cartOriginalSubTotal !== cartSubTotal && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#888' }}>
                                        <span>Liste Fiyatı Toplamı: {formatCurrency(cartOriginalSubTotal)}</span>
                                        <span style={{ color: cartSubTotal < cartOriginalSubTotal ? '#34d399' : '#fbbf24', fontWeight: '700' }}>
                                            {cartSubTotal < cartOriginalSubTotal
                                                ? `Özel İndirimli Ara Toplam: ${formatCurrency(cartSubTotal)}`
                                                : `Fiyat Artışlı Ara Toplam: ${formatCurrency(cartSubTotal)}`}
                                        </span>
                                    </div>
                                )}
                                {parseFloat(discountAmount || 0) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#999' }}>
                                        <span>Ara Toplam: {formatCurrency(cartSubTotal)}</span>
                                        <span style={{ color: '#10b981', fontWeight: '800' }}>
                                            🏷️ Otomatik İndirim: -{formatCurrency(discountAmount)}
                                        </span>
                                    </div>
                                )}
                                {parseFloat(priceSurcharge || 0) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#999' }}>
                                        <span>Ara Toplam: {formatCurrency(cartSubTotal)}</span>
                                        <span style={{ color: '#f59e0b', fontWeight: '800' }}>
                                            📈 Otomatik Zam: +{formatCurrency(priceSurcharge)}
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '8px', marginTop: '4px' }}>
                                    <span style={{ color: '#fff', fontWeight: '900', fontSize: '0.95rem' }}>NET TOPLAM TUTAR</span>
                                    <span style={{ fontSize: '1.65rem', fontWeight: '900', color: '#10b981' }}>
                                        {formatCurrency(cartTotal)}
                                    </span>
                                </div>
                            </div>

                            {/* POS Para Üstü Hesaplayıcı */}
                            <div style={{
                                backgroundColor: '#0e0e0e',
                                border: '1px solid #262626',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                marginTop: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6ee7b7' }}>
                                        💴 PARA ÜSTÜ HESAPLAYICI (VERİLEN NAKİT)
                                    </span>
                                    {tenderedCash !== '' && (
                                        <button
                                            type="button"
                                            onClick={() => setTenderedCash('')}
                                            style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.7rem', cursor: 'pointer' }}
                                        >
                                            Sıfırla
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    {[50, 100, 200, 500, 1000].map(banknote => (
                                        <button
                                            key={banknote}
                                            type="button"
                                            disabled={cartTotal <= 0}
                                            onClick={() => setTenderedCash(String(banknote))}
                                            style={{
                                                ...styles.stockQuickBtn,
                                                borderColor: Number(tenderedCash) === banknote ? '#10b981' : '#383838',
                                                color: Number(tenderedCash) === banknote ? '#10b981' : '#ddd'
                                            }}
                                        >
                                            {banknote} ₺
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Verilen ₺"
                                        value={tenderedCash}
                                        onChange={e => setTenderedCash(e.target.value)}
                                        style={{ ...styles.input, width: '90px', padding: '4px 8px', fontSize: '0.8rem' }}
                                    />
                                </div>
                                {parseFloat(tenderedCash || 0) > 0 && cartTotal > 0 && (() => {
                                    const cashTarget = parseFloat(posCashInput || 0) > 0 ? parseFloat(posCashInput) : cartTotal;
                                    const change = parseFloat(tenderedCash) - cashTarget;
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: change >= 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                                            border: change >= 0 ? '1px solid #10b981' : '1px solid #ef4444'
                                        }}>
                                            <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#ddd' }}>
                                                {change >= 0 ? 'Müşteriye Verilecek Para Üstü:' : 'Eksik Kalan Tutar:'}
                                            </span>
                                            <span style={{ fontSize: '1.05rem', fontWeight: '900', color: change >= 0 ? '#10b981' : '#f87171' }}>
                                                {formatCurrency(Math.abs(change))}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Parçalı Ödeme (Nakit + POS Ayrı Ayrı Tahsilat) Bölümü */}
                            <div style={{
                                backgroundColor: '#0e0e0e',
                                border: '1px solid #2b2b2b',
                                borderRadius: '10px',
                                padding: '12px',
                                marginTop: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#e5e7eb' }}>
                                        🔀 PARÇALI ÖDEME (NAKİT + POS AYRI AYRI)
                                    </span>
                                    <button
                                        type="button"
                                        disabled={cartTotal <= 0}
                                        onClick={splitPosHalfAndHalf}
                                        style={{
                                            backgroundColor: 'rgba(245, 158, 11, 0.16)',
                                            color: '#fcd34d',
                                            border: '1px solid rgba(245, 158, 11, 0.45)',
                                            borderRadius: '6px',
                                            padding: '4px 9px',
                                            fontSize: '0.74rem',
                                            fontWeight: '800',
                                            cursor: cartTotal > 0 ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        ➗ Yarıya Böl (%50-%50)
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <label style={{ fontSize: '0.74rem', color: '#6ee7b7', fontWeight: '700' }}>💵 Nakit (₺)</label>
                                            <button
                                                type="button"
                                                onClick={fillRemainingPosCash}
                                                style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700', padding: 0 }}
                                                title="Kalan tutarı Nakit kutusuna doldur"
                                            >
                                                Kalanı Doldur
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Örn: 500"
                                            value={posCashInput}
                                            onFocus={() => {
                                                if (posCashInput === '' && posCardInput !== '') fillRemainingPosCash();
                                            }}
                                            onChange={e => handlePosCashChange(e.target.value)}
                                            style={{ ...styles.input, padding: '8px 10px', borderColor: '#059669', fontWeight: '800', color: '#6ee7b7' }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <label style={{ fontSize: '0.74rem', color: '#93c5fd', fontWeight: '700' }}>💳 POS / Kart (₺)</label>
                                            <button
                                                type="button"
                                                onClick={fillRemainingPosCard}
                                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700', padding: 0 }}
                                                title="Kalan tutarı POS kutusuna doldur"
                                            >
                                                Kalanı Doldur
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Örn: 300"
                                            value={posCardInput}
                                            onFocus={() => {
                                                if (posCardInput === '' && posCashInput !== '') fillRemainingPosCard();
                                            }}
                                            onChange={e => handlePosCardChange(e.target.value)}
                                            style={{ ...styles.input, padding: '8px 10px', borderColor: '#2563eb', fontWeight: '800', color: '#93c5fd' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={loading || cart.length === 0 || (parseFloat(posCashInput || 0) <= 0 && parseFloat(posCardInput || 0) <= 0)}
                                    onClick={() => handleCheckout('Split')}
                                    style={{
                                        width: '100%',
                                        padding: '11px',
                                        borderRadius: '8px',
                                        border: '1px solid #f59e0b',
                                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                        color: '#fff',
                                        fontWeight: '900',
                                        fontSize: '0.88rem',
                                        cursor: (cart.length > 0 && (parseFloat(posCashInput || 0) > 0 || parseFloat(posCardInput || 0) > 0)) ? 'pointer' : 'not-allowed',
                                        opacity: (cart.length > 0 && (parseFloat(posCashInput || 0) > 0 || parseFloat(posCardInput || 0) > 0)) ? 1 : 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    ⚡ PARÇALI ÖDEME İLE SATIŞI TAMAMLA
                                </button>
                            </div>

                            {/* Tek Tıkla Tam Tahsilat & Veresiye Butonları */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                <button
                                    disabled={loading || cart.length === 0}
                                    onClick={() => handleCheckout('Cash')}
                                    style={styles.checkoutCashBtn}
                                >
                                    <Banknote size={20} /> 💵 TAMAMI NAKİT SATIŞ YAP
                                </button>
                                <button
                                    disabled={loading || cart.length === 0}
                                    onClick={() => handleCheckout('POS')}
                                    style={styles.checkoutPosBtn}
                                >
                                    <CreditCard size={20} /> 💳 TAMAMI POS / KART İLE SATIŞ YAP
                                </button>
                                <button
                                    type="button"
                                    disabled={loading || cart.length === 0 || !selectedPosMemberId}
                                    onClick={() => handleCheckout('Veresiye')}
                                    style={{
                                        backgroundColor: selectedPosMemberId ? '#7c3aed' : '#27272a',
                                        color: '#fff',
                                        border: '1px solid #8b5cf6',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        fontWeight: '900',
                                        fontSize: '0.88rem',
                                        cursor: (cart.length > 0 && selectedPosMemberId) ? 'pointer' : 'not-allowed',
                                        opacity: (cart.length > 0 && selectedPosMemberId) ? 1 : 0.55,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    title="Seçili üyenin cari borç hanesine yazar"
                                >
                                    📒 ÜYENİN CARİ BORCUNA YAZ (VERESİYE)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 2.5: TOPLU GELİR & AY BAŞI AÇILIŞ BAKİYESİ GİRİŞİ     */}
            {/* ========================================================= */}
            {activeTab === 'bulk_income' && (
                <div>
                    {/* Üst Bilgilendirme ve Hızlı Şablonlar Kartı */}
                    <div style={{
                        ...styles.card,
                        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
                        border: '1px solid #10b981',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <DownloadCloud size={24} color="#10b981" /> Toplu Gelir & Ay Başı Açılış Bakiyesi Girişi
                                </h3>
                                <p style={{ margin: '8px 0 0 0', color: '#ccc', fontSize: '0.85rem', maxWidth: '780px', lineHeight: '1.45' }}>
                                    Eski üyelerden bu aya devreden spor üyelikleri toplamını, ay başı kasa ve POS mevcudunu ya da toplu tahsilatları tek seferde sisteme girin.
                                    Girilen tutarlar doğrudan resmi <b>Kasa Defteri</b>'ne, <b>Kasa/POS Nakit Dengesi</b>'ne ve <b>Finans Raporları</b>'na anında işlenir.
                                </p>
                            </div>

                            {/* Hızlı Şablonlar (Hazır Doldurucular) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#10b981', letterSpacing: '0.5px' }}>
                                    ✨ HIZLI DOLDURMA ŞABLONLARI:
                                </span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => applyBulkPreset('opening_package')}
                                        style={{ ...styles.stockQuickBtn, borderColor: '#10b981', color: '#6ee7b7' }}
                                        title="Kasım ay başı üyelikler + nakit kasa + POS mevcudu 3 satır açar"
                                    >
                                        📋 Ay Başı Açılış Paketi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyBulkPreset('membership_pool')}
                                        style={styles.stockQuickBtn}
                                        title="Nakit ve POS üyelik gelirleri 2 satır açar"
                                    >
                                        🏃 Toplu Spor Üyelik Devri
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyBulkPreset('eft_transfer')}
                                        style={styles.stockQuickBtn}
                                        title="Banka Havale / EFT satırı açar"
                                    >
                                        🏦 Havale / EFT Havuzu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toplu Gelir Giriş Tablosu Kartı */}
                    <div style={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={styles.cardTitle}>
                                <Layers size={18} color="#10b981" /> Gelir Kalemleri Listesi ({bulkIncomeList.length} Kalem)
                            </h3>
                            <button
                                type="button"
                                onClick={addBulkIncomeRow}
                                style={{ ...styles.primaryBtn, backgroundColor: '#1f2937', borderColor: '#374151', color: '#10b981', fontSize: '0.82rem', padding: '6px 12px' }}
                            >
                                <Plus size={15} /> + Yeni Gelir Satırı Ekle
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ ...styles.th, width: '40px' }}>#</th>
                                        <th style={{ ...styles.th, width: '135px' }}>Tarih</th>
                                        <th style={{ ...styles.th, width: '170px' }}>Kategori</th>
                                        <th style={styles.th}>Gelir Başlığı / Kalem Adı *</th>
                                        <th style={{ ...styles.th, width: '130px' }}>Tutar (₺) *</th>
                                        <th style={{ ...styles.th, width: '150px' }}>Kasa / Ödeme</th>
                                        <th style={styles.th}>Açıklama / Not</th>
                                        <th style={{ ...styles.th, width: '50px' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkIncomeList.map((row, idx) => {
                                        const isSplit = row.paymentMethod === 'Split';
                                        return (
                                            <tr key={row.id}>
                                                <td style={{ ...styles.td, color: '#888', fontWeight: '800' }}>{idx + 1}</td>
                                                <td style={styles.td}>
                                                    <input
                                                        type="date"
                                                        value={row.date}
                                                        onChange={e => updateBulkIncomeRow(row.id, 'date', e.target.value)}
                                                        style={{ ...styles.input, width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                                                    />
                                                </td>
                                                <td style={styles.td}>
                                                    <select
                                                        value={row.category}
                                                        onChange={e => updateBulkIncomeRow(row.id, 'category', e.target.value)}
                                                        style={{ ...styles.input, width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                                                    >
                                                        {BULK_INCOME_CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td style={styles.td}>
                                                    <input
                                                        type="text"
                                                        placeholder="Örn: Kasım Ay Başı Spor Üyelikleri Toplamı"
                                                        value={row.title}
                                                        onChange={e => updateBulkIncomeRow(row.id, 'title', e.target.value)}
                                                        style={{ ...styles.input, width: '100%', padding: '6px 10px', fontSize: '0.85rem', fontWeight: '700' }}
                                                    />
                                                </td>
                                                <td style={styles.td}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        placeholder="0"
                                                        value={row.amount}
                                                        onChange={e => updateBulkIncomeRow(row.id, 'amount', e.target.value)}
                                                        style={{
                                                            ...styles.input,
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '900',
                                                            color: '#10b981'
                                                        }}
                                                    />
                                                </td>
                                                <td style={styles.td}>
                                                    <select
                                                        value={row.paymentMethod}
                                                        onChange={e => updateBulkIncomeRow(row.id, 'paymentMethod', e.target.value)}
                                                        style={{ ...styles.input, width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                                                    >
                                                        <option value="Cash">💵 Nakit (Kasa)</option>
                                                        <option value="POS">💳 POS / Banka</option>
                                                        <option value="Split">🔀 Parçalı (Nakit + POS)</option>
                                                    </select>
                                                    {isSplit && (
                                                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="Nakit ₺"
                                                                value={row.cashAmount}
                                                                onChange={e => updateBulkIncomeRow(row.id, 'cashAmount', e.target.value)}
                                                                style={{ ...styles.input, width: '50%', padding: '4px 6px', fontSize: '0.78rem', color: '#10b981' }}
                                                                title="Nakit Payı"
                                                            />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="POS ₺"
                                                                value={row.posAmount}
                                                                onChange={e => updateBulkIncomeRow(row.id, 'posAmount', e.target.value)}
                                                                style={{ ...styles.input, width: '50%', padding: '4px 6px', fontSize: '0.78rem', color: '#38bdf8' }}
                                                                title="POS Payı"
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={styles.td}>
                                                    <input
                                                        type="text"
                                                        placeholder="İsteğe bağlı açıklama veya not..."
                                                        value={row.description}
                                                        onChange={e => updateBulkIncomeRow(row.id, 'description', e.target.value)}
                                                        style={{ ...styles.input, width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                                                    />
                                                </td>
                                                <td style={styles.td}>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBulkIncomeRow(row.id)}
                                                        style={styles.iconBtnDanger}
                                                        title="Bu satırı kaldır"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Canlı Finansal İcmal ve Toplu Kayıt Çubuğu */}
                        <div style={{
                            backgroundColor: '#0d0d0d',
                            border: '1px solid #262626',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700' }}>TOPLAM GİRİLECEK GELİR</div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#10b981' }}>
                                        {formatCurrency(totalBulkAmount)}
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid #262626', paddingLeft: '16px' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>💵 Nakit Kasa Payı:</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#34d399' }}>
                                        {formatCurrency(totalBulkCash)}
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid #262626', paddingLeft: '16px' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>💳 POS / Banka Payı:</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#38bdf8' }}>
                                        {formatCurrency(totalBulkPos)}
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid #262626', paddingLeft: '16px' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>Doldurulan Satır:</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
                                        {bulkIncomeList.filter(i => parseFloat(i.amount || 0) > 0 || parseFloat(i.cashAmount || 0) > 0 || parseFloat(i.posAmount || 0) > 0).length} / {bulkIncomeList.length} Kalem
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Toplu işlem genel notu (Opsiyonel)"
                                    value={bulkBatchNote}
                                    onChange={e => setBulkBatchNote(e.target.value)}
                                    style={{ ...styles.input, width: '220px', padding: '9px 12px', fontSize: '0.84rem' }}
                                />
                                <button
                                    type="button"
                                    disabled={bulkSaving || totalBulkAmount <= 0}
                                    onClick={handleSaveBulkIncome}
                                    style={{
                                        ...styles.primaryBtn,
                                        backgroundColor: '#059669',
                                        borderColor: '#10b981',
                                        padding: '10px 22px',
                                        fontSize: '0.92rem',
                                        fontWeight: '900',
                                        cursor: (bulkSaving || totalBulkAmount <= 0) ? 'not-allowed' : 'pointer',
                                        opacity: (bulkSaving || totalBulkAmount <= 0) ? 0.5 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <DownloadCloud size={17} />
                                    {bulkSaving ? 'Kaydediliyor...' : 'Toplu Gelirleri Sisteme Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Daha Önce Girilmiş Toplu / Ay Başı Gelirleri Geçmişi */}
                    <div style={{ ...styles.card, marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={styles.cardTitle}>
                                <Receipt size={18} color="#10b981" /> Sisteme İşlenen Toplu & Açılış Gelirleri Geçmişi ({historicalBulkIncomes.length} Kayıt)
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                Hatalı girilen bir kayıt varsa yanındaki çöp kutusu ikonuna basarak silebilirsiniz.
                            </span>
                        </div>

                        {historicalBulkIncomes.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                                Henüz toplu gelir veya ay başı açılış kaydı girilmemiş. Yukarıdaki formdan ilk toplu gelirinizi ekleyebilirsiniz.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Tarih</th>
                                            <th style={styles.th}>Kategori</th>
                                            <th style={styles.th}>Gelir Başlığı</th>
                                            <th style={styles.th}>Kasa / Ödeme</th>
                                            <th style={styles.th}>Tutar</th>
                                            <th style={styles.th}>Açıklama</th>
                                            <th style={styles.th}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historicalBulkIncomes.map(tx => (
                                            <tr key={tx.id}>
                                                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{formatDate(tx.transactionDate)}</td>
                                                <td style={styles.td}><span style={styles.catBadge}>{tx.category}</span></td>
                                                <td style={{ ...styles.td, fontWeight: '700', color: '#fff' }}>{tx.title}</td>
                                                <td style={styles.td}>
                                                    <span style={tx.paymentMethod === 'POS' ? styles.posBadge : styles.cashBadge}>
                                                        {tx.paymentMethod === 'POS' ? '💳 POS / Kart' : '💵 Nakit Kasa'}
                                                    </span>
                                                </td>
                                                <td style={{ ...styles.td, fontWeight: '900', color: '#10b981', fontSize: '0.95rem' }}>
                                                    +{formatCurrency(tx.amount)}
                                                </td>
                                                <td style={{ ...styles.td, color: '#888', fontSize: '0.8rem' }}>{tx.description || '-'}</td>
                                                <td style={styles.td}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteTransaction(tx.id)}
                                                        style={styles.iconBtnDanger}
                                                        title="Bu geliri sil ve kasadan düş"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 3: ÜRÜN & STOK YÖNETİMİ                             */}
            {/* ========================================================= */}
            {activeTab === 'products' && (
                <div>
                    {/* Ürün Ekleme / Düzenleme Formu */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <Package size={18} color="#d90429" />
                            {editingProduct ? `Ürünü Düzenle: ${editingProduct.name}` : 'Yeni Satış Ürünü Ekle'}
                        </h3>
                        <form onSubmit={handleSaveProduct} style={styles.formGrid}>
                            <div>
                                <label style={styles.label}>Ürün Adı *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Su (0.5L), Protein Shake..."
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Kategori</label>
                                <select
                                    value={productForm.category}
                                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                                    style={styles.input}
                                >
                                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Alış / Maliyet Fiyatı (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={productForm.buyingPrice}
                                    onChange={e => setProductForm({ ...productForm, buyingPrice: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Satış Fiyatı (₺) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    value={productForm.sellingPrice}
                                    onChange={e => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Mevcut Stok Adedi</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={productForm.stockQuantity}
                                    onChange={e => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Kritik Stok Uyarı Sınırı</label>
                                <input
                                    type="number"
                                    placeholder="5"
                                    value={productForm.minStockAlert}
                                    onChange={e => setProductForm({ ...productForm, minStockAlert: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <button type="submit" style={{ ...styles.primaryBtn, width: '100%' }}>
                                    <Plus size={16} /> {editingProduct ? 'Güncelle' : 'Ürünü Kaydet'}
                                </button>
                                {editingProduct && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingProduct(null);
                                            setProductForm({ name: '', category: 'İçecek', barcode: '', buyingPrice: '', sellingPrice: '', stockQuantity: '', minStockAlert: '5', isActive: true });
                                        }}
                                        style={styles.secondaryBtn}
                                    >
                                        İptal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Ürün Listesi Tablosu */}
                    <div style={{ ...styles.card, marginTop: '20px' }}>
                        <h3 style={styles.cardTitle}>Envanter ve Stok Listesi ({products.length} Ürün)</h3>
                        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Ürün Adı</th>
                                        <th style={styles.th}>Kategori</th>
                                        <th style={styles.th}>Alış (Maliyet)</th>
                                        <th style={styles.th}>Satış Fiyatı</th>
                                        <th style={styles.th}>Birim Kâr</th>
                                        <th style={styles.th}>Kalan Stok</th>
                                        <th style={styles.th}>Hızlı Stok Ekle</th>
                                        <th style={styles.th}>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const profit = (p.sellingPrice || 0) - (p.buyingPrice || 0);
                                        const isLow = p.stockQuantity <= p.minStockAlert;
                                        return (
                                            <tr key={p.id} style={styles.tr}>
                                                <td style={{ ...styles.td, fontWeight: '700', color: '#fff' }}>{p.name}</td>
                                                <td style={styles.td}><span style={styles.catBadge}>{p.category}</span></td>
                                                <td style={{ ...styles.td, color: '#aaa' }}>{formatCurrency(p.buyingPrice)}</td>
                                                <td style={{ ...styles.td, color: '#10b981', fontWeight: '800' }}>{formatCurrency(p.sellingPrice)}</td>
                                                <td style={{ ...styles.td, color: '#f59e0b', fontWeight: '700' }}>+{formatCurrency(profit)}</td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontWeight: '800',
                                                        fontSize: '0.82rem',
                                                        backgroundColor: isLow ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                                                        color: isLow ? '#fca5a5' : '#6ee7b7',
                                                        border: isLow ? '1px solid #ef4444' : '1px solid #10b981'
                                                    }}>
                                                        {p.stockQuantity} Adet {isLow ? '⚠️' : ''}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => handleQuickStockAdd(p, 12)} style={styles.stockQuickBtn}>+12</button>
                                                        <button onClick={() => handleQuickStockAdd(p, 24)} style={styles.stockQuickBtn}>+24</button>
                                                        <button onClick={() => handleQuickStockAdd(p, -1)} style={styles.stockQuickBtn}>-1</button>
                                                    </div>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleEditProductClick(p)} style={styles.iconBtnEdit} title="Düzenle">
                                                            <Edit size={15} />
                                                        </button>
                                                        <button onClick={() => handleDeleteProduct(p.id)} style={styles.iconBtnDanger} title="Sil">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 4: GİDERLER & TOPTAN ÜRÜN ALIMLARI                  */}
            {/* ========================================================= */}
            {activeTab === 'expenses' && (
                <div>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            <TrendingDown size={18} color="#ef4444" /> Dükkan Gideri, Fatura veya Toptan Ürün Alımı Gir
                        </h3>
                        <form onSubmit={handleSaveExpense} style={styles.formGrid}>
                            <div>
                                <label style={styles.label}>Gider Başlığı / Açıklaması *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Elektrik Faturası, Dükkan Kirası, 10 Koli Su Alımı..."
                                    value={expenseForm.title}
                                    onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Gider Kategorisi</label>
                                <select
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    style={styles.input}
                                >
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Tutar (₺) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Ödeme Yöntemi (Kasadan Çıkış)</label>
                                <select
                                    value={expenseForm.paymentMethod}
                                    onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                    style={styles.input}
                                >
                                    <option value="Cash">💵 Nakit Kasadan Ödendi</option>
                                    <option value="POS">💳 POS / Banka Hesabından Ödendi</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Gider Tarihi</label>
                                <input
                                    type="date"
                                    value={expenseForm.expenseDate}
                                    onChange={e => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Stok Artırılacak Ürün (Toptan Alımsa Seçin)</label>
                                <select
                                    value={expenseForm.linkedProductId}
                                    onChange={e => setExpenseForm({ ...expenseForm, linkedProductId: e.target.value })}
                                    style={styles.input}
                                >
                                    <option value="">-- Stok Bağlantısı Yok --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Mevcut: {p.stockQuantity})</option>
                                    ))}
                                </select>
                            </div>
                            {expenseForm.linkedProductId && (
                                <div>
                                    <label style={styles.label}>Alınan Ürün Adedi (Stoğa Eklenecek)</label>
                                    <input
                                        type="number"
                                        placeholder="Örn: 48"
                                        value={expenseForm.addedStockQuantity}
                                        onChange={e => setExpenseForm({ ...expenseForm, addedStockQuantity: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                            )}
                            <div>
                                <label style={styles.label}>Ek Not (Opsiyonel)</label>
                                <input
                                    type="text"
                                    placeholder="Fatura no, tedarikçi vb."
                                    value={expenseForm.description}
                                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" style={{ ...styles.dangerBtn, width: '100%' }}>
                                    <Plus size={16} /> Gideri Kaydet
                                </button>
                            </div>
                        </form>
                    </div>

                    <div style={{ ...styles.card, marginTop: '20px' }}>
                        <h3 style={styles.cardTitle}>Kayıtlı Giderler ve Ürün Alışları ({expenses.length})</h3>
                        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Tarih</th>
                                        <th style={styles.th}>Başlık</th>
                                        <th style={styles.th}>Kategori</th>
                                        <th style={styles.th}>Ödeme</th>
                                        <th style={styles.th}>Tutar</th>
                                        <th style={styles.th}>Açıklama / Stok</th>
                                        <th style={styles.th}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp.id} style={styles.tr}>
                                            <td style={styles.td}>{formatDate(exp.expenseDate)}</td>
                                            <td style={{ ...styles.td, fontWeight: '700', color: '#fff' }}>{exp.title}</td>
                                            <td style={styles.td}><span style={styles.catBadge}>{exp.category}</span></td>
                                            <td style={styles.td}>
                                                <span style={exp.paymentMethod === 'POS' ? styles.posBadge : styles.cashBadge}>
                                                    {exp.paymentMethod === 'POS' ? '💳 Banka / Kart' : '💵 Nakit'}
                                                </span>
                                            </td>
                                            <td style={{ ...styles.td, fontWeight: '800', color: '#ef4444' }}>
                                                -{formatCurrency(exp.amount)}
                                            </td>
                                            <td style={{ ...styles.td, color: '#999', fontSize: '0.82rem' }}>
                                                {exp.description || '-'}
                                                {exp.addedStockQuantity > 0 && ` (+${exp.addedStockQuantity} Adet Stok Eklendi)`}
                                            </td>
                                            <td style={styles.td}>
                                                <button onClick={() => handleDeleteExpense(exp.id)} style={styles.iconBtnDanger}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 5: ÜYELİK GELİR ONAY HAVUZU                         */}
            {/* ========================================================= */}
            {activeTab === 'approvals' && (
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <h3 style={styles.cardTitle}>
                                <CheckCircle2 size={20} color="#10b981" /> Üyelik Tahsilatları Gelir Onay Ekranı
                            </h3>
                            <div style={{ fontSize: '0.83rem', color: '#999', marginTop: '4px' }}>
                                Ana sistemden yeni üye eklendiğinde, üyelik uzatıldığında veya borç tahsil edildiğinde ödemeler buraya düşer.
                                Gelen paranın <b>Nakit</b> mi yoksa <b>POS (Kredi Kartı)</b> mı olduğunu seçerek kasaya onaylayın.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { id: 'Pending', label: `⏳ Onay Bekleyenler (${pendingCount})` },
                                { id: 'Approved', label: '✅ Onaylananlar' },
                                { id: 'Rejected', label: '❌ İptal Edilenler' },
                                { id: 'All', label: 'Tümü' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setApprovalFilter(f.id)}
                                    style={approvalFilter === f.id ? styles.periodBtnActive : styles.periodBtn}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tarih</th>
                                    <th style={styles.th}>Üye Adı Soyadı</th>
                                    <th style={styles.th}>İşlem / Paket</th>
                                    <th style={styles.th}>Tahsil Edilen Tutar</th>
                                    <th style={styles.th}>Durum</th>
                                    <th style={styles.th}>Kasa Onay İşlemi (Nakit / POS Seçimi)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApprovals.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '35px', color: '#777' }}>
                                            Bu filtrede gösterilecek üyelik tahsilatı bulunmuyor.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApprovals.map(item => {
                                        const isPending = item.status === 'Pending';
                                        const currentAmt = customApprovalAmounts[item.id] !== undefined
                                            ? customApprovalAmounts[item.id]
                                            : item.amount;
                                        const split = approvalSplits[item.id] || { cash: '', pos: '' };

                                        return (
                                            <tr key={item.id} style={styles.tr}>
                                                <td style={styles.td}>{formatDate(item.createdAt)}</td>
                                                <td style={{ ...styles.td, fontWeight: '800', color: '#fff', fontSize: '0.95rem' }}>
                                                    {item.memberFullName}
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.catBadge}>{item.packageName}</span>
                                                    <div style={{ fontSize: '0.73rem', color: '#888', marginTop: '3px' }}>
                                                        {item.paymentType === 'NewRegistration' ? 'Yeni Üyelik Kaydı' :
                                                            item.paymentType === 'Renewal' ? 'Üyelik Uzatma' : 'Borç Tahsilatı'}
                                                    </div>
                                                </td>
                                                <td style={styles.td}>
                                                    {isPending || item.status === 'Rejected' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <input
                                                                type="number"
                                                                value={currentAmt}
                                                                onChange={e => {
                                                                    setCustomApprovalAmounts({ ...customApprovalAmounts, [item.id]: e.target.value });
                                                                    setApprovalSplits(prev => ({ ...prev, [item.id]: { cash: '', pos: '' } }));
                                                                }}
                                                                style={{ ...styles.input, width: '110px', fontWeight: '800', color: '#10b981' }}
                                                            />
                                                            <span style={{ color: '#10b981', fontWeight: '800' }}>₺</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1rem' }}>
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={styles.td}>
                                                    {item.status === 'Pending' && (
                                                        <span style={{ backgroundColor: '#78350f', color: '#fcd34d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                                                            ⏳ Onay Bekliyor
                                                        </span>
                                                    )}
                                                    {item.status === 'Approved' && (
                                                        <div>
                                                            <span style={
                                                                item.confirmedPaymentMethod === 'Split'
                                                                    ? { ...styles.posBadge, backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.45)' }
                                                                    : item.confirmedPaymentMethod === 'POS' ? styles.posBadge : styles.cashBadge
                                                            }>
                                                                ✅ Onaylandı ({
                                                                    item.confirmedPaymentMethod === 'Split' ? '🔀 Parçalı: Nakit + POS' :
                                                                        item.confirmedPaymentMethod === 'POS' ? '💳 POS / Kart' : '💵 Nakit'
                                                                })
                                                            </span>
                                                            {item.confirmedPaymentMethod === 'Split' && item.note && (
                                                                <div style={{ fontSize: '0.72rem', color: '#fcd34d', marginTop: '4px', fontWeight: '600' }}>
                                                                    {item.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.status === 'Rejected' && (
                                                        <span style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                                                            ❌ İptal Edildi
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={styles.td}>
                                                    {isPending || item.status === 'Rejected' ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {/* Üst Satır: Tek Tıkla Tam Onay & Yarıya Böl Butonları */}
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                                <button
                                                                    onClick={() => handleApproveMembership(item, 'Cash')}
                                                                    style={styles.approveCashBtn}
                                                                >
                                                                    <Banknote size={14} /> 💵 Tamamı Nakit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApproveMembership(item, 'POS')}
                                                                    style={styles.approvePosBtn}
                                                                >
                                                                    <CreditCard size={14} /> 💳 Tamamı POS
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApprovalHalfSplit(item)}
                                                                    style={{
                                                                        backgroundColor: 'rgba(245, 158, 11, 0.16)',
                                                                        color: '#fcd34d',
                                                                        border: '1px solid rgba(245, 158, 11, 0.45)',
                                                                        borderRadius: '8px',
                                                                        padding: '7px 10px',
                                                                        fontSize: '0.76rem',
                                                                        fontWeight: '800',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Tutarı %50 Nakit ve %50 POS olarak ikiye böler"
                                                                >
                                                                    ➗ Yarıya Böl
                                                                </button>
                                                                {isPending && (
                                                                    <button
                                                                        onClick={() => handleRejectMembership(item)}
                                                                        style={styles.rejectBtn}
                                                                        title="Reddet / İptal Et"
                                                                    >
                                                                        <XCircle size={15} />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Alt Satır: Parçalı (Nakit + POS Ayrı Ayrı) Tahsilat Kutuları */}
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '6px',
                                                                alignItems: 'center',
                                                                flexWrap: 'wrap',
                                                                backgroundColor: '#0c0c0c',
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #262626'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.73rem', color: '#6ee7b7', fontWeight: '700' }}>💵 Nakit:</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="Kalanı Doldur"
                                                                        value={split.cash}
                                                                        onFocus={() => {
                                                                            if (split.cash === '' && split.pos !== '') {
                                                                                const total = getApprovalTotal(item);
                                                                                const posVal = Math.max(0, parseFloat(split.pos || 0));
                                                                                const rem = Math.max(0, Math.round((total - posVal) * 100) / 100);
                                                                                setApprovalSplits(prev => ({ ...prev, [item.id]: { ...split, cash: String(rem) } }));
                                                                            }
                                                                        }}
                                                                        onChange={e => handleApprovalCashChange(item, e.target.value)}
                                                                        style={{ ...styles.input, width: '92px', padding: '5px 8px', fontSize: '0.8rem', borderColor: '#059669', color: '#6ee7b7', fontWeight: '800' }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.73rem', color: '#93c5fd', fontWeight: '700' }}>💳 POS:</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="Kalanı Doldur"
                                                                        value={split.pos}
                                                                        onFocus={() => {
                                                                            if (split.pos === '' && split.cash !== '') {
                                                                                const total = getApprovalTotal(item);
                                                                                const cashVal = Math.max(0, parseFloat(split.cash || 0));
                                                                                const rem = Math.max(0, Math.round((total - cashVal) * 100) / 100);
                                                                                setApprovalSplits(prev => ({ ...prev, [item.id]: { ...split, pos: String(rem) } }));
                                                                            }
                                                                        }}
                                                                        onChange={e => handleApprovalPosChange(item, e.target.value)}
                                                                        style={{ ...styles.input, width: '92px', padding: '5px 8px', fontSize: '0.8rem', borderColor: '#2563eb', color: '#93c5fd', fontWeight: '800' }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    disabled={parseFloat(split.cash || 0) <= 0 && parseFloat(split.pos || 0) <= 0}
                                                                    onClick={() => handleApproveMembership(item, 'Split')}
                                                                    style={{
                                                                        padding: '6px 10px',
                                                                        borderRadius: '7px',
                                                                        border: '1px solid #f59e0b',
                                                                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                                                        color: '#fff',
                                                                        fontWeight: '800',
                                                                        fontSize: '0.76rem',
                                                                        cursor: (parseFloat(split.cash || 0) > 0 || parseFloat(split.pos || 0) > 0) ? 'pointer' : 'not-allowed',
                                                                        opacity: (parseFloat(split.cash || 0) > 0 || parseFloat(split.pos || 0) > 0) ? 1 : 0.45
                                                                    }}
                                                                >
                                                                    ⚡ Parçalı Onayla
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.78rem', color: '#888' }}>
                                                                {item.processedAt ? formatDate(item.processedAt) : ''}
                                                            </span>
                                                            {item.status === 'Approved' && (
                                                                <button
                                                                    onClick={() => handleRejectMembership(item)}
                                                                    style={{ ...styles.rejectBtn, padding: '4px 8px', fontSize: '0.75rem' }}
                                                                    title="Onayı Geri Al ve Kasadan Çıkar"
                                                                >
                                                                    Geri Al
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 6: KASA VİRMAN & GÜN SONU Z-RAPORU (VARDİYA DEVRİ)  */}
            {/* ========================================================= */}
            {activeTab === 'cashops' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                        {/* SOL PANEL: Gün Sonu Kasa Kapatma & Z-Raporu */}
                        <div style={{ ...styles.card, border: '1px solid #f59e0b' }}>
                            <h3 style={styles.cardTitle}>
                                <Layers size={20} color="#f59e0b" /> Gün Sonu Kasa Kapatma & Z-Raporu (Vardiya Devri)
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px', marginBottom: '16px' }}>
                                Gün sonunda çekmecedeki fiziki nakiti sayıp girin. Sistem beklenen kasa ile karşılaştırarak <b>Kasa Açığı</b> veya <b>Kasa Fazlasını</b> otomatik hesaplar ve ertesi güne devreden taban kasayı ayarlar.
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '10px', border: '1px solid #262626' }}>
                                    <div style={{ fontSize: '0.73rem', color: '#888', fontWeight: '700' }}>💵 SİSTEMDE BEKLENEN NAKİT</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                                        {formatCurrency(dashboard.cashBalance)}
                                    </div>
                                </div>
                                <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '10px', border: '1px solid #262626' }}>
                                    <div style={{ fontSize: '0.73rem', color: '#888', fontWeight: '700' }}>💳 SİSTEMDEKİ POS / BANKA</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>
                                        {formatCurrency(dashboard.posBalance)}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCreateZReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={styles.label}>Çekmecede Sayılan Fiziki Nakit (₺) *</label>
                                        <button
                                            type="button"
                                            onClick={() => setZReportForm({ ...zReportForm, countedCash: String(Math.max(0, dashboard.cashBalance)) })}
                                            style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                                        >
                                            Beklenen Tutarı Doldur ({dashboard.cashBalance} ₺)
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder="Örn: 4250"
                                        value={zReportForm.countedCash}
                                        onChange={e => setZReportForm({ ...zReportForm, countedCash: e.target.value })}
                                        style={{ ...styles.input, fontWeight: '900', color: '#10b981', fontSize: '1rem' }}
                                    />
                                </div>

                                {zReportForm.countedCash !== '' && (() => {
                                    const counted = parseFloat(zReportForm.countedCash || 0);
                                    const diff = Math.round((counted - (dashboard.cashBalance || 0)) * 100) / 100;
                                    const handed = parseFloat(zReportForm.handedOverCash || 0);
                                    const nextFloat = Math.max(0, counted - handed);
                                    return (
                                        <div style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: diff === 0 ? 'rgba(16, 185, 129, 0.14)' : diff < 0 ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.16)',
                                            border: diff === 0 ? '1px solid #10b981' : diff < 0 ? '1px solid #ef4444' : '1px solid #f59e0b'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontSize: '0.86rem' }}>
                                                <span>Kasa Sayım Farkı:</span>
                                                <span style={{ color: diff === 0 ? '#10b981' : diff < 0 ? '#f87171' : '#fcd34d' }}>
                                                    {diff === 0 ? '✅ Tam Denk (0,00 ₺ Fark)' : diff < 0 ? `⚠️ KASA AÇIĞI: ${formatCurrency(diff)}` : `➕ KASA FAZLASI: +${formatCurrency(diff)}`}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#ccc', marginTop: '6px' }}>
                                                <span>Ertesi Güne Devreden Taban Kasa (Bozuk Para):</span>
                                                <b style={{ color: '#6ee7b7' }}>{formatCurrency(nextFloat)}</b>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label style={styles.label}>Kasadan Teslim Alınan / Bankaya Ayrılan Nakit (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Örn: 3500 (Kalan para ertesi güne bozuk para olarak devreder)"
                                        value={zReportForm.handedOverCash}
                                        onChange={e => setZReportForm({ ...zReportForm, handedOverCash: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#ccc', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={zReportForm.autoAdjustDiscrepancy}
                                        onChange={e => setZReportForm({ ...zReportForm, autoAdjustDiscrepancy: e.target.checked })}
                                    />
                                    Sayım farkı varsa (Açık / Fazla) Nakit Kasayı sayılan fiziki paraya otomatik eşitle
                                </label>

                                <div>
                                    <label style={styles.label}>Vardiya / Gün Sonu Notu (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Akşam vardiyası kapanışı"
                                        value={zReportForm.note}
                                        onChange={e => setZReportForm({ ...zReportForm, note: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>

                                <button type="submit" disabled={loading} style={{ ...styles.primaryBtn, backgroundColor: '#f59e0b', color: '#000', padding: '12px', fontSize: '0.92rem' }}>
                                    🔒 GÜN SONUNU KAPAT & Z-RAPORU KAYDET
                                </button>
                            </form>
                        </div>

                        {/* SAĞ PANEL: Kasalar Arası Virman / Bankaya Para Yatırma */}
                        <div style={{ ...styles.card, border: '1px solid #3b82f6' }}>
                            <h3 style={styles.cardTitle}>
                                <RefreshCw size={20} color="#3b82f6" /> Kasalar Arası Virman & Bankaya Para Yatırma
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px', marginBottom: '16px' }}>
                                Çekmecede biriken nakit parayı banka hesabına yatırdığınızda veya kasadan para çektiğinizde buradan işleyin.
                                <b> Bu işlem Kâr / Zarar grafiğini bozmaz</b>, sadece Nakit ve Banka kasalarının gerçek bakiyesini eşitler.
                            </div>

                            <form onSubmit={handleCreateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={styles.label}>Transfer / Virman Yönü *</label>
                                    <select
                                        value={transferForm.transferType}
                                        onChange={e => setTransferForm({ ...transferForm, transferType: e.target.value })}
                                        style={{ ...styles.input, fontWeight: '700', color: '#93c5fd' }}
                                    >
                                        <option value="CashToPos">💵 ➔ 💳 Nakit Kasadan Bankaya / POS Hesabına Para Yatır</option>
                                        <option value="PosToCash">💳 ➔ 💵 Bankadan Nakit Kasaya Para Çek</option>
                                        <option value="OwnerWithdrawalCash">💵 ➔ 👤 Nakit Kasadan İşletme Sahibi Çekimi</option>
                                        <option value="OwnerWithdrawalPos">💳 ➔ 👤 Banka / POS Hesabından İşletme Sahibi Çekimi</option>
                                        <option value="CashFloatAdd">👤 ➔ 💵 Nakit Kasaya Bozuk Para / Taban Kasa Ekle</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={styles.label}>Transfer Tutarı (₺) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        placeholder="Örn: 5000"
                                        value={transferForm.amount}
                                        onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                                        style={{ ...styles.input, fontSize: '1rem', fontWeight: '900', color: '#60a5fa' }}
                                    />
                                </div>

                                <div>
                                    <label style={styles.label}>Açıklama / Dekont Notu (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Ziraat Bankası ATM nakit yatırma..."
                                        value={transferForm.note}
                                        onChange={e => setTransferForm({ ...transferForm, note: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>

                                <button type="submit" disabled={loading} style={{ ...styles.primaryBtn, backgroundColor: '#3b82f6', color: '#fff', padding: '12px', fontSize: '0.92rem' }}>
                                    🔄 KASA VİRMAN / TRANSFER İŞLEMİNİ UYGULA
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ALT TABLO: Geçmiş Z-Raporları ve Virman Kayıtları */}
                    <div style={{ ...styles.card, marginTop: '20px' }}>
                        <h3 style={styles.cardTitle}>
                            <Receipt size={18} color="#f59e0b" /> Geçmiş Gün Sonu (Z-Raporu) ve Kasa Virman Hareketleri
                        </h3>
                        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Tarih</th>
                                        <th style={styles.th}>İşlem Tipi</th>
                                        <th style={styles.th}>Başlık</th>
                                        <th style={styles.th}>Kasa</th>
                                        <th style={styles.th}>Tutar</th>
                                        <th style={styles.th}>Detay Raporu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.filter(t => t.source === 'ZReport' || t.source === 'CashTransfer').length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '28px', color: '#777' }}>
                                                Henüz kaydedilmiş bir Z-Raporu veya kasa virman hareketi bulunmuyor.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions
                                            .filter(t => t.source === 'ZReport' || t.source === 'CashTransfer')
                                            .map(tx => (
                                                <tr key={tx.id} style={styles.tr}>
                                                    <td style={styles.td}>{formatDate(tx.transactionDate)}</td>
                                                    <td style={styles.td}>
                                                        <span style={styles.catBadge}>{tx.category}</span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '800', color: '#fff' }}>{tx.title}</td>
                                                    <td style={styles.td}>
                                                        <span style={tx.paymentMethod === 'POS' ? styles.posBadge : styles.cashBadge}>
                                                            {tx.paymentMethod === 'POS' ? '💳 Banka / POS' : '💵 Nakit Kasa'}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '900', color: '#fcd34d' }}>
                                                        {formatCurrency(tx.amount)}
                                                    </td>
                                                    <td style={{ ...styles.td, color: '#aaa', fontSize: '0.8rem' }}>{tx.description}</td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SEKME 7: KASA DEFTERİ (TÜM HAREKETLER)                    */}
            {/* ========================================================= */}
            {activeTab === 'ledger' && (
                <div style={styles.card}>
                    {/* Kasa Defteri Kalıcı Arşiv Bilgilendirmesi */}
                    <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.82rem',
                        color: '#93c5fd'
                    }}>
                        <Clock size={18} color="#60a5fa" style={{ flexShrink: 0 }} />
                        <div>
                            <strong>Kalıcı Kasa Defteri Arşivi:</strong> Tüm geçmiş aylara ve yıllara ait kasa hareketleri kalıcı olarak saklanır, ay değişimlerinde kayıtlar kaybolmaz. Hatalı veya mükerrer girilen bir işlem varsa silme butonuyla iptal edebilirsiniz.
                        </div>
                    </div>

                    {/* Tarih ve Dönem Filtreleme Çubuğu */}
                    <div style={{
                        backgroundColor: '#0d0d0d',
                        border: '1px solid #242424',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', fontWeight: '700', color: '#e5e7eb' }}>
                                <Filter size={15} color="#d90429" /> Tarih Filtreleme:
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'all', label: 'Tüm Zamanlar' },
                                    { id: 'today', label: 'Bugün' },
                                    { id: 'yesterday', label: 'Dün' },
                                    { id: '7d', label: 'Son 7 Gün' },
                                    { id: 'this_month', label: 'Bu Ay' },
                                    { id: 'last_month', label: 'Geçen Ay' },
                                    { id: 'single_date', label: '📅 Belirli Bir Gün Seç' },
                                    { id: 'custom', label: '📆 Tarih Aralığı Seç' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setTxDateRangeMode(m.id)}
                                        style={txDateRangeMode === m.id ? styles.periodBtnActive : styles.periodBtn}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(txDateRangeMode === 'single_date' || txDateRangeMode === 'custom') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid #1a1a1a' }}>
                                {txDateRangeMode === 'single_date' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Görüntülenecek Tarih:</span>
                                        <input
                                            type="date"
                                            value={txCustomDate}
                                            onChange={e => setTxCustomDate(e.target.value)}
                                            style={{ ...styles.input, width: '160px' }}
                                        />
                                    </div>
                                )}
                                {txDateRangeMode === 'custom' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Başlangıç:</span>
                                        <input
                                            type="date"
                                            value={txStartDate}
                                            onChange={e => setTxStartDate(e.target.value)}
                                            style={{ ...styles.input, width: '160px' }}
                                        />
                                        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Bitiş:</span>
                                        <input
                                            type="date"
                                            value={txEndDate}
                                            onChange={e => setTxEndDate(e.target.value)}
                                            style={{ ...styles.input, width: '160px' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Seçili Tarihe Özel Kasa & Finans Özeti */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>SEÇİLİ DÖNEM BRÜT CİRO</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                                {formatCurrency(ledgerStats.totalIncome)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>Toplam {ledgerStats.count} hareket</div>
                        </div>
                        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>SEÇİLİ DÖNEM GİDER</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>
                                {formatCurrency(ledgerStats.totalExpense)}
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '700' }}>POS ÜYELİK %20 KDV KESİNTİSİ</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>
                                -{formatCurrency(ledgerStats.posVat)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px' }}>POS Üyelik: {formatCurrency(ledgerStats.posGross)}</div>
                        </div>
                        <div style={{ backgroundColor: '#111', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800' }}>SEÇİLİ DÖNEM NET KÂR</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                                {formatCurrency(ledgerStats.netProfit)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>Ciro - Gider - POS %20 KDV</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                        <h3 style={styles.cardTitle}>
                            <Receipt size={18} color="#d90429" /> Resmi Kasa Defteri ({filteredTransactions.length} Kayıt)
                        </h3>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="İşlem veya açıklama ara..."
                                value={txSearch}
                                onChange={e => setTxSearch(e.target.value)}
                                style={{ ...styles.input, width: '210px' }}
                            />
                            <select value={txTypeFilter} onChange={e => setTxTypeFilter(e.target.value)} style={styles.input}>
                                <option value="All">Tüm Türler (Gelir + Gider + Virman)</option>
                                <option value="Income">🟢 Sadece Gelirler</option>
                                <option value="Expense">🔴 Sadece Giderler</option>
                                <option value="TransferIn">🔄 Virman Girişleri</option>
                                <option value="TransferOut">🔄 Virman Çıkışları</option>
                                <option value="ZReport">🔒 Gün Sonu Z-Raporları</option>
                            </select>
                            <select value={txMethodFilter} onChange={e => setTxMethodFilter(e.target.value)} style={styles.input}>
                                <option value="All">Nakit + POS Tümü</option>
                                <option value="Cash">💵 Sadece Nakit Kasa</option>
                                <option value="POS">💳 Sadece POS / Banka</option>
                            </select>
                            <button onClick={exportLedgerToCSV} style={styles.primaryBtn}>
                                <FileDown size={16} /> Excel / CSV İndir
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tarih</th>
                                    <th style={styles.th}>İşlem Türü</th>
                                    <th style={styles.th}>Kategori</th>
                                    <th style={styles.th}>Başlık / Kalem</th>
                                    <th style={styles.th}>Kasa / Ödeme</th>
                                    <th style={styles.th}>Tutar</th>
                                    <th style={styles.th}>Açıklama</th>
                                    <th style={{ ...styles.th, width: '60px' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(tx => {
                                    const isInc = tx.transactionType === 'Income' || tx.transactionType === 'TransferIn';
                                    const isZ = tx.transactionType === 'ZReport';
                                    const isTransfer = tx.transactionType === 'TransferIn' || tx.transactionType === 'TransferOut';
                                    const isMembershipPos = isInc && String(tx.paymentMethod).toUpperCase() === 'POS' && (
                                        tx.source === 'Membership' ||
                                        (tx.category && (tx.category.includes('Üyelik') || tx.category.includes('Spor'))) ||
                                        (tx.title && (tx.title.includes('Üyelik') || tx.title.includes('Paket')))
                                    );
                                    const posVatAmount = isMembershipPos ? Math.round(Number(tx.amount || 0) * 0.20 * 100) / 100 : 0;
                                    const posNetAmount = isMembershipPos ? Math.round(Number(tx.amount || 0) * 0.80 * 100) / 100 : Number(tx.amount || 0);

                                    return (
                                        <tr key={tx.id} style={styles.tr}>
                                            <td style={styles.td}>{formatDate(tx.transactionDate)}</td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '5px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '800',
                                                    backgroundColor: isZ
                                                        ? 'rgba(245, 158, 11, 0.18)'
                                                        : isTransfer
                                                            ? 'rgba(59, 130, 246, 0.18)'
                                                            : isInc ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: isZ ? '#fcd34d' : isTransfer ? '#60a5fa' : isInc ? '#10b981' : '#ef4444'
                                                }}>
                                                    {isZ
                                                        ? '🔒 Z-RAPORU'
                                                        : tx.transactionType === 'TransferIn'
                                                            ? '🔄 VİRMAN GİRİŞ'
                                                            : tx.transactionType === 'TransferOut'
                                                                ? '🔄 VİRMAN ÇIKIŞ'
                                                                : isInc ? '▲ GELİR' : '▼ GİDER'}
                                                </span>
                                            </td>
                                            <td style={styles.td}><span style={styles.catBadge}>{tx.category}</span></td>
                                            <td style={{ ...styles.td, fontWeight: '700', color: '#fff' }}>{tx.title}</td>
                                            <td style={styles.td}>
                                                <span style={tx.paymentMethod === 'POS' ? styles.posBadge : styles.cashBadge}>
                                                    {tx.paymentMethod === 'POS' ? '💳 POS / Kart' : '💵 Nakit'}
                                                </span>
                                            </td>
                                            <td style={{ ...styles.td }}>
                                                <div style={{
                                                    fontWeight: '900',
                                                    fontSize: '0.95rem',
                                                    color: isZ ? '#fcd34d' : isInc ? '#10b981' : '#ef4444'
                                                }}>
                                                    {isZ ? '' : isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </div>
                                                {isMembershipPos && (
                                                    <div style={{ fontSize: '0.7rem', marginTop: '3px', lineHeight: '1.3' }}>
                                                        <div style={{ color: '#f59e0b', fontWeight: '600' }}>KDV (%20): -{formatCurrency(posVatAmount)}</div>
                                                        <div style={{ color: '#34d399', fontWeight: '800' }}>Net: {formatCurrency(posNetAmount)}</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ ...styles.td, color: '#888', fontSize: '0.8rem' }}>{tx.description || '-'}</td>
                                            <td style={styles.td}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTransaction(tx.id)}
                                                    style={styles.iconBtnDanger}
                                                    title="Bu kasa hareketini sil (Hatalı giriş düzeltme)"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#080808',
        color: '#f1f1f1',
        padding: '24px 28px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
    },
    toast: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '14px 20px',
        borderRadius: '10px',
        border: '1px solid',
        color: '#fff',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
    },
    topHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #222'
    },
    pageTitle: {
        margin: 0,
        fontSize: '1.35rem',
        fontWeight: '900',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#fff'
    },
    backBtn: {
        backgroundColor: '#161616',
        color: '#ddd',
        border: '1px solid #333',
        padding: '9px 14px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    refreshBtn: {
        backgroundColor: '#161616',
        color: '#ccc',
        border: '1px solid #333',
        padding: '9px 14px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    alertBadgePending: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid #f59e0b',
        color: '#fcd34d',
        padding: '8px 14px',
        borderRadius: '8px',
        fontWeight: '800',
        fontSize: '0.82rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    alertBadgeStock: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid #ef4444',
        color: '#fca5a5',
        padding: '8px 14px',
        borderRadius: '8px',
        fontWeight: '800',
        fontSize: '0.82rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    tabContainer: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '22px'
    },
    tabBtn: {
        backgroundColor: '#121212',
        color: '#aaa',
        border: '1px solid #262626',
        padding: '11px 18px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    },
    activeTabBtn: {
        backgroundColor: '#d90429',
        color: '#fff',
        border: '1px solid #ef233c',
        padding: '11px 18px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '800',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 16px rgba(217, 4, 41, 0.35)'
    },
    badgeCount: {
        backgroundColor: '#fff',
        color: '#d90429',
        borderRadius: '99px',
        padding: '1px 7px',
        fontSize: '0.75rem',
        fontWeight: '900'
    },
    filterBar: {
        backgroundColor: '#121212',
        border: '1px solid #222',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px'
    },
    periodBtn: {
        backgroundColor: '#1a1a1a',
        color: '#bbb',
        border: '1px solid #2e2e2e',
        padding: '7px 14px',
        borderRadius: '7px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.83rem'
    },
    periodBtnActive: {
        backgroundColor: '#d90429',
        color: '#fff',
        border: '1px solid #d90429',
        padding: '7px 14px',
        borderRadius: '7px',
        cursor: 'pointer',
        fontWeight: '800',
        fontSize: '0.83rem'
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
    },
    kpiCard: {
        backgroundColor: '#121212',
        border: '1px solid #222',
        borderRadius: '12px',
        padding: '18px'
    },
    kpiHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    kpiLabel: {
        fontSize: '0.78rem',
        fontWeight: '800',
        color: '#999',
        letterSpacing: '0.5px'
    },
    kpiValue: {
        fontSize: '1.55rem',
        fontWeight: '900',
        marginBottom: '6px'
    },
    kpiSub: {
        fontSize: '0.76rem',
        color: '#777'
    },
    card: {
        backgroundColor: '#121212',
        border: '1px solid #222',
        borderRadius: '12px',
        padding: '20px'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '16px'
    },
    cardTitle: {
        margin: 0,
        fontSize: '1.02rem',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff'
    },
    chartScrollWrapper: {
        overflowX: 'auto',
        paddingBottom: '8px'
    },
    barChartContainer: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '14px',
        minHeight: '210px',
        padding: '16px 8px 4px 8px',
        borderBottom: '1px solid #262626'
    },
    barColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '42px'
    },
    barsArea: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
        height: '175px'
    },
    barLabel: {
        marginTop: '8px',
        fontSize: '0.7rem',
        color: '#888',
        whiteSpace: 'nowrap'
    },
    threeColGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '18px',
        marginTop: '20px'
    },
    progressTrack: {
        width: '100%',
        height: '8px',
        backgroundColor: '#1f1f1f',
        borderRadius: '99px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: '99px'
    },
    emptyText: {
        padding: '25px',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.88rem'
    },
    posLayout: {
        display: 'grid',
        gridTemplateColumns: '1fr 390px',
        gap: '20px',
        alignItems: 'start'
    },
    posProductsColumn: {
        minWidth: 0
    },
    posCartColumn: {
        minWidth: 0
    },
    posGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
        gap: '12px'
    },
    posProductCard: {
        backgroundColor: '#181818',
        border: '1px solid #262626',
        borderRadius: '10px',
        padding: '14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.12s ease, border-color 0.12s ease'
    },
    catBadge: {
        backgroundColor: '#222',
        color: '#bbb',
        padding: '3px 8px',
        borderRadius: '5px',
        fontSize: '0.73rem',
        fontWeight: '700'
    },
    posAddBadge: {
        backgroundColor: 'rgba(217, 4, 41, 0.15)',
        color: '#ef233c',
        border: '1px solid #d90429',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.78rem',
        fontWeight: '800'
    },
    cartItemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#181818',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #262626'
    },
    qtyBtn: {
        backgroundColor: '#262626',
        color: '#fff',
        border: '1px solid #3a3a3a',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '800'
    },
    cartTotalBox: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#181818',
        padding: '14px 16px',
        borderRadius: '10px',
        border: '1px solid #2e2e2e'
    },
    checkoutCashBtn: {
        backgroundColor: '#10b981',
        color: '#052e16',
        border: 'none',
        padding: '14px',
        borderRadius: '10px',
        fontWeight: '900',
        fontSize: '0.95rem',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
    },
    checkoutPosBtn: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        padding: '14px',
        borderRadius: '10px',
        fontWeight: '900',
        fontSize: '0.95rem',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginTop: '14px'
    },
    label: {
        display: 'block',
        fontSize: '0.78rem',
        color: '#aaa',
        fontWeight: '700',
        marginBottom: '6px'
    },
    input: {
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        color: '#fff',
        padding: '9px 12px',
        borderRadius: '8px',
        fontSize: '0.88rem',
        width: '100%',
        boxSizing: 'border-box'
    },
    primaryBtn: {
        backgroundColor: '#10b981',
        color: '#052e16',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '8px',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
    },
    secondaryBtn: {
        backgroundColor: '#262626',
        color: '#ddd',
        border: '1px solid #444',
        padding: '10px 16px',
        borderRadius: '8px',
        fontWeight: '700',
        cursor: 'pointer'
    },
    dangerBtn: {
        backgroundColor: '#d90429',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '8px',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.87rem'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '1px solid #282828',
        color: '#888',
        fontWeight: '800',
        fontSize: '0.76rem',
        textTransform: 'uppercase'
    },
    tr: {
        borderBottom: '1px solid #1d1d1d'
    },
    td: {
        padding: '12px',
        verticalAlign: 'middle'
    },
    cashBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        color: '#4ade80',
        border: '1px solid rgba(34, 197, 94, 0.35)',
        padding: '4px 9px',
        borderRadius: '6px',
        fontSize: '0.76rem',
        fontWeight: '700'
    },
    posBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        color: '#60a5fa',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        padding: '4px 9px',
        borderRadius: '6px',
        fontSize: '0.76rem',
        fontWeight: '700'
    },
    stockQuickBtn: {
        backgroundColor: '#222',
        color: '#ddd',
        border: '1px solid #383838',
        padding: '4px 8px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: '700'
    },
    iconBtnEdit: {
        backgroundColor: '#1e293b',
        color: '#60a5fa',
        border: '1px solid #334155',
        padding: '6px',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    iconBtnDanger: {
        backgroundColor: '#2a1215',
        color: '#f87171',
        border: '1px solid #451a1f',
        padding: '6px',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    approveCashBtn: {
        backgroundColor: '#10b981',
        color: '#052e16',
        border: 'none',
        padding: '7px 12px',
        borderRadius: '7px',
        fontWeight: '800',
        fontSize: '0.8rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    approvePosBtn: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        padding: '7px 12px',
        borderRadius: '7px',
        fontWeight: '800',
        fontSize: '0.8rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    rejectBtn: {
        backgroundColor: '#2a1215',
        color: '#f87171',
        border: '1px solid #ef4444',
        padding: '7px 10px',
        borderRadius: '7px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    }
};

export default FinanceManager;
