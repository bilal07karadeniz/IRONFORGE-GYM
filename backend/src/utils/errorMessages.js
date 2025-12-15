/**
 * Bilingual Error Messages (English / Turkish)
 *
 * Usage:
 * const { getErrorMessage } = require('./errorMessages');
 * throw AppError.badRequest(getErrorMessage('INVALID_EMAIL', 'tr'));
 */

const errorMessages = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    en: 'Invalid email or password',
    tr: 'Geçersiz e-posta veya şifre',
  },
  TOKEN_EXPIRED: {
    en: 'Your session has expired. Please log in again',
    tr: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın',
  },
  TOKEN_INVALID: {
    en: 'Invalid or expired token',
    tr: 'Geçersiz veya süresi dolmuş token',
  },
  NO_TOKEN: {
    en: 'No authentication token provided',
    tr: 'Kimlik doğrulama tokeni sağlanmadı',
  },
  ACCOUNT_LOCKED: {
    en: 'Your account has been locked due to too many failed login attempts. Please try again later',
    tr: 'Çok fazla başarısız giriş denemesi nedeniyle hesabınız kilitlendi. Lütfen daha sonra tekrar deneyin',
  },
  ACCOUNT_DEACTIVATED: {
    en: 'Your account has been deactivated. Please contact support',
    tr: 'Hesabınız devre dışı bırakıldı. Lütfen destek ile iletişime geçin',
  },
  EMAIL_NOT_VERIFIED: {
    en: 'Please verify your email address before continuing',
    tr: 'Devam etmeden önce lütfen e-posta adresinizi doğrulayın',
  },

  // Authorization Errors
  FORBIDDEN: {
    en: 'You do not have permission to access this resource',
    tr: 'Bu kaynağa erişim izniniz yok',
  },
  ADMIN_ONLY: {
    en: 'This action requires administrator privileges',
    tr: 'Bu işlem yönetici yetkisi gerektirir',
  },
  TRAINER_ONLY: {
    en: 'This action is only available for trainers',
    tr: 'Bu işlem sadece eğitmenler için kullanılabilir',
  },

  // Validation Errors
  INVALID_EMAIL: {
    en: 'Please provide a valid email address',
    tr: 'Lütfen geçerli bir e-posta adresi girin',
  },
  PASSWORD_TOO_WEAK: {
    en: 'Password does not meet security requirements',
    tr: 'Şifre güvenlik gereksinimlerini karşılamıyor',
  },
  REQUIRED_FIELD: {
    en: 'This field is required',
    tr: 'Bu alan zorunludur',
  },
  INVALID_UUID: {
    en: 'Invalid ID format',
    tr: 'Geçersiz ID formatı',
  },

  // User Errors
  USER_NOT_FOUND: {
    en: 'User not found',
    tr: 'Kullanıcı bulunamadı',
  },
  USER_ALREADY_EXISTS: {
    en: 'A user with this email already exists',
    tr: 'Bu e-posta ile kayıtlı bir kullanıcı zaten var',
  },
  CANNOT_MODIFY_SELF: {
    en: 'You cannot modify your own account in this way',
    tr: 'Kendi hesabınızı bu şekilde değiştiremezsiniz',
  },

  // Class Errors
  CLASS_NOT_FOUND: {
    en: 'Class not found',
    tr: 'Ders bulunamadı',
  },
  CLASS_NAME_EXISTS: {
    en: 'A class with this name already exists',
    tr: 'Bu isimde bir ders zaten mevcut',
  },
  CLASS_HAS_SCHEDULES: {
    en: 'Cannot delete class with active schedules',
    tr: 'Aktif programları olan ders silinemez',
  },

  // Schedule Errors
  SCHEDULE_NOT_FOUND: {
    en: 'Schedule not found',
    tr: 'Program bulunamadı',
  },
  SCHEDULE_IN_PAST: {
    en: 'Cannot create or modify schedules in the past',
    tr: 'Geçmiş tarihli programlar oluşturulamaz veya değiştirilemez',
  },
  TRAINER_CONFLICT: {
    en: 'Trainer has a scheduling conflict at this time',
    tr: 'Eğitmenin bu saatte başka bir programı var',
  },
  ROOM_CONFLICT: {
    en: 'This room is already booked at this time',
    tr: 'Bu salon bu saatte zaten rezerve edilmiş',
  },
  SCHEDULE_HAS_BOOKINGS: {
    en: 'Cannot delete schedule with existing bookings. Please cancel instead',
    tr: 'Mevcut rezervasyonları olan program silinemez. Lütfen iptal edin',
  },

  // Booking Errors
  BOOKING_NOT_FOUND: {
    en: 'Booking not found',
    tr: 'Rezervasyon bulunamadı',
  },
  CLASS_FULL: {
    en: 'This class is full. Please join the waiting list',
    tr: 'Bu ders dolu. Lütfen bekleme listesine katılın',
  },
  ALREADY_BOOKED: {
    en: 'You already have a booking for this class',
    tr: 'Bu ders için zaten bir rezervasyonunuz var',
  },
  BOOKING_CONFLICT: {
    en: 'You have another booking at this time',
    tr: 'Bu saatte başka bir rezervasyonunuz var',
  },
  CANCELLATION_TOO_LATE: {
    en: 'Cancellations must be made at least 2 hours before the class starts',
    tr: 'İptaller dersin başlamasından en az 2 saat önce yapılmalıdır',
  },
  CLASS_ALREADY_STARTED: {
    en: 'Cannot book or cancel a class that has already started',
    tr: 'Başlamış bir ders için rezervasyon yapılamaz veya iptal edilemez',
  },
  CANNOT_RATE_FUTURE: {
    en: 'Cannot rate a class that has not yet occurred',
    tr: 'Henüz gerçekleşmemiş bir dersi değerlendiremezsiniz',
  },
  ALREADY_RATED: {
    en: 'You have already rated this class',
    tr: 'Bu dersi zaten değerlendirdiniz',
  },

  // Waiting List Errors
  WAITING_LIST_NOT_FOUND: {
    en: 'Waiting list entry not found',
    tr: 'Bekleme listesi kaydı bulunamadı',
  },
  ALREADY_ON_WAITING_LIST: {
    en: 'You are already on the waiting list for this class',
    tr: 'Bu ders için zaten bekleme listesindesiniz',
  },
  CLASS_NOT_FULL: {
    en: 'Class has available spots. Please book directly',
    tr: 'Derste boş yer var. Lütfen doğrudan rezervasyon yapın',
  },
  NOT_NOTIFIED: {
    en: 'You have not been notified yet. Please wait for a spot',
    tr: 'Henüz bilgilendirilmediniz. Lütfen bir yer açılmasını bekleyin',
  },
  NOTIFICATION_EXPIRED: {
    en: 'Your waiting list notification has expired',
    tr: 'Bekleme listesi bildiriminizin süresi doldu',
  },

  // Trainer Errors
  TRAINER_NOT_FOUND: {
    en: 'Trainer not found',
    tr: 'Eğitmen bulunamadı',
  },
  NOT_A_TRAINER: {
    en: 'You are not registered as a trainer',
    tr: 'Eğitmen olarak kayıtlı değilsiniz',
  },
  TRAINER_NOT_AVAILABLE: {
    en: 'Trainer is currently not available',
    tr: 'Eğitmen şu anda müsait değil',
  },

  // General Errors
  INTERNAL_ERROR: {
    en: 'An unexpected error occurred. Please try again later',
    tr: 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin',
  },
  TOO_MANY_REQUESTS: {
    en: 'Too many requests. Please try again later',
    tr: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin',
  },
  NOT_FOUND: {
    en: 'Resource not found',
    tr: 'Kaynak bulunamadı',
  },
  BAD_REQUEST: {
    en: 'Invalid request',
    tr: 'Geçersiz istek',
  },
};

/**
 * Get error message in specified language
 * @param {string} code - Error code
 * @param {string} lang - Language code ('en' or 'tr')
 * @returns {string} Error message
 */
const getErrorMessage = (code, lang = 'en') => {
  const message = errorMessages[code];
  if (!message) {
    return errorMessages.INTERNAL_ERROR[lang] || errorMessages.INTERNAL_ERROR.en;
  }
  return message[lang] || message.en;
};

/**
 * Get error object with both languages
 * @param {string} code - Error code
 * @returns {object} Error messages in both languages
 */
const getErrorMessages = (code) => {
  return errorMessages[code] || errorMessages.INTERNAL_ERROR;
};

module.exports = {
  errorMessages,
  getErrorMessage,
  getErrorMessages,
};
