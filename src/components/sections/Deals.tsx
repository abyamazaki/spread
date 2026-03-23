"use client";

import React, { useState } from "react";
import { useDeals } from "@/lib/hooks";
import { DealFormModal } from "../ui/DealFormModal";

const Deals = () => {
  const { deals, loading } = useDeals();
  const [isModalOpen, setModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '成約': return 'bg-green-100 text-green-800';
      case '失注': return 'bg-gray-100 text-gray-800';
      case '商談中': return 'bg-blue-100 text-blue-800';
      case '新規': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">商談管理</h1>
        <button 
          className="btn btn-success px-4 py-2 bg-[#2ecc71] text-white rounded shadow hover:bg-[#27ae60] transition"
          onClick={() => setModalOpen(true)}
        >
          + 新規商談登録
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 text-left w-1/5">顧客名</th>
              <th className="p-3 text-left">商材</th>
              <th className="p-3 text-left">ステータス</th>
              <th className="p-3 text-left">最終商談日</th>
              <th className="p-3 text-left">活動内容</th>
              <th className="p-3 text-left">担当者</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="border-b">
                <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">読み込み中...</td>
              </tr>
            ) : deals.length === 0 ? (
              <tr className="border-b">
                <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">商談履歴がありません</td>
              </tr>
            ) : (
              deals.map(deal => (
                <tr key={deal.id} className="border-b hover:bg-gray-50 transition cursor-pointer">
                  <td className="p-3 font-medium text-[#2c3e50]">{deal.customerName}</td>
                  <td className="p-3 text-gray-600">{deal.product || "-"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(deal.status)}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{deal.date}</td>
                  <td className="p-3 text-gray-500 truncate max-w-[200px]">{deal.activity || "-"}</td>
                  <td className="p-3 text-gray-600">{deal.owner || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <DealFormModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Deals;
