/**
 * Password strength validation utility
 */

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  disallowCommonPasswords: true,
};

// Common passwords to block (abbreviated list - in production use a larger list)
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'master', 'dragon', 'letmein', 'login', 'admin', 'welcome',
  'password1', 'iloveyou', 'sunshine', 'princess', 'football', 'baseball',
  'trustno1', 'superman', 'batman', 'starwars', 'hello123', 'charlie',
  'donald', 'passw0rd', 'shadow', 'ashley', 'michael', 'ninja', 'mustang',
  'password!', 'P@ssw0rd', 'Password1', 'Qwerty123', 'Admin123', 'Welcome1',
];

/**
 * Check if password contains personal info (email parts)
 * @param {string} password - Password to check
 * @param {string} email - User's email
 * @returns {boolean} - True if password contains personal info
 */
const containsPersonalInfo = (password, email) => {
  if (!email) return false;

  const emailParts = email.toLowerCase().split(/[@.]/);
  const passwordLower = password.toLowerCase();

  return emailParts.some(part => part.length > 2 && passwordLower.includes(part));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {string} email - User's email (optional, for personal info check)
 * @returns {Object} - Validation result with isValid and errors array
 */
const validatePassword = (password, email = null) => {
  const errors = [];

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  // Check maximum length
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  // Check for common passwords
  if (PASSWORD_REQUIREMENTS.disallowCommonPasswords) {
    const passwordLower = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(passwordLower)) {
      errors.push('This password is too common. Please choose a more unique password');
    }
  }

  // Check for personal info
  if (email && containsPersonalInfo(password, email)) {
    errors.push('Password should not contain parts of your email address');
  }

  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain more than 2 consecutive identical characters');
  }

  // Check for sequential numbers/letters
  if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    errors.push('Password should not contain sequential characters (e.g., 123, abc)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculateStrength(password),
  };
};

/**
 * Calculate password strength score (0-100)
 * @param {string} password - Password to evaluate
 * @returns {Object} - Strength score and label
 */
const calculateStrength = (password) => {
  let score = 0;

  // Length scoring (up to 30 points)
  score += Math.min(password.length * 2, 30);

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;

  // Bonus for mixing character types (up to 20 points)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const typeCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (typeCount >= 3) score += 10;
  if (typeCount === 4) score += 10;

  // Penalty for patterns
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/^[a-zA-Z]+$/.test(password)) score -= 10;
  if (/^\d+$/.test(password)) score -= 20;

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine strength label
  let label;
  if (score < 30) label = 'weak';
  else if (score < 50) label = 'fair';
  else if (score < 70) label = 'good';
  else if (score < 90) label = 'strong';
  else label = 'excellent';

  return { score, label };
};

/**
 * Get password requirements as a formatted string
 * @returns {string} - Formatted requirements
 */
const getRequirementsText = () => {
  const requirements = [
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
  ];

  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push('At least one uppercase letter (A-Z)');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push('At least one lowercase letter (a-z)');
  }
  if (PASSWORD_REQUIREMENTS.requireNumbers) {
    requirements.push('At least one number (0-9)');
  }
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    requirements.push('At least one special character (!@#$%^&*...)');
  }

  return requirements;
};

module.exports = {
  validatePassword,
  calculateStrength,
  getRequirementsText,
  PASSWORD_REQUIREMENTS,
};
