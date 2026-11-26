
import React, { useState } from "react";
import { Mail } from "lucide-react";

const rawApiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api")
    .trim()
    .replace(/\/+$/, "");

const API_BASE = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

type Props = {
    initialEmail?: string;
    onBack: () => void;
    onCodeSent: (email: string) => void;
};

export default function ForgotPasswordForm({
    initialEmail = "",
    onBack,
    onCodeSent,
}: Props) {
    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const send = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (!res.ok) throw new Error("Request failed");

            onCodeSent(email.trim());
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Enter a valid email address");
            return;
        }

        send();
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="p-8 pt-12 space-y-6">
            <div className="text-center">
                <h2 className="font-display text-2xl font-medium text-primary tracking-tight">
                    Forgot your password?
                </h2>

                <p className="text-xs text-black/55 mt-2 leading-relaxed">
                    Enter the email linked to your account and we'll send you a six-digit verification code.
                </p>
            </div>

            <div className="space-y-1">
                <label className="block text-left text-[10px] font-medium text-black/55 tracking-wider uppercase">
                    EMAIL ADDRESS
                </label>

                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pr-3 pointer-events-none text-black/55">
                        <Mail size={16} />
                    </span>

                    <input
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="you@example.com"
                        className="w-full pl-7 pb-2 pt-1 text-sm bg-transparent border-b border-outline-variant/60 focus:border-secondary focus:outline-none transition-colors"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-600 pt-1">{error}</p>
                )}
            </div>

            <div>
                <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full bg-primary hover:bg-secondary text-white py-3.5 px-4 text-xs font-medium tracking-widest uppercase focus:outline-none transition-colors disabled:opacity-75 cursor-pointer"
                >
                    {loading ? "SENDING..." : "SEND VERIFICATION CODE"}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="block mx-auto mt-4 text-[11px] text-black/55 underline hover:text-primary transition-colors cursor-pointer"
                >
                    Back to sign in
                </button>
            </div>
        </form>
    );
}
