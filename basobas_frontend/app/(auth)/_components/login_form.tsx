"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginData } from "../schema";
import { login as loginUser, requestPasswordReset, verifyLoginMfa, changeExpiredPassword } from "@/lib/api/auth";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "@/lib/passwordPolicy";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";
import CaptchaWidget, { isCaptchaEnabled } from "@/components/ui/CaptchaWidget";
import { useState, useCallback } from "react";
import styles from "./login_form.module.css";
import z from "zod";
import { toast } from "react-toastify";

const RequestPasswordResetSchema = z.object({
    email: z.email()
});

type RequestPasswordResetDTO = z.infer<typeof RequestPasswordResetSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [otp, setOtp] = useState("");
  const [showPasswordExpired, setShowPasswordExpired] = useState(false);
  const [changeToken, setChangeToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const onCaptchaVerify = useCallback((token: string) => setCaptchaToken(token), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const forgotPasswordForm = useForm<RequestPasswordResetDTO>({
    resolver: zodResolver(RequestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  // Shared success path: store auth cookies and redirect by role.
  const finishLogin = (result: any) => {
    // The secure, HttpOnly auth cookie is set by the server. Store only
    // non-sensitive user data client-side (for the UI and route guard).
    if (result.data) {
      document.cookie = `user_data=${encodeURIComponent(
        JSON.stringify(result.data)
      )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    const role = result?.data?.role;
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Call the API directly (no server action). Include the CAPTCHA token so
      // the server can verify a human is behind the request (when enabled).
      const result = await loginUser({ ...data, captchaToken });

      // If the account has MFA enabled, switch to the code-entry step.
      if (result?.mfaRequired && result?.mfaToken) {
        setMfaToken(result.mfaToken);
        setOtp("");
        setShowMfa(true);
        setIsLoading(false);
        return;
      }

      // If the password has expired, switch to the forced-change step.
      if (result?.passwordExpired && result?.changeToken) {
        setChangeToken(result.changeToken);
        setNewPassword("");
        setConfirmNewPassword("");
        setShowPasswordExpired(true);
        setIsLoading(false);
        return;
      }

      const success =
        result &&
        (result.success ||
          result.token ||
          result.data ||
          result.id ||
          Object.keys(result).length > 0);

      if (success) {
        finishLogin(result);
      } else {
        setErrorMessage(result?.message || "Login failed");
      }
    } catch (error: any) {
      setErrorMessage(error?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyMfa = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await verifyLoginMfa(mfaToken, otp.trim());
      if (result?.passwordExpired && result?.changeToken) {
        setChangeToken(result.changeToken);
        setNewPassword("");
        setConfirmNewPassword("");
        setShowMfa(false);
        setShowPasswordExpired(true);
        setIsLoading(false);
        return;
      }
      if (result?.token || result?.data) {
        finishLogin(result);
      } else {
        setErrorMessage(result?.message || "Verification failed");
      }
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || error?.message || "Invalid authentication code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeExpiredPassword = async () => {
    setErrorMessage("");
    if (!isStrongPassword(newPassword)) {
      setErrorMessage(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter, a lowercase letter, a number, and a special character.`
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await changeExpiredPassword(changeToken, newPassword);
      if (result?.token || result?.data) {
        finishLogin(result);
      } else {
        setErrorMessage(result?.message || "Failed to update password");
      }
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || error?.message || "Failed to update password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: RequestPasswordResetDTO) => {
    try {
      const response = await requestPasswordReset(data.email);
      if (response.success) {
        toast.success('Password reset link sent to your email.');
        setShowForgotPassword(false);
      } else {
        toast.error(response.message || 'Failed to request password reset.');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to request password reset.');
    }
  };

  return (
    <div className="login-right">
      <div className={styles.switchContainer}>
        <span className={styles.switchLabel}>User</span>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            aria-label="Log in as admin"
          />
          <span className={styles.slider}></span>
        </label>
        <span className={styles.switchLabel}>Admin</span>
      </div>

      <div className="login-box" style={{ position: 'relative', background: "linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(239, 250, 247, 0.65))", border: "1px solid rgba(170, 205, 196, 0.5)", boxShadow: "0 22px 55px -30px rgba(8, 53, 49, 0.35)" }}>
        <h1 style={{ color: "#0b5e58" }}>{showPasswordExpired ? "Update your password" : showMfa ? "Two-step verification" : showForgotPassword ? "Reset Password" : "Welcome to BasoBas"}</h1>

        {!showForgotPassword && !showMfa && !showPasswordExpired && (
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-teal-500 hover:underline text-sm"
            style={{
              position: 'absolute',
              bottom: '45px',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Forgot Password?
          </button>
        )}

        {showPasswordExpired ? (
          <form key="expired" onSubmit={(e) => { e.preventDefault(); void onChangeExpiredPassword(); }} className="login-form">
            {errorMessage && (
              <div role="alert" className="error-text" style={{ marginBottom: "1rem" }}>
                {errorMessage}
              </div>
            )}
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
              Your password has expired. Please set a new one to continue.
            </p>
            <div className="form-row">
              <label>New password</label>
              <div className="field">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <PasswordStrengthMeter password={newPassword} />
              </div>
            </div>
            <div className="form-row">
              <label>Confirm</label>
              <div className="field">
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{ marginTop: "8px", background: "linear-gradient(135deg, #0b5e58 0%, #0f7670 100%)", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500", opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : showMfa ? (
          <form key="mfa" onSubmit={(e) => { e.preventDefault(); void onVerifyMfa(); }} className="login-form">
            {errorMessage && (
              <div role="alert" className="error-text" style={{ marginBottom: "1rem" }}>
                {errorMessage}
              </div>
            )}
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
              Enter the 6-digit code from your authenticator app.
            </p>
            <div className="form-row">
              <label>Code</label>
              <div className="field">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              style={{ marginTop: "8px", background: "linear-gradient(135deg, #0b5e58 0%, #0f7670 100%)", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500", opacity: isLoading || otp.length < 6 ? 0.7 : 1 }}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setShowMfa(false); setOtp(""); setMfaToken(""); setErrorMessage(""); }}
              style={{ marginTop: 10, background: "none", border: "none", color: "#0b5e58", cursor: "pointer", fontSize: 14 }}
            >
              Back to login
            </button>
          </form>
        ) : !showForgotPassword ? (
          <form key="login" onSubmit={handleSubmit(onSubmit)} className="login-form">
            {errorMessage && (
              <div role="alert" className="error-text" style={{ marginBottom: "1rem" }}>
                {errorMessage}
              </div>
            )}

            {/* Email */}
            <div className="form-row">
              <label htmlFor="login-email">Email</label>
              <div className="field">
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="login-email-error" className="error-text">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="form-row">
              <label htmlFor="login-password">Password</label>
              <div className="field">
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  {...register("password")}
                />
                {errors.password && (
                  <p id="login-password-error" className="error-text">{errors.password.message}</p>
                )}
              </div>
            </div>

            <CaptchaWidget onVerify={onCaptchaVerify} />

            <button
              type="submit"
              disabled={isLoading || (isCaptchaEnabled() && !captchaToken)}
              style={{
                marginTop: "8px",
                background: "linear-gradient(135deg, #0b5e58 0%, #0f7670 100%)",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
                transition: "all 0.2s",
                opacity: isLoading || (isCaptchaEnabled() && !captchaToken) ? 0.7 : 1
              }}
              onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {isLoading ? "Logging in..." : isAdmin ? "Login as Admin" : "Login"}
            </button>
          </form>
        ) : (
          <form key="forgot" onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="login-form">
            <div className="form-row">
              <label>Email</label>
              <div className="field">
                <input
                  type="email"
                  placeholder="Enter your email"
                  {...forgotPasswordForm.register("email")}
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="error-text">{forgotPasswordForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <button type="submit" disabled={forgotPasswordForm.formState.isSubmitting} style={{ marginTop: "8px", background: "linear-gradient(135deg, #0b5e58 0%, #0f7670 100%)", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }}>
              {forgotPasswordForm.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="signup-text">
          {!showForgotPassword ? (
            <>
              Don't have an account? <Link href="/register" style={{ color: "#0b5e58" }}>Sign Up</Link>
            </>
          ) : (
            <button
              onClick={() => setShowForgotPassword(false)}
              className="text-teal-500 hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: "#0b5e58" }}
            >
              Remember your password? Login
            </button>
          )}
        </p>
      </div>
    </div>
  );
}