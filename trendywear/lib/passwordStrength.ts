export type PasswordStrength = "weak" | "fair" | "strong";

export type PasswordCheck = {
  strength: PasswordStrength;
  /** 0–4 scale for UI meter */
  score: number;
  /** Meets minimum policy for sign-up */
  okToSignUp: boolean;
  hints: string[];
};

/**
 * Client-side policy: at least 8 chars, uppercase, lowercase, and a digit.
 * "Strong" adds a special character or length ≥ 12.
 */
export function evaluatePassword(password: string): PasswordCheck {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else hints.push("At least 8 characters");

  if (password.length >= 12) score += 0.5;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLower) score += 0.75;
  else hints.push("One lowercase letter");

  if (hasUpper) score += 0.75;
  else hints.push("One uppercase letter");

  if (hasDigit) score += 0.75;
  else hints.push("One number");

  if (hasSpecial) score += 0.5;

  const capped = Math.min(4, score);
  let strength: PasswordStrength = "weak";
  if (capped >= 2.5 && capped < 3.5) strength = "fair";
  if (capped >= 3.5) strength = "strong";

  const okToSignUp =
    password.length >= 8 && hasLower && hasUpper && hasDigit;

  return {
    strength,
    score: capped,
    okToSignUp,
    hints: okToSignUp ? [] : hints,
  };
}
