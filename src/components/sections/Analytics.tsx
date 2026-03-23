"use client";
import React from "react";
const Analytics = () => (
  <div className="space-y-6 animate-in slide-in-from-right duration-500">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-[#2c3e50]">分析ダッシュボード</h1>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card h-64 flex items-center justify-center text-gray-400">商材別商談数 (Chart)</div>
      <div className="card h-64 flex items-center justify-center text-gray-400">地域別顧客数 (Chart)</div>
      <div className="card h-64 flex items-center justify-center text-gray-400 md:col-span-2">売上実績 vs 計画 (Detailed Chart)</div>
    </div>
  </div>
);
export default Analytics;
