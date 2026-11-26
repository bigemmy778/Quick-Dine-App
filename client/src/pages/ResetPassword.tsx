import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

//This is where the emailed link lands. It reads ?token= from the URL, so it doesn’t need a router library.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";


export default function ResetPassword() {
    const token =
    new URLSearchParams(window.location.search).get("token") ??
    window.location.pathname.split("/").filter(Boolean)[1] ??
    "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) return setError("Use at least 8 characters");
        if (password !== confirm) return setError("Passwords do not match");

        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resetToken: token, password }),
            });

            if (!res.ok) throw new Error("invalid");
            setDone(true);
        } catch {
            setError("This reset link is invalid or has expired. Please request a new one.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full pl-7 pb-2 pt-1 text-sm bg-transparent border-b border-outline-variant/60 focus:border-secondary focus:outline-none transition-colors";
    const labelClass = "block text-left text-[10px] font-medium text-black/55 tracking-wider uppercase";
    const buttonClass =
        "block w-full bg-primary hover:bg-secondary text-white py-3.5 px-4 text-center text-xs font-medium tracking-widest uppercase focus:outline-none transition-colors disabled:opacity-75 cursor-pointer";

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
            <div className="w-full max-w-md bg-white border border-outline-variant/30 ambient-shadow rounded-lg p-8">
                {!token ? (
                    <div className="space-y-6 text-center">
                        <h1 className="font-display text-2xl font-medium text-primary tracking-tight">Link not valid</h1>
                        <p className="text-xs text-black/55 leading-relaxed">
                            This reset link is missing or incomplete. Request a new one from the sign-in screen.
                        </p>
                        <a href="/" className={buttonClass}>BACK TO QUICKDINE</a>
                    </div>
                ) : done ? (
                    <div className="space-y-6 text-center">
                        <h1 className="font-display text-2xl font-medium text-primary tracking-tight">Password updated</h1>
                        <p className="text-xs text-black/55 leading-relaxed">You can now sign in with your new password.</p>
                        <a href="/" className={buttonClass}>SIGN IN</a>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        <div className="text-center">
                            <h1 className="font-display text-2xl font-medium text-primary tracking-tight">
                                Set a new password
                            </h1>
                            <p className="text-xs text-black/55 mt-2 leading-relaxed">
                                Choose a strong password you haven't used before.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1">
                                <label className={labelClass}>NEW PASSWORD</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pr-3 pointer-events-none text-black/55">
                                        <Lock size={16} />
                                    </span>
                                    <input
                                        type={show ? "text" : "password"}
                                        value={password}
                                        autoComplete="new-password"
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (error) setError("");
                                        }}
                                        placeholder="At least 8 characters"
                                        className={`${inputClass} pr-8`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShow((s) => !s)}
                                        className="absolute inset-y-0 right-0 flex items-center text-black/55 hover:text-primary cursor-pointer"
                                        aria-label={show ? "Hide password" : "Show password"}
                                    >
                                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelClass}>CONFIRM PASSWORD</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pr-3 pointer-events-none text-black/55">
                                        <Lock size={16} />
                                    </span>
                                    <input
                                        type={show ? "text" : "password"}
                                        value={confirm}
                                        autoComplete="new-password"
                                        onChange={(e) => {
                                            setConfirm(e.target.value);
                                            if (error) setError("");
                                        }}
                                        placeholder="Repeat your password"
                                        className={inputClass}
                                    />
                                </div>
                                {error && <p className="text-xs text-red-600 pt-1">{error}</p>}
                            </div>
                        </div>

                        <button type="submit" disabled={loading || !password || !confirm} className={buttonClass}>
                            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}