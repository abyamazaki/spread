"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const PendingTenant: React.FC = () => {
  const { appUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-10">
        <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">テナントが未割り当てです</h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          ようこそ <strong>{appUser?.name}</strong> さん。<br />
          あなたのアカウントは現在、どの組織・企業（テナント）にも紐付いていません。<br />
          システム管理者に連絡して、テナントへ招待してもらってください。
        </p>
        
        <button
          onClick={() => signOut(auth)}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
};

export default PendingTenant;
