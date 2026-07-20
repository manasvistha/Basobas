"use client";
import Image from "next/image";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/lib/api/auth";
import { toast } from "react-toastify";
import Link from "next/link";

export const RequestPasswordResetSchema = z.object({
    email: z.email()
});

export type RequestPasswordResetDTO = z.infer<typeof RequestPasswordResetSchema>;

export default function Page() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RequestPasswordResetDTO>({
        resolver: zodResolver(RequestPasswordResetSchema)
    });

    const onSubmit = async (data: RequestPasswordResetDTO) => {
        try {
            const response = await requestPasswordReset(data.email);
            if (response.success) {
                toast.success('Password reset link sent to your email.');
            } else {
                toast.error(response.message || 'Failed to request password reset.');
            }
        } catch (error) {
            toast.error((error as Error).message || 'Failed to request password reset.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-logo">
                    <Image
                        src="/basobas.png"
                        alt="BasoBas"
                        width={150}
                        height={80}
                        priority
                    />
                </div>
                <Image
                    src="/illustration.png"
                    alt="Forgot Password Illustration"
                    fill
                    priority
                    className="login-illustration"
                />
            </div>

            <div className="login-right">
                <div className="login-box">
                    <h1>Forgot Password</h1>
                    <p className="login-subtitle">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                        <div className="form-row">
                            <label>Email Address</label>
                            <div className="field">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="error-text">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    <p className="login-footer">
                        Remember your password?{" "}
                        <Link href="/login">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}