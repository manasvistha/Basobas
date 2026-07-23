"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterData } from "@/lib/authSchema";
import { register as registerUser } from "@/lib/api/auth";
import { useState, useCallback } from "react";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";
import CaptchaWidget, { isCaptchaEnabled } from "@/components/ui/CaptchaWidget";

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const onCaptchaVerify = useCallback((token: string) => setCaptchaToken(token), []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });
  const passwordValue = watch("password") || "";

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Submitting registration form:", data);

      // Call the API directly (no server action). Include the CAPTCHA token so
      // the server can verify a human is behind the request (when enabled).
      const result = await registerUser({ ...data, captchaToken });
      console.log("Registration result:", result);

      // Consider it a success if the backend returned anything meaningful
      const success =
        result &&
        (result.success ||
          result.token ||
          result.data ||
          result.id ||
          Object.keys(result).length > 0);

      if (success) {
        // Cookies were httpOnly:false anyway, so set them client-side
        if (result.token) {
          document.cookie = `auth_token=${result.token}; path=/; max-age=${
            60 * 60 * 24 * 30
          }`;
        }
        if (result.data) {
          document.cookie = `user_data=${encodeURIComponent(
            JSON.stringify(result.data)
          )}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }

        router.push("/dashboard");
      } else {
        const errorMsg = result?.message || "Registration failed";
        console.log("Registration failed:", errorMsg);
        setErrorMessage(errorMsg);
      }
    } catch (error: any) {
      console.error("Registration catch error:", error);
      const errorMsg = error?.message || "An error occurred";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-right">
      <div className="signup-box">
        <h1>Create Your Account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {errorMessage && (
            <div
              role="alert"
              className="error-text"
              style={{ marginBottom: "1rem", color: "#dc2626" }}
            >
              {errorMessage}
            </div>
          )}

          {/* Full Name */}
          <div className="form-row">
            <label htmlFor="signup-name">Full Name</label>
            <div className="field">
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "signup-name-error" : undefined}
                {...register("name")}
              />
              {errors.name && (
                <p id="signup-name-error" className="error-text">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="form-row">
            <label htmlFor="signup-email">Email</label>
            <div className="field">
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "signup-email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="signup-email-error" className="error-text">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="form-row">
            <label htmlFor="signup-password">Password</label>
            <div className="field">
              <input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "signup-password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="signup-password-error" className="error-text">{errors.password.message}</p>
              )}
              <PasswordStrengthMeter password={passwordValue} />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-row">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <div className="field">
              <input
                id="signup-confirm"
                type="password"
                placeholder="Confirm your password"
                aria-invalid={!!errors.confirmPass}
                aria-describedby={errors.confirmPass ? "signup-confirm-error" : undefined}
                {...register("confirmPass")}
              />
              {errors.confirmPass && (
                <p id="signup-confirm-error" className="error-text">{errors.confirmPass.message}</p>
              )}
            </div>
          </div>

          <CaptchaWidget onVerify={onCaptchaVerify} />

          <button
            type="submit"
            disabled={isLoading || (isCaptchaEnabled() && !captchaToken)}
            style={{
              background: "linear-gradient(135deg, #0b5e58 0%, #0f7670 100%)",
              color: "white",
              marginTop: "20px",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "16px",
              transition: "all 0.2s",
              opacity: isLoading || (isCaptchaEnabled() && !captchaToken) ? 0.7 : 1,
            }}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="signup-text">
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#0b5e58" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}