"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Auto-assign properties on registration
        // We will make the first registered user a superuser just for testing purposes.
        // In a real app, this should be done via Firebase Functions or manual DB edit.
        const isFirstUser = email.includes("superuser") || email.includes("admin"); // Simplistic demo logic
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.email?.split("@")[0] || "User",
          tenantId: null, // User has no tenant upon initial signup
          role: isFirstUser ? "superuser" : "user", 
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">CRM2</h1>
          <p className="text-gray-500">次世代のクラウドCRM</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#3498db] text-white rounded-lg font-medium hover:bg-[#2980b9] transition disabled:opacity-50"
          >
            {loading ? "処理中..." : isLogin ? "ログイン" : "アカウント作成"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">
            {isLogin ? "アカウントをお持ちでない場合は" : "既にアカウントをお持ちの場合は"}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-[#3498db] font-medium hover:underline"
          >
            {isLogin ? "新規登録" : "ログイン"}
          </button>
        </div>
      </div>
    </div>
  );
};
