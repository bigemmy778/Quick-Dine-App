import React, { useState } from "react";
import { Lock } from "lucide-react";

const rawApiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api")
    .trim()
    .replace(/\/+$/, "");

const API_BASE = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

type Props = {
    resetToken: string;
    onSuccess: () => void;
};

export default function ResetPasswordForm({ resetToken, onSuccess }: Props) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resetToken, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Unable to reset password.");
            }

            setSuccess(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-8 pt-12 space-y-6 text-center">
                <h2 className="font-display text-2xl font-medium text-primary tracking-tight">
                    Password reset successful
                </h2>
    
                <p className="text-xs text-black/55 leading-relaxed">
                    Your password has been updated. You can now sign in with your new password.
                </p>
    
                <button
                    type="button"
                    onClick={onSuccess}
                    className="w-full bg-primary hover:bg-secondary text-white py-3.5 px-4 text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer"
                >
                    BACK TO SIGN IN
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-8 pt-12 space-y-6">
            <div className="text-center">
                <h2 className="font-display text-2xl font-medium text-primary tracking-tight">
                    Create new password
                </h2>
                <p className="text-xs text-black/55 mt-2 leading-relaxed">
                    Choose a new password for your QuickDine account.
                </p>
            </div>

            <div className="space-y-5">
                <div className="space-y-1">
                    <label className="block text-left text-[10px] font-medium text-black/55 tracking-wider uppercase">
                        NEW PASSWORD
                    </label>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pr-3 pointer-events-none text-black/55">
                            <Lock size={16} />
                        </span>
                        <input
                            type="password"
                            autoFocus
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full pl-7 pb-2 pt-1 text-sm bg-transparent border-b border-outline-variant/60 focus:border-secondary focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="block text-left text-[10px] font-medium text-black/55 tracking-wider uppercase">
                        CONFIRM NEW PASSWORD
                    </label>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pr-3 pointer-events-none text-black/55">
                            <Lock size={16} />
                        </span>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full pl-7 pb-2 pt-1 text-sm bg-transparent border-b border-outline-variant/60 focus:border-secondary focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-600 text-center">{error}</p>
            )}

            <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-primary hover:bg-secondary text-white py-3.5 px-4 text-xs font-medium tracking-widest uppercase focus:outline-none transition-colors disabled:opacity-75 cursor-pointer"
            >
                {loading ? "UPDATING..." : "RESET PASSWORD"}
            </button>
        </form>
    );
}
