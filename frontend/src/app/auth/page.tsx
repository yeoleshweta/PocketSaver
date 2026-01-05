// src/app/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const validateForm = () => {
    if (!email || !password || (mode === "register" && !name)) {
      setMessage("❌ Please fill in all fields");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage("❌ Please enter a valid email");
      return false;
    }
    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);

      if (result.success) {
        setMessage(
          mode === "login"
            ? "✅ Login successful!"
            : "✅ Registration successful! Please log in."
        );
        if (mode === "register") setMode("login");
      } else {
        setMessage(`❌ ${result.message || "Operation failed"}`);
      }
    } catch {
      setMessage("❌ An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === "login"
            ? "Login to PocketSaver"
            : "Register for PocketSaver"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full p-3 border rounded"
              disabled={isSubmitting}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 border rounded"
            disabled={isSubmitting}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className="w-full p-3 border rounded"
            disabled={isSubmitting}
            minLength={6}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white p-3 rounded"
          >
            {isSubmitting
              ? "Processing…"
              : mode === "login"
              ? "Login"
              : "Register"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <p
          className="mt-4 text-center text-blue-500 cursor-pointer"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Don't have an account? Register."
            : "Have an account? Login."}
        </p>
      </div>
    </div>
  );
}
