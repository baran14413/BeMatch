import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ChevronLeft, ChevronRight, Plus, X, Check, Camera, MapPin, Navigation, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import './Register.css'

const TOTAL_STEPS = 10

const INTERESTS = [
    'music', 'sports', 'travel', 'books', 'gaming',
    'movies', 'photo', 'food', 'art', 'tech',
    'yoga', 'fitness', 'theater', 'nature', 'animals',
    'coffee', 'instrument', 'dance', 'writing', 'science'
]

const LOOKING_FOR = [
    { id: 'longterm', icon: '💕' },
    { id: 'flexible', icon: '🌊' },
    { id: 'meet', icon: '👋' },
    { id: 'unsure', icon: '🤔' },
]

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 80 : -80,
        opacity: 0,
    }),
}

export default function Register() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { register: firebaseRegister } = useAuth()
    const [step, setStep] = useState(1)
    const [direction, setDirection] = useState(1)
    const [authError, setAuthError] = useState('')
    const [authLoading, setAuthLoading] = useState(false)

    // Step 1
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [bio, setBio] = useState('')

    // Step 2
    const [birthDay, setBirthDay] = useState('')
    const [birthMonth, setBirthMonth] = useState('')
    const [birthYear, setBirthYear] = useState('')

    // Step 3
    const [gender, setGender] = useState('')

    // Step 4
    const [lookingFor, setLookingFor] = useState('')

    // Step 5
    const [interests, setInterests] = useState<string[]>([])

    // Step 6
    const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null])

    // Step 7 - Location
    const [locationCity, setLocationCity] = useState('')
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState('')
    const [countryCode, setCountryCode] = useState('')

    // Step 8 - Distance
    const [maxDistance, setMaxDistance] = useState(25)

    // Step 9
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Step 10
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [privacyAccepted, setPrivacyAccepted] = useState(false)

    const progress = (step / TOTAL_STEPS) * 100

    const goNext = () => {
        if (step < TOTAL_STEPS) {
            setDirection(1)
            setStep(step + 1)
        }
    }

    const goBack = () => {
        if (step > 1) {
            setDirection(-1)
            setStep(step - 1)
        }
    }

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        )
    }

    const compressImage = (file: File, maxSize: number = 800, quality: number = 0.6): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let { width, height } = img

                    // Resize if too large
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize
                            width = maxSize
                        } else {
                            width = (width / height) * maxSize
                            height = maxSize
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')!
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', quality))
                }
                img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
        })
    }

    const handlePhotoUpload = (index: number) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const compressed = await compressImage(file)
                const newPhotos = [...photos]
                newPhotos[index] = compressed
                setPhotos(newPhotos)
            }
        }
        input.click()
    }

    const removePhoto = (index: number) => {
        const newPhotos = [...photos]
        newPhotos[index] = null
        setPhotos(newPhotos)
    }

    // Password strength
    const getPasswordStrength = () => {
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++
        return score
    }

    const strengthLabels = ['', t('register.pw_weak'), t('register.pw_med'), t('register.pw_strong'), t('register.pw_vstrong')]
    const strengthClasses = ['', 'weak', 'medium', 'strong', 'very-strong']
    const passwordStrength = getPasswordStrength()

    // Email validation — must have valid domain
    const validEmailDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'yandex.com', 'mail.com', 'protonmail.com', 'live.com', 'msn.com', 'aol.com']
    const isEmailValid = (e: string) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!regex.test(e)) return false
        const domain = e.split('@')[1]?.toLowerCase()
        return validEmailDomains.includes(domain)
    }
    const emailError = email.length > 0 && !isEmailValid(email)
        ? (!email.includes('@') ? t('register.emailReqAt')
            : !email.split('@')[1]?.includes('.') ? t('register.emailReqDomain')
                : !validEmailDomains.includes(email.split('@')[1]?.toLowerCase()) ? `${t('register.emailReqSupported')} ${validEmailDomains.slice(0, 4).join(', ')}...`
                    : t('register.emailReqInvalid'))
        : ''

    // Validation per step
    const isStepValid = () => {
        switch (step) {
            case 1: return firstName.trim() && lastName.trim() && isEmailValid(email)
            case 2: return birthDay && birthMonth && birthYear
            case 3: return gender !== ''
            case 4: return lookingFor !== ''
            case 5: return interests.length >= 3
            case 6: return photos.filter(p => p !== null).length >= 2
            case 7: return locationCoords !== null && locationCity.trim() !== '' && locationCity !== 'Konum alınıyor...'
            case 8: return maxDistance >= 1
            case 9: return password.length >= 8 && password === confirmPassword
            case 10: return termsAccepted && privacyAccepted
            default: return true
        }
    }

    const handleSubmit = async () => {
        setAuthError('')
        setAuthLoading(true)
        try {
            await firebaseRegister(email, password, {
                firstName,
                lastName,
                email,
                bio,
                birthDate: `${birthDay}/${birthMonth}/${birthYear}`,
                gender,
                lookingFor,
                interests,
                photos: photos.filter(Boolean) as string[],
                locationCity,
                locationCoords,
                countryCode,
                likedUsers: [],
                passedUsers: [],
                maxDistance,
            })
            navigate('/home')
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            const code = error?.code || ''
            if (code === 'auth/email-already-in-use') setAuthError(t('register.err_in_use'))
            else if (code === 'auth/weak-password') setAuthError(t('register.err_weak'))
            else if (code === 'auth/invalid-email') setAuthError(t('register.err_invalid'))
            else if (code === 'auth/invalid-credential') setAuthError(t('register.err_cred'))
            else if (code === 'auth/operation-not-allowed') setAuthError(t('register.err_not_allowed'))
            else if (code === 'permission-denied') setAuthError(t('register.err_denied'))
            else setAuthError(t('register.err_unknown') + (error?.message || ''))
            console.error('Register error:', err)
        } finally {
            setAuthLoading(false)
        }
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step1_title')}</h2>
                        <p className="step-subtitle">{t('register.step1_sub')}</p>
                        <div className="form-group">
                            <label>{t('register.firstName')}</label>
                            <input className="form-input" placeholder={t('register.firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>{t('register.lastName')}</label>
                            <input className="form-input" placeholder={t('register.lastName')} value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>{t('register.email')}</label>
                            <input className={`form-input ${emailError ? 'input-error' : email && isEmailValid(email) ? 'input-success' : ''}`} type="email" placeholder={t('register.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} />
                            {emailError && <div className="field-error">{emailError}</div>}
                            {email && isEmailValid(email) && <div className="field-success">{t('register.emailSuccess')}</div>}
                        </div>
                        <div className="form-group">
                            <label>{t('register.bio')}</label>
                            <textarea
                                className="form-input"
                                placeholder={t('register.bioPlaceholder')}
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                maxLength={300}
                                rows={3}
                                style={{ resize: 'none', fontFamily: 'inherit' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', display: 'block', marginTop: 4 }}>{bio.length}/300</span>
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step2_title')}</h2>
                        <p className="step-subtitle">{t('register.step2_sub')}</p>
                        <div className="date-row">
                            <select value={birthDay} onChange={e => setBirthDay(e.target.value)}>
                                <option value="">{t('register.day')}</option>
                                {Array.from({ length: 31 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                ))}
                            </select>
                            <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
                                <option value="">{t('register.month')}</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={String(i + 1)}>{t(`months.${i + 1}`)}</option>
                                ))}
                            </select>
                            <select value={birthYear} onChange={e => setBirthYear(e.target.value)}>
                                <option value="">{t('register.year')}</option>
                                {Array.from({ length: 50 }, (_, i) => {
                                    const year = new Date().getFullYear() - 18 - i
                                    return <option key={year} value={String(year)}>{year}</option>
                                })}
                            </select>
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step3_title')}</h2>
                        <p className="step-subtitle">{t('register.step3_sub')}</p>
                        <div className="selection-grid gender-grid">
                            {[
                                { id: 'male', icon: '👨', title: t('register.gender_male') },
                                { id: 'female', icon: '👩', title: t('register.gender_female') },
                                { id: 'other', icon: '🌈', title: t('register.gender_other') },
                            ].map(option => (
                                <div
                                    key={option.id}
                                    className={`selection-card ${gender === option.id ? 'selected' : ''}`}
                                    onClick={() => setGender(option.id)}
                                >
                                    <div className="card-icon">{option.icon}</div>
                                    <div className="card-title">{option.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 4:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step4_title')}</h2>
                        <p className="step-subtitle">{t('register.step4_sub')}</p>
                        <div className="selection-grid looking-grid">
                            {LOOKING_FOR.map(option => (
                                <div
                                    key={option.id}
                                    className={`selection-card ${lookingFor === option.id ? 'selected' : ''}`}
                                    onClick={() => setLookingFor(option.id)}
                                >
                                    <div className="card-icon">{option.icon}</div>
                                    <div className="card-title">{t(`lookingFor.${option.id}.title`)}</div>
                                    <div className="card-desc">{t(`lookingFor.${option.id}.desc`)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 5:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step5_title')}</h2>
                        <p className="step-subtitle">{t('register.step5_sub')}</p>
                        <div className="interests-grid">
                            {INTERESTS.map(interest => (
                                <div
                                    key={interest}
                                    className={`interest-chip ${interests.includes(interest) ? 'selected' : ''}`}
                                    onClick={() => toggleInterest(interest)}
                                >
                                    {t(`interests.${interest}`)}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 6:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step6_title')}</h2>
                        <p className="step-subtitle">{t('register.step6_sub')}</p>
                        <div className="photo-grid">
                            {photos.map((photo, index) => (
                                <div
                                    key={index}
                                    className={`photo-slot ${index < 2 ? 'required' : ''} ${photo ? 'has-photo' : ''}`}
                                    onClick={() => !photo && handlePhotoUpload(index)}
                                >
                                    {photo ? (
                                        <>
                                            <img src={photo} alt={`Fotoğraf ${index + 1}`} className="photo-preview" />
                                            <button
                                                className="photo-remove"
                                                onClick={(e) => { e.stopPropagation(); removePhoto(index) }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {index < 2 ? <Camera size={24} className="photo-icon" /> : <Plus size={24} className="photo-icon" />}
                                            <span className="photo-label">{index < 2 ? t('register.required') : t('register.add')}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 7:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step7_title')}</h2>
                        <p className="step-subtitle">{t('register.step7_sub')}</p>

                        {/* GPS Button */}
                        <button
                            className={`location-btn ${locationStatus === 'success' ? 'success' : locationStatus === 'error' ? 'error' : locationStatus === 'loading' ? 'loading' : ''}`}
                            onClick={async () => {
                                setLocationStatus('loading')
                                setLocationCity(t('register.loc_fetching'))
                                setLocationError('')

                                // Helper: reverse geocode
                                const reverseGeocode = async (lat: number, lng: number) => {
                                    try {
                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=tr`, {
                                            headers: { 'User-Agent': 'BeMatch/1.0' }
                                        })
                                        const data = await res.json()
                                        const city = data.address?.city || data.address?.town || data.address?.province || data.address?.state || ''
                                        const country = data.address?.country || ''
                                        const cc = data.address?.country_code?.toUpperCase() || ''

                                        if (cc) setCountryCode(cc)

                                        if (city && country) return `${city}/${country}`
                                        return city || country || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                                    } catch {
                                        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                                    }
                                }

                                // Try GPS first
                                const tryGPS = () => new Promise<void>((resolve, reject) => {
                                    if (!navigator.geolocation) { reject('no-geo'); return }
                                    navigator.geolocation.getCurrentPosition(
                                        async (pos) => {
                                            const { latitude, longitude } = pos.coords
                                            setLocationCoords({ lat: latitude, lng: longitude })
                                            const name = await reverseGeocode(latitude, longitude)
                                            setLocationCity(name)
                                            setLocationStatus('success')
                                            resolve()
                                        },
                                        () => reject('denied'),
                                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                                    )
                                })

                                // IP fallback
                                const tryIP = async () => {
                                    try {
                                        const res = await fetch('https://ipapi.co/json/')
                                        const data = await res.json()
                                        if (data.latitude && data.longitude) {
                                            setLocationCoords({ lat: data.latitude, lng: data.longitude })
                                            const city = data.city || ''
                                            const country = data.country_name || ''
                                            const cc = data.country || ''

                                            if (cc) setCountryCode(cc)

                                            setLocationCity(city && country ? `${city}/${country}` : city || country)
                                            setLocationStatus('success')
                                        } else {
                                            throw new Error('no-ip-data')
                                        }
                                    } catch {
                                        setLocationStatus('error')
                                        setLocationCity('')
                                        setLocationError(t('register.loc_error'))
                                    }
                                }

                                try {
                                    await tryGPS()
                                } catch {
                                    // GPS failed, try IP
                                    await tryIP()
                                }
                            }}
                            disabled={locationStatus === 'loading'}
                        >
                            {locationStatus === 'loading' ? (
                                <Loader size={20} className="spin" />
                            ) : (
                                <Navigation size={20} />
                            )}
                            {locationStatus === 'idle' && t('register.loc_auto')}
                            {locationStatus === 'loading' && t('register.loc_fetching')}
                            {locationStatus === 'success' && t('register.loc_success')}
                            {locationStatus === 'error' && t('register.loc_retry')}
                        </button>

                        {/* Success Result */}
                        {locationStatus === 'success' && locationCity && (
                            <div className="location-result">
                                <MapPin size={16} />
                                <div className="location-result-info">
                                    <span className="location-result-city">{locationCity}</span>
                                    {locationCoords && (
                                        <span className="location-result-coords">
                                            {locationCoords.lat.toFixed(6)}, {locationCoords.lng.toFixed(6)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {locationError && (
                            <div className="location-error">
                                {locationError}
                            </div>
                        )}

                        <div className="location-info-text">
                            <p>{t('register.loc_hint1')}</p>
                            <p>{t('register.loc_hint2')}</p>
                        </div>
                    </div>
                )
            case 8:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step8_title')}</h2>
                        <p className="step-subtitle">{t('register.step8_sub')}</p>

                        <div className="distance-display">
                            <span className="distance-value">{maxDistance}</span>
                            <span className="distance-unit">km</span>
                        </div>

                        <div className="distance-slider-container">
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={maxDistance}
                                onChange={e => setMaxDistance(Number(e.target.value))}
                                className="distance-slider"
                                style={{ background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${maxDistance}%, rgba(255,255,255,0.1) ${maxDistance}%, rgba(255,255,255,0.1) 100%)` }}
                            />
                            <div className="distance-labels">
                                <span>1 km</span>
                                <span>50 km</span>
                                <span>100 km</span>
                            </div>
                        </div>

                        <div className="distance-hints">
                            {maxDistance <= 5 && <div className="distance-hint">{t('register.dist_hint1')}</div>}
                            {maxDistance > 5 && maxDistance <= 15 && <div className="distance-hint">{t('register.dist_hint2')}</div>}
                            {maxDistance > 15 && maxDistance <= 30 && <div className="distance-hint">{t('register.dist_hint3')}</div>}
                            {maxDistance > 30 && maxDistance <= 60 && <div className="distance-hint">{t('register.dist_hint4')}</div>}
                            {maxDistance > 60 && <div className="distance-hint">{t('register.dist_hint5')}</div>}
                        </div>
                    </div>
                )
            case 9:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step9_title')}</h2>
                        <p className="step-subtitle">{t('register.step9_sub')}</p>
                        <div className="form-group">
                            <label>{t('register.password')}</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('register.passwordPlaceholder')}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {password && (
                                <>
                                    <div className="strength-bar">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`strength-segment ${i <= passwordStrength ? `active ${strengthClasses[passwordStrength]}` : ''}`} />
                                        ))}
                                    </div>
                                    <div className={`strength-text ${strengthClasses[passwordStrength]}`}>
                                        {strengthLabels[passwordStrength] || ''}
                                    </div>
                                </>
                            )}
                            <div className="password-requirements">
                                <div className={`requirement ${password.length >= 8 ? 'met' : ''}`}>
                                    <span className="req-icon">{password.length >= 8 ? '✓' : '○'}</span>
                                    {t('register.pw_len')}
                                </div>
                                <div className={`requirement ${/[A-Z]/.test(password) ? 'met' : ''}`}>
                                    <span className="req-icon">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                                    {t('register.pw_upper')}
                                </div>
                                <div className={`requirement ${/[0-9]/.test(password) ? 'met' : ''}`}>
                                    <span className="req-icon">{/[0-9]/.test(password) ? '✓' : '○'}</span>
                                    {t('register.pw_num')}
                                </div>
                                <div className={`requirement ${/[^A-Za-z0-9]/.test(password) ? 'met' : ''}`}>
                                    <span className="req-icon">{/[^A-Za-z0-9]/.test(password) ? '✓' : '○'}</span>
                                    {t('register.pw_spec')}
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('register.passwordConfirm')}</label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder={t('register.passwordConfirmPlaceholder')}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <div className="strength-text weak">{t('register.pw_match_no')}</div>
                            )}
                            {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                                <div className="strength-text very-strong">{t('register.pw_match_yes')}</div>
                            )}
                        </div>
                    </div>
                )
            case 10:
                return (
                    <div>
                        <h2 className="step-title">{t('register.step10_title')}</h2>
                        <p className="step-subtitle">{t('register.step10_sub')}</p>

                        {authError && (
                            <div className="auth-error" style={{ marginBottom: 12 }}>{authError}</div>
                        )}

                        <div className="terms-section">
                            <div className="term-item" onClick={() => setTermsAccepted(!termsAccepted)}>
                                <div className={`custom-checkbox ${termsAccepted ? 'checked' : ''}`}>
                                    <Check size={14} className="check-icon" />
                                </div>
                                <span className="term-text">
                                    <a href="#/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{t('register.terms')}</a> {t('register.accept')}
                                </span>
                            </div>
                            <div className="term-item" onClick={() => setPrivacyAccepted(!privacyAccepted)}>
                                <div className={`custom-checkbox ${privacyAccepted ? 'checked' : ''}`}>
                                    <Check size={14} className="check-icon" />
                                </div>
                                <span className="term-text">
                                    <a href="#/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{t('register.privacy')}</a> {t('register.accept')}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="register-container">
            {/* Language Switcher */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                <select
                    value={i18n.language?.split('-')[0] || 'tr'}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '8px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', outline: 'none' }}
                >
                    <option value="tr">🇹🇷 TR</option>
                    <option value="en">🇬🇧 EN</option>
                    <option value="de">🇩🇪 DE</option>
                </select>
            </div>

            <motion.div
                className="register-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="register-header">
                    <h1>BeMatch</h1>
                </div>

                <div className="progress-container">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progress-text">
                        <span>{t('register.step')} {step}/{TOTAL_STEPS}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        className="step-content"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {renderStep()}

                        <div className="step-navigation">
                            {step > 1 && (
                                <button className="nav-btn back" onClick={goBack}>
                                    <ChevronLeft size={18} /> {t('register.back')}
                                </button>
                            )}
                            {step < TOTAL_STEPS ? (
                                <button
                                    className="nav-btn next"
                                    onClick={goNext}
                                    disabled={!isStepValid()}
                                >
                                    {t('register.next')} <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    className="nav-btn next"
                                    onClick={handleSubmit}
                                    disabled={!isStepValid() || authLoading}
                                >
                                    {authLoading ? t('register.loading') : t('register.submit')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="register-footer">
                    <p>{t('register.alreadyHaveAccount')} <Link to="/login">{t('register.loginLink')}</Link></p>
                </div>
            </motion.div>
        </div>
    )
}
