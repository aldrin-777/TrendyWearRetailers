"use client";

import { FormEvent, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MdArrowBack } from "react-icons/md";
import { createClient } from "@/utils/supabase/client";
import { evaluatePassword } from "@/lib/passwordStrength";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const passwordCheck = useMemo(() => evaluatePassword(password), [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!termsAccepted) {
      setError("You must accept the terms and conditions.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordCheck.okToSignUp) {
      setError(
        "Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number."
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (
        msg.includes("user already registered") ||
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("email already") ||
        msg.includes("duplicate")
      ) {
        setError("The email is already used");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // ✅ THIS is the important part (Supabase may not throw an error)
    if (
      data?.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      setError("The email is already used");
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
    // Optional: route to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  return (
    <div className="min-h-fit flex items-center justify-center bg-white">
      <div className="w-full max-w-md mx-auto px-6 py-12 select-none">
        {/* Back */}
        <div className="mb-10 text-left">
          <a
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#c1121f] transition-colors"
          >
            <MdArrowBack className="text-base mr-1" />
            Back to Store
          </a>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Create Account
          </h2>
          <p className="text-gray-500">
            Sign up with your email to start shopping.
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && !error && (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:ring-0 focus:border-[#c1121f] transition-colors"
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:ring-0 focus:border-[#c1121f] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:ring-0 focus:border-[#c1121f] transition-colors"
            />
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 transition-colors ${
                      password.length === 0
                        ? "bg-gray-200"
                        : i < Math.ceil(passwordCheck.score)
                          ? passwordCheck.strength === "weak"
                            ? "bg-red-400"
                            : passwordCheck.strength === "fair"
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                          : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {password.length === 0 ? (
                  "Use 8+ characters with upper, lower, and a number (add a symbol for a stronger password)."
                ) : (
                  <>
                    Strength:{" "}
                    <span
                      className={
                        passwordCheck.strength === "weak"
                          ? "text-red-600 font-medium"
                          : passwordCheck.strength === "fair"
                            ? "text-amber-600 font-medium"
                            : "text-emerald-700 font-medium"
                      }
                    >
                      {passwordCheck.strength === "weak"
                        ? "Weak"
                        : passwordCheck.strength === "fair"
                          ? "Fair"
                          : "Strong"}
                    </span>
                    {!passwordCheck.okToSignUp && passwordCheck.hints.length > 0 && (
                      <span className="block text-red-600 mt-0.5">
                        {passwordCheck.hints.slice(0, 3).join(" · ")}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Reconfirm Password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Reconfirm Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-2 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:ring-0 focus:border-[#c1121f] transition-colors"
            />
          </div>

          {/* Remember / Terms */}
          <div className="flex items-start mt-6">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="h-4 w-4 text-[#c1121f] border-gray-300 rounded focus:ring-[#c1121f] bg-transparent"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-500">
              I agree to the{" "}
              <a
                href="#"
                className="text-[#c1121f] hover:text-[#a1121f] transition-colors"
              >
                Terms & Conditions
              </a>
            </label>
          </div>

          {/* Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded shadow text-sm font-bold text-white bg-[#c1121f] hover:bg-[#a91c1c] hover:text-white transition-colors duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing you up..." : "Sign Up"}
            </button>
          </div>
        </form>

        {/* Bottom */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-[#c1121f] hover:text-[#a1121f] transition-colors"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
