
import React, { useRef, useState } from "react";
import { Mail } from "lucide-react";

const rawApiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api")
    .trim()
    .replace(/\/+$/, "");

const API_BASE = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

type Props = {
    email: string;
    onBack: () => void;
    onVerified: (resetToken: string) => void;
};

export default function VerifyResetCode({ email, onBack, onVerified }: Props) {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);

        const updatedCode = [...code];
        updatedCode[index] = digit;
        setCode(updatedCode);

        if (error) setError("");

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Allow users to paste all six digits at once
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pastedCode = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedCode) return;

        const updatedCode = Array(6).fill("");
        pastedCode.split("").forEach((digit, index) => {
            updatedCode[index] = digit;
        });

        setCode(updatedCode);
        setError("");

        inputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
    };

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault();

        const verificationCode = code.join("");

        if (verificationCode.length !== 6) {
            setError("Please enter the complete six-digit code.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    code: verificationCode,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Invalid or expired verification code.");
            }

            if (!data.resetToken) {
                throw new Error("Verification failed. Please try again.");
            }

            onVerified(data.resetToken);
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

    const resendCode = async () => {
        setResending(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            if (!res.ok) {
                throw new Error("Unable to resend the verification code.");
            }

            setCode(["", "", "", "", "", ""]);
            setMessage("A new verification code has been sent.");
            inputRefs.current[0]?.focus();
        } catch {
            setError("Unable to resend the code. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <form onSubmit={verifyCode} className="p-8 pt-12 space-y-6">
            <div className="text-center">
                <div className="flex justify-center mb-4 text-primary">
                    <Mail size={25} />
                </div>

                <h2 className="font-display text-2xl font-medium text-primary tracking-tight">
                    Verify your email
                </h2>

                <p className="text-xs text-black/55 mt-2 leading-relaxed">
                    Enter the six-digit verification code we sent to
                    <span className="font-medium text-primary block mt-1">
                        {email}
                    </span>
                </p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3">
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-medium bg-transparent border border-outline-variant/60 focus:border-secondary focus:outline-none transition-colors"
                    />
                ))}
            </div>

            {error && (
                <p className="text-xs text-red-600 text-center">{error}</p>
            )}

            {message && (
                <p className="text-xs text-green-700 text-center">{message}</p>
            )}

            <div className="space-y-4">
                <button
                    type="submit"
                    disabled={loading || code.join("").length !== 6}
                    className="w-full bg-primary hover:bg-secondary text-white py-3.5 px-4 text-xs font-medium tracking-widest uppercase focus:outline-none transition-colors disabled:opacity-60 cursor-pointer"
                >
                    {loading ? "VERIFYING..." : "VERIFY CODE"}
                </button>

                <button
                    type="button"
                    onClick={resendCode}
                    disabled={resending}
                    className="block mx-auto text-[11px] text-black/55 underline hover:text-primary transition-colors disabled:opacity-60 cursor-pointer"
                >
                    {resending ? "Sending..." : "Didn't receive a code? Send again"}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="block mx-auto text-[11px] text-black/55 underline hover:text-primary transition-colors cursor-pointer"
                >
                    Back
                </button>
            </div>
        </form>
    );
}
