/**
 * FILE: Home.jsx
 * MÔ TẢ: Trang Chủ (Landing Page) hiển thị cho người dùng chưa đăng nhập.
 * Giới thiệu về hệ thống bãi đỗ xe thông minh, các bảng giá, tính năng nổi bật và liên kết đăng ký/đăng nhập.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import guestApi from '../apis/guestApi'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import { Users, Car, Bike, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, getRedirectPath, loading } = useAuth()

  const defaultStats = [
    { label: t('home.stats.totalCapacity'), value: '1,200', unit: t('home.stats.unitSpots'), icon: <Users size={20} className="text-slate-400" /> },
    { label: t('home.stats.occupied'), value: '485', unit: t('home.stats.unitSpots'), icon: <Car size={20} className="text-slate-400" /> },
    { label: t('home.stats.available'), value: '612', unit: t('home.stats.unitSpots'), icon: <Car size={20} className="text-emerald-500" /> },
    { label: t('home.stats.todayCheckIns'), value: '105', unit: t('home.stats.unitTurns'), icon: <CheckCircle2 size={20} className="text-slate-400" /> }
  ]

  const defaultVehicles = [
    { title: t('home.vehicles.names.motorbike'), desc: t('home.vehicles.loading'), icon: <Bike size={24} />, progress: 0 },
    { title: t('home.vehicles.names.car'), desc: t('home.vehicles.loading'), icon: <Car size={24} />, progress: 0 },
    { title: t('home.vehicles.names.bicycle'), desc: t('home.vehicles.loading'), icon: <Bike size={24} />, progress: 0 }
  ]

  const pricingRows = [
    { vehicle: t('home.pricing.rows.bicycle'), firstHour: '2,000₫', nextHour: '1,000₫/h', overnight: '20,000₫', monthly: '50,000₫' },
    { vehicle: t('home.pricing.rows.motorbike'), firstHour: '5,000₫', nextHour: '2,000₫/h', overnight: '50,000₫', monthly: '150,000₫' },
    { vehicle: t('home.pricing.rows.car'), firstHour: '20,000₫', nextHour: '10,000₫/h', overnight: '150,000₫', monthly: '1,200,000₫' }
  ]

  const pricingBenefits = [
    t('home.pricing.benefits.flexiblePayment'),
    t('home.pricing.benefits.yearlyDiscount'),
    t('home.pricing.benefits.vatInvoice')
  ]

  const guidelines = [
    t('home.guidelines.items.speedLimit'),
    t('home.guidelines.items.parkingLines'),
    t('home.guidelines.items.turnOffEngine'),
    t('home.guidelines.items.payOnTime'),
    t('home.guidelines.items.noSmoking')
  ]

  const [statsData, setStatsData] = useState(defaultStats)
  const [vehiclesData, setVehiclesData] = useState(defaultVehicles)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await guestApi.getHomeStats()
        if (res.success && res.data) {
          const { overview, vehicles } = res.data

          setStatsData([
            { label: t('home.stats.totalCapacity'), value: overview.totalCapacity.toLocaleString(), unit: t('home.stats.unitSpots'), icon: <Users size={20} className="text-slate-400" /> },
            { label: t('home.stats.occupied'), value: overview.occupied.toLocaleString(), unit: t('home.stats.unitSpot'), icon: <Car size={20} className="text-slate-400" /> },
            { label: t('home.stats.available'), value: overview.available.toLocaleString(), unit: t('home.stats.unitSpot'), icon: <Car size={20} className="text-emerald-500" /> },
            { label: t('home.stats.todayCheckIns'), value: overview.todayCheckIns.toLocaleString(), unit: t('home.stats.unitTurns'), icon: <CheckCircle2 size={20} className="text-slate-400" /> }
          ])

          if (vehicles && vehicles.length > 0) {
            setVehiclesData(vehicles.map(v => {
              let icon = <Car size={24} />
              if (v.code === 'MOTORBIKE') icon = <Bike size={24} />
              if (v.code === 'BICYCLE') icon = <Bike size={24} />

              return {
                title: v.name,
                desc: t('home.vehicles.availableOfTotal', { available: v.available, total: v.total }),
                icon,
                progress: v.occupancyRate
              }
            }))
          }
        }
      } catch (err) {
        console.error('Error fetching home stats:', err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="flex flex-col gap-24 py-16 relative bg-[#fbf9f1] dark:bg-slate-900 min-h-screen selection:bg-blue-200">
      {/* Language switcher — góc trên-phải */}
      <div className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full shadow-sm p-1">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <section className="text-center pt-16 lg:pt-24 relative">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[500px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-[100px] rounded-full mix-blend-multiply opacity-50 dark:opacity-20" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto text-slate-900 dark:text-white">
            {t('home.hero.titleLine1')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {t('home.hero.titleLine2')}
            </span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-14">
            {loading ? null : isAuthenticated ? (
              <div className="flex flex-col items-center gap-6">
                <p className="text-lg text-slate-700 dark:text-slate-300 font-medium w-full text-center">
                  {t('home.hero.greeting', { name: user?.fullName })}
                </p>
                <button
                  onClick={() => navigate(getRedirectPath(user?.roleName))}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-[0_8px_30px_rgb(37,99,235,0.24)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                >
                  {t('home.hero.goToDashboard')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-[0_8px_30px_rgb(37,99,235,0.24)] transition-all hover:scale-105 active:scale-95"
                >
                  {t('home.hero.login')}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all hover:scale-105 active:scale-95"
                >
                  {t('home.hero.register')}
                </button>
                <button
                  onClick={() => navigate('/parking-info')}
                  className="px-8 py-3.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('home.hero.viewProcess')}
                </button>
                <button
                  onClick={() => navigate('/guest/tracking')}
                  className="px-8 py-3.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
                >
                  {t('home.hero.trackSession')}
                </button>
              </>
            )}
          </div>

          {/* Avatars */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover" src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
              <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover" src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
              <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover" src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium" dangerouslySetInnerHTML={{ __html: t('home.hero.dailyEntries', { count: '<strong class="text-slate-800 dark:text-slate-200">2,500+</strong>' }) }} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-slate-200/40 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
              {t('home.stats.title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t('home.stats.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    {stat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                    {stat.unit}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles Supported */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
              {t('home.vehicles.title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t('home.vehicles.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vehiclesData.map((vehicle, idx) => (
              <div
                key={idx}
                className="relative bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute top-6 right-6 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg">
                  {t('home.vehicles.allowedBadge')}
                </div>

                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-8 border border-slate-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                  {vehicle.icon}
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {vehicle.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
                  {vehicle.desc}
                </p>

                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${vehicle.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 border-y border-slate-200/40 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-4">
                {t('home.pricing.title')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                {t('home.pricing.subtitle')}
              </p>
              <ul className="space-y-4">
                {pricingBenefits.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                      <tr>
                        <th className="px-6 py-5 font-bold text-slate-500 dark:text-slate-400">{t('home.pricing.table.vehicleType')}</th>
                        <th className="px-6 py-5 font-bold text-slate-500 dark:text-slate-400">{t('home.pricing.table.firstHour')}</th>
                        <th className="px-6 py-5 font-bold text-slate-500 dark:text-slate-400">{t('home.pricing.table.nextHour')}</th>
                        <th className="px-6 py-5 font-bold text-slate-500 dark:text-slate-400">{t('home.pricing.table.overnight')}</th>
                        <th className="px-6 py-5 font-bold text-slate-500 dark:text-slate-400 text-right">{t('home.pricing.table.monthly')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {pricingRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{row.vehicle}</td>
                          <td className="px-6 py-5 font-medium text-slate-600 dark:text-slate-400">{row.firstHour}</td>
                          <td className="px-6 py-5 font-medium text-slate-600 dark:text-slate-400">{row.nextHour}</td>
                          <td className="px-6 py-5 font-medium text-slate-600 dark:text-slate-400">{row.overnight}</td>
                          <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400 text-right">
                            {row.monthly}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-5 pl-2">
                {t('home.pricing.footnote')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section className="mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[2.5rem] shadow-[0_20px_40px_rgb(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            
            <div className="md:w-1/3 p-12 flex flex-col justify-center relative z-10 border-r border-slate-800">
              <ShieldCheck className="w-14 h-14 mb-8 text-blue-400" />
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
                {t('home.guidelines.title')}
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                {t('home.guidelines.intro')}
              </p>
              <div className="bg-blue-900/40 rounded-2xl p-5 flex items-start gap-4 border border-blue-500/20">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">!</div>
                <p className="text-xs font-semibold text-blue-200 leading-relaxed mt-0.5">
                  {t('home.guidelines.cameraNotice')}
                </p>
              </div>
            </div>

            <div className="md:w-2/3 p-12 md:p-16 relative z-10 bg-slate-800/50 backdrop-blur-md">
              <ul className="space-y-8">
                {guidelines.map((item, idx) => (
                  <li key={idx} className="flex gap-5 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-inner">
                      {idx + 1}
                    </div>
                    <p className="text-base text-slate-300 font-medium leading-relaxed">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home