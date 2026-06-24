import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCcw,
  User,
  Wallet,
  XCircle
} from 'lucide-react'
import driverApi from '../../apis/driverApi'

const getValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) {
      return obj[key]
    }
  }

  return ''
}

const formatDate = (value, fallback) => {
  if (!value) return fallback

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('vi-VN')
}

const getInitials = (name) => {
  if (!name) return 'U'

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const InfoItem = ({ icon, label, value, fallback }) => {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-gray-50/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {icon}
        <span>{label}</span>
      </div>

      <div className="text-sm font-bold text-gray-900 dark:text-white">
        {value || fallback}
      </div>
    </div>
  )
}

const DriverProfile = () => {
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await driverApi.getProfile()
      const data = response?.data || response

      setProfile(data || null)
    } catch (error) {
      console.error('Load driver profile failed:', error)

      const message =
        error.response?.data?.message ||
        t('driver.profile.loadError')

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const profileData = useMemo(() => {
    const fullName = getValue(profile, 'FullName', 'fullName') || t('driver.profile.defaultUser')
    const email = getValue(profile, 'Email', 'email')
    const phoneNumber = getValue(profile, 'PhoneNumber', 'phoneNumber')
    const dateOfBirth = getValue(profile, 'DateOfBirth', 'dateOfBirth')
    const avatarUrl = getValue(profile, 'AvatarUrl', 'avatarUrl')
    const isEmailVerified = Boolean(
      getValue(profile, 'IsEmailVerified', 'isEmailVerified')
    )
    const accountBalance = getValue(profile, 'AccountBalance', 'accountBalance') || 0

    return {
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      avatarUrl,
      isEmailVerified,
      accountBalance
    }
  }, [profile, t])

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 shadow-sm">
          {t('driver.profile.loading')}
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 dark:bg-red-900/20 p-8 text-center">
        <p className="font-bold text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={loadProfile}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCcw size={16} />
          {t('driver.profile.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {t('driver.profile.title')}
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('driver.profile.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <RefreshCcw size={16} />
          {t('driver.profile.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-orange-50 text-3xl font-black text-orange-600">
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={profileData.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(profileData.fullName)
            )}
          </div>

          <h2 className="mt-4 text-xl font-black text-gray-900 dark:text-white">
            {profileData.fullName}
          </h2>

          <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t('driver.profile.accountTag')}
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 dark:bg-slate-900/50 p-4 text-left">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <Mail size={16} className="text-gray-400" />
              <span className="font-semibold">
                {profileData.email || t('driver.profile.notUpdated')}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <Phone size={16} className="text-gray-400" />
              <span className="font-semibold">
                {profileData.phoneNumber || t('driver.profile.notUpdated')}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-6 border-b border-gray-100 dark:border-slate-700/50 pb-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {t('driver.profile.basicInfoTitle')}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('driver.profile.basicInfoSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem
              icon={<User size={16} />}
              label={t('driver.profile.fullName')}
              value={profileData.fullName}
              fallback={t('driver.profile.notUpdated')}
            />

            <InfoItem
              icon={<Phone size={16} />}
              label={t('driver.profile.phone')}
              value={profileData.phoneNumber}
              fallback={t('driver.profile.notUpdated')}
            />

            <InfoItem
              icon={<Mail size={16} />}
              label={t('driver.profile.email')}
              value={profileData.email}
              fallback={t('driver.profile.notUpdated')}
            />

            <InfoItem
              icon={<Calendar size={16} />}
              label={t('driver.profile.dob')}
              value={formatDate(profileData.dateOfBirth, t('driver.profile.notUpdated'))}
              fallback={t('driver.profile.notUpdated')}
            />

            <InfoItem
              icon={<Wallet size={16} />}
              label={t('driver.profile.accountBalance', 'Số dư tài khoản')}
              value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profileData.accountBalance)}
              fallback="0 ₫"
            />
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 dark:border-slate-700/50 bg-gray-50/70 p-4">
            <div className="flex items-center gap-3">
              {profileData.isEmailVerified ? (
                <CheckCircle2 size={22} className="text-emerald-500" />
              ) : (
                <XCircle size={22} className="text-orange-500" />
              )}

              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('driver.profile.emailStatus')}
                </p>

                <p
                  className={`text-sm font-semibold ${
                    profileData.isEmailVerified
                      ? 'text-emerald-600'
                      : 'text-orange-600'
                  }`}
                >
                  {profileData.isEmailVerified
                    ? t('driver.profile.emailVerified')
                    : t('driver.profile.emailNotVerified')}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            {t('driver.profile.settingsHint')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DriverProfile