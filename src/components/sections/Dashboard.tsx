"use client";

import React, { useMemo } from "react";
import { useCompanies, useDeals, useBranches, useAgentCustomers } from "@/lib/hooks";

const Dashboard: React.FC = () => {
  const { companies } = useCompanies();
  const { deals } = useDeals();
  const { branches } = useBranches();
  const { agentCustomers } = useAgentCustomers();

  // Metrics calculations
  const totalMRR = useMemo(() => {
    let mrr = 0;
    branches.forEach(b => { mrr += (b.monthlyCost || 0); });
    agentCustomers.forEach(ac => { mrr += (ac.monthlyCost || 0); });
    deals.filter(d => d.status === '成約').forEach(d => { mrr += (d.monthlyCost || 0); });
    return mrr;
  }, [branches, agentCustomers, deals]);

  const wonDeals = deals.filter(d => d.status === "成約");
  const activeDeals = deals.filter(d => d.status === "商談中");
  
  const stats = [
    { title: "総顧客数 (会社)", value: companies.length.toString(), change: `拠点数: ${branches.length}` },
    { title: "商談中", value: activeDeals.length.toString(), change: "進行中の案件" },
    { title: "成約数", value: wonDeals.length.toString(), change: "実績ベース" },
    { title: "MRR (月次収益)", value: `¥${totalMRR.toLocaleString()}`, change: "概算予測" },
  ];

  const statuses = ["新規", "接触済", "商談中", "成約", "失注"];
  const maxDeals = Math.max(...statuses.map(s => deals.filter(d => d.status === s).length), 1);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">🚀 ダッシュボード</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#3498db]">
            <div className="text-sm text-gray-400 mb-2 font-medium">{stat.title}</div>
            <div className="text-3xl font-bold text-[#2c3e50] mb-2">{stat.value}</div>
            <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 inline-block rounded">
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6 text-[#2c3e50]">商談パイプライン</h2>
        <div className="flex items-end gap-5 h-48 bg-gray-50 p-6 rounded-lg relative">
          {statuses.map((status) => {
            const count = deals.filter(d => d.status === status).length;
            const height = (count / maxDeals) * 100;
            const colors: Record<string, string> = { 
              "新規": "from-blue-500 to-blue-300", 
              "接触済": "from-orange-500 to-orange-300", 
              "商談中": "from-purple-500 to-purple-300", 
              "成約": "from-green-500 to-green-300", 
              "失注": "from-red-500 to-red-300" 
            };
            return (
              <div 
                key={status}
                className="flex-1 flex flex-col justify-end items-center group relative h-full"
              >
                <div 
                  className={`w-full bg-gradient-to-t ${colors[status]} rounded-t-lg transition-all duration-700 ease-in-out shadow-sm`}
                  style={{ height: `${count === 0 ? 2 : height}%` }}
                ></div>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-black text-white px-3 py-1 rounded text-xs transition whitespace-nowrap z-10 pointer-events-none">
                  {status}: {count}件
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-xs font-medium text-gray-500 px-6">
          <span>新規</span>
          <span>接触済</span>
          <span>商談中</span>
          <span>成約</span>
          <span>失注</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4 text-[#2c3e50]">最近の活動 (商談)</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left">日時</th>
              <th className="px-4 py-3 text-left">顧客名</th>
              <th className="px-4 py-3 text-left">商材</th>
              <th className="px-4 py-3 text-left">活動内容</th>
              <th className="px-4 py-3 text-left">担当者</th>
              <th className="px-4 py-3 text-left">状態</th>
            </tr>
          </thead>
          <tbody>
            {deals.slice(0, 5).map((deal) => (
              <tr key={deal.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{deal.date}</td>
                <td className="px-4 py-3 font-medium text-[#2c3e50]">{deal.customerName}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{deal.product || "-"}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{deal.activity || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{deal.owner || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-sm text-xs ${deal.status === '成約' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {deal.status}
                  </span>
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">データがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
