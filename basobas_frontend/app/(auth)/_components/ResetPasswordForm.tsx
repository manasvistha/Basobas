"use client";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/lib/api/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { strongPasswordSchema } from "@/lib/passwordPolicy";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";

const ResetPasswordSchema = z.object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

interface ResetPasswordFormProps {
    token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetPasswordDTO>({
        resolver: zodResolver(ResetPasswordSchema)
    });
    const newPasswordValue = watch("newPassword") || "";

    const onSubmit = async (data: ResetPasswordDTO) => {
        if (!token) {
            toast.error('Invalid or missing reset token');
            return;
        }

        try {
            const response = await resetPassword(token, data.newPassword);
            if (response.success) {
                toast.success('Password has been reset successfully! Please login with your new password.');
                router.push('/login');
            } else {
                toast.error(response.message || 'Failed to reset password');
            }
        } catch (error) {
            toast.error((error as Error).message || 'Failed to reset password');
        }
    };

    if (!token) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-box">
                    <h1>Invalid Reset Link</h1>
                    <p>The password reset link is invalid or has expired.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="reset-password-btn"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-box">
                <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#0b5e58", fontSize: "0.8125rem", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(15, 118, 110, 0.2)", marginBottom: "20px", width: "fit-content" }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = "#0b5e58";
                        e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.4)";
                        e.currentTarget.style.background = "rgba(15, 118, 110, 0.08)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = "#0b5e58";
                        e.currentTarget.style.borderColor = "rgba(15, 118, 110, 0.2)";
                        e.currentTarget.style.background = "transparent";
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to Login
                </Link>
                <h1>Reset Your Password</h1>
                <p>Enter your new password below.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="reset-password-form">
                    {/* New Password */}
                    <div className="form-row">
                        <label>New Password</label>
                        <div className="field">
                            <input
                                type="password"
                                placeholder="Enter your new password"
                                {...register("newPassword")}
                            />
                            {errors.newPassword && (
                                <p className="error-text">{errors.newPassword.message}</p>
                            )}
                            <PasswordStrengthMeter password={newPasswordValue} />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-row">
                        <label>Confirm Password</label>
                        <div className="field">
                            <input
                                type="password"
                                placeholder="Confirm your new password"
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="error-text">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="reset-password-btn"
                    >
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}