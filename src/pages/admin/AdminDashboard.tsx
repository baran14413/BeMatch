import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Activity,
    ArrowUpRight, ArrowDownRight, Globe, ShieldOff, Heart
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../components/Admin.css';
import { lazy, Suspense } from 'react';
const GlobeGL = lazy(() => import('react-globe.gl'));

// Initial Data structures
const initialRevenueData = [
    { name: '00:00', gold: 0, premium: 0, amt: 0 },
    { name: '04:00', gold: 0, premium: 0, amt: 0 },
    { name: '08:00', gold: 0, premium: 0, amt: 0 },
    { name: '12:00', gold: 0, premium: 0, amt: 0 },
    { name: '16:00', gold: 0, premium: 0, amt: 0 },
    { name: '20:00', gold: 0, premium: 0, amt: 0 },
    { name: '23:59', gold: 0, premium: 0, amt: 0 },
];

const initialActivityData = [
    { day: 'Pzt', active: 0, new: 0 },
    { day: 'Sal', active: 0, new: 0 },
    { day: 'Çar', active: 0, new: 0 },
    { day: 'Per', active: 0, new: 0 },
    { day: 'Cum', active: 0, new: 0 },
    { day: 'Cmt', active: 0, new: 0 },
    { day: 'Paz', active: 0, new: 0 },
];

interface HeatmapPoint {
    lat: number;
    lng: number;
    city: string;
    weight: number;
    status: 'online' | 'offline';
}

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
}

const StatCard = ({ title, value, change, isPositive, icon: Icon, color, subtitle }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card"
        style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
    >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', backgroundColor: color, filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 2 }}>
            <div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--god-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>{title}</h3>
                <p style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--god-text)', margin: 0 }}>{value}</p>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} />
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 2 }}>
            {change && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPositive ? 'var(--god-green)' : 'var(--god-red)' }}>
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {change}
                </div>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)', fontWeight: 'bold' }}>{subtitle || 'Gelişim'}</span>
        </div>
    </motion.div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        totalMatches: 0,
        bannedUsers: 0
    });

    const [revenueData, setRevenueData] = useState(initialRevenueData);
    const [activityData, setActivityData] = useState(initialActivityData);
    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listeners for dashboard stats
        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            let total = 0;
            let online = 0;
            let banned = 0;

            // Re-initialize Arrays so they don't infinitely accumulate on snapshot refresh
            const daysMap = { 0: 'Paz', 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt' };
            const newActivity = [
                { day: 'Pzt', active: 0, new: 0 }, { day: 'Sal', active: 0, new: 0 },
                { day: 'Çar', active: 0, new: 0 }, { day: 'Per', active: 0, new: 0 },
                { day: 'Cum', active: 0, new: 0 }, { day: 'Cmt', active: 0, new: 0 },
                { day: 'Paz', active: 0, new: 0 },
            ];

            const newRevenueMap = new Map();
            initialRevenueData.forEach(d => newRevenueMap.set(d.name, { ...d, gold: 0, premium: 0 }));

            const locations: HeatmapPoint[] = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.role !== 'admin') {
                    total++;
                    if (data.isOnline) online++;
                    if (data.isBanned) banned++;

                    // User Acquisition Aggregation via createdAt
                    if (data.createdAt) {
                        const date = new Date(data.createdAt);
                        const dayName = daysMap[date.getDay() as keyof typeof daysMap];
                        const dayObj = newActivity.find(d => d.day === dayName);
                        if (dayObj) {
                            dayObj.new += 1;
                            if (data.isOnline) dayObj.active += 1;
                        }
                    } else {
                        // If users don't have createdAt, throw them into today as a fallback
                        const todayName = daysMap[new Date().getDay() as keyof typeof daysMap];
                        const dObj = newActivity.find(d => d.day === todayName);
                        if (dObj) {
                            dObj.new += 1;
                            if (data.isOnline) dObj.active += 1;
                        }
                    }

                    // Heatmap Aggregation - Requires user to have locationCoords
                    if (data.locationCoords && data.locationCoords.lat && data.locationCoords.lng) {
                        locations.push({
                            lat: data.locationCoords.lat + (Math.random() - 0.5) * 5, // add slight blur for privacy
                            lng: data.locationCoords.lng + (Math.random() - 0.5) * 5,
                            weight: data.isOnline ? 1 : 0.2, // Online users glow brighter
                            status: data.isOnline ? 'online' : 'offline',
                            city: data.locationCity || 'Bilinmeyen Lokasyon'
                        });
                    }
                }
            });

            // Very simple Mock Revenue Distribution logic just to make the chart alive for now
            // Distribution is just aesthetic using the totals
            if (total > 0) {
                const currentHour = new Date().getHours();
                // Map current hour to one of our buckets
                let bucket = '12:00';
                if (currentHour < 4) bucket = '00:00';
                else if (currentHour < 8) bucket = '04:00';
                else if (currentHour < 12) bucket = '08:00';
                else if (currentHour < 16) bucket = '12:00';
                else if (currentHour < 20) bucket = '16:00';
                else if (currentHour < 23) bucket = '20:00';
                else bucket = '23:59';

                const goldC = Math.floor(total * 0.15); // Assume 15% are gold
                const premC = Math.floor(total * 0.35); // Assume 35% are premium
                newRevenueMap.set(bucket, { name: bucket, gold: goldC * 19.99, premium: premC * 9.99, amt: 0 });
            }

            setStats(prev => ({ ...prev, totalUsers: total, onlineUsers: online, bannedUsers: banned }));
            setActivityData(newActivity);
            setRevenueData(Array.from(newRevenueMap.values()));
            setHeatmapData(locations);
            setLoading(false);
        });

        const unsubMatches = onSnapshot(collection(db, 'matches'), (snapshot) => {
            setStats(prev => ({ ...prev, totalMatches: snapshot.size }));
        });

        return () => {
            unsubUsers();
            unsubMatches();
        };
    }, []);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">God's Eye Dashboard</h1>
                    <p className="admin-page-subtitle">BeMatch ağının gerçek zamanlı küresel gözetimi.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <StatCard title="Canlı Çevrimiçi" value={loading ? "..." : stats.onlineUsers} subtitle="Şu an aktif" isPositive={true} icon={Activity} color="var(--god-green)" />
                <StatCard title="Toplam Kullanıcı" value={loading ? "..." : stats.totalUsers} subtitle="Kayıtlı üyeler" isPositive={true} icon={Users} color="var(--god-blue)" />
                <StatCard title="Toplam Eşleşme" value={loading ? "..." : stats.totalMatches} subtitle="Başarılı bağlantılar" isPositive={true} icon={Heart} color="var(--god-gold)" />
                <StatCard title="Yasaklı Kullanıcı" value={loading ? "..." : stats.bannedUsers} subtitle="Sistemden uzaklaştırılanlar" isPositive={false} icon={ShieldOff} color="var(--god-red)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Revenue Velocity */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-card" style={{ padding: '24px', gridColumn: '1 / span 2', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>Sistemdeki Aktif Abonelikler</h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--god-text-muted)' }}>Gold & Premium Canlı Tahmini (Bugün)</p>
                        </div>
                        <span className="admin-badge admin-badge-success">CANLI TAHMİN</span>
                    </div>
                    <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} />
                                <Area type="monotone" dataKey="gold" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorGold)" name="Gold" />
                                <Area type="monotone" dataKey="premium" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPremium)" name="Premium" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* User Acquisition Bar Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>Kullanıcı Edinimi</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--god-text-muted)' }}>Aktif Kullanıcı vs Yeni Kayıtlar (Canlı)</p>
                    </div>
                    <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#27272a', opacity: 0.4 }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="active" name="Aktif Kullanıcı" fill="var(--god-blue)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="new" name="Yeni Kayıt" fill="var(--god-green)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Global Heatmap */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Globe size={20} color="var(--god-blue)" /> Küresel Isı Haritası
                        </h3>
                        {stats.onlineUsers > 0 && <span className="admin-badge admin-badge-danger">CANLI: {stats.onlineUsers}</span>}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '12px', border: '1px solid var(--god-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
                        <Suspense fallback={<p style={{ color: 'var(--god-text-muted)' }}>Harita Yükleniyor...</p>}>
                            <GlobeGL
                                width={500}
                                height={350}
                                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                                pointsData={heatmapData}
                                pointAltitude={(d: object) => (d as HeatmapPoint).weight * 0.1}
                                pointColor={(d: object) => (d as HeatmapPoint).status === 'online' ? '#10b981' : '#ef4444'}
                                pointRadius={(d: object) => (d as HeatmapPoint).weight * 0.5}
                                pointLabel={(d: object) => {
                                    const point = d as HeatmapPoint;
                                    return `
                                        <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 8px; border: 1px solid var(--god-border);">
                                            <b style="color: ${point.status === 'online' ? '#10b981' : '#ef4444'}">${point.status === 'online' ? '🟢 Aktif' : '🔴 Çevrimdışı'}</b><br/>
                                            <span style="color: #fff; font-size: 12px;">${point.city}</span>
                                        </div>
                                    `;
                                }}
                                backgroundColor="rgba(0,0,0,0)"
                            />
                        </Suspense>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
