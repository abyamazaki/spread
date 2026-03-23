"use client";

import React, { useState } from "react";
import { useAgents, useAgentCustomers } from "@/lib/hooks";
import { AgentFormModal } from "../ui/AgentFormModal";
import { AgentCustomerFormModal } from "../ui/AgentCustomerFormModal";

const Agents: React.FC = () => {
  const [activeTab, setActiveTab] = useState("agent");
  const { agents, loading: agentsLoading } = useAgents();
  const { agentCustomers, loading: customersLoading } = useAgentCustomers();
  
  const [isAgentModalOpen, setAgentModalOpen] = useState(false);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">代理店管理</h1>
        <div className="flex gap-3">
          <button 
            className="btn btn-primary px-4 py-2 bg-[#3498db] text-white rounded shadow hover:bg-[#2980b9] transition"
            onClick={() => setAgentModalOpen(true)}
          >
            ＋ 代理店登録
          </button>
          <button 
            className="btn btn-success px-4 py-2 bg-[#2ecc71] text-white rounded shadow hover:bg-[#27ae60] transition"
            onClick={() => setCustomerModalOpen(true)}
          >
            ＋ 顧客登録
          </button>
        </div>
      </div>

      <nav className="flex gap-4 border-b-2 border-[#e9ecef] mb-6">
        <div
          className={`px-5 py-2.5 cursor-pointer font-medium transition-all ${
            activeTab === "agent" ? "text-[#3498db] border-b-4 border-[#3498db]" : "text-gray-400 hover:text-[#2c3e50]"
          }`}
          onClick={() => setActiveTab("agent")}
        >
          🤝 代理店一覧
        </div>
        <div
          className={`px-5 py-2.5 cursor-pointer font-medium transition-all ${
            activeTab === "customer" ? "text-[#3498db] border-b-4 border-[#3498db]" : "text-gray-400 hover:text-[#2c3e50]"
          }`}
          onClick={() => setActiveTab("customer")}
        >
          🏢 顧客一覧
        </div>
      </nav>

      {activeTab === "agent" ? (
        <div className="bg-white rounded-xl shadow-sm p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left w-1/4">代理店名</th>
                  <th className="p-3 text-left">地域</th>
                  <th className="p-3 text-left">接点</th>
                  <th className="p-3 text-left">担当者</th>
                  <th className="p-3 text-left">連絡先</th>
                  <th className="p-3 text-left">備考</th>
                </tr>
              </thead>
              <tbody>
                {agentsLoading ? (
                  <tr className="border-b">
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">読み込み中...</td>
                  </tr>
                ) : agents.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">代理店登録がありません</td>
                  </tr>
                ) : (
                  agents.map(agent => (
                    <tr key={agent.id} className="border-b hover:bg-gray-50 transition cursor-pointer">
                      <td className="p-3 font-medium text-[#2c3e50]">{agent.name}</td>
                      <td className="p-3 text-gray-600">{agent.region || "-"}</td>
                      <td className="p-3">
                        {agent.contactPoint ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{agent.contactPoint}</span>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-gray-600">{agent.owner || "-"}</td>
                      <td className="p-3 text-sm text-gray-500">
                        {agent.phone && <div className="truncate">{agent.phone}</div>}
                        {agent.email && <div className="truncate">{agent.email}</div>}
                        {!agent.phone && !agent.email && "-"}
                      </td>
                      <td className="p-3 text-sm text-gray-500 truncate max-w-[150px]">{agent.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left">代理店名</th>
                  <th className="p-3 text-left">顧客名</th>
                  <th className="p-3 text-left">商材</th>
                  <th className="p-3 text-left">販売種別</th>
                  <th className="p-3 text-left">初期 / 月額</th>
                  <th className="p-3 text-left">期間</th>
                </tr>
              </thead>
              <tbody>
                {customersLoading ? (
                  <tr className="border-b">
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">読み込み中...</td>
                  </tr>
                ) : agentCustomers.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">顧客登録がありません</td>
                  </tr>
                ) : (
                  agentCustomers.map(ac => (
                    <tr key={ac.id} className="border-b hover:bg-gray-50 transition cursor-pointer">
                      <td className="p-3 font-medium text-gray-700">{ac.agentName}</td>
                      <td className="p-3 font-medium text-[#2c3e50]">{ac.name}</td>
                      <td className="p-3 text-gray-600">
                        {ac.product && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{ac.product}</span>}
                      </td>
                      <td className="p-3 text-gray-600">{ac.salesType || "-"}</td>
                      <td className="p-3 text-gray-600">
                        {(ac.initialCost || ac.monthlyCost) ? (
                          <>
                            <div>初: ¥{ac.initialCost?.toLocaleString() || 0}</div>
                            <div>月: ¥{ac.monthlyCost?.toLocaleString() || 0}</div>
                          </>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {ac.startMonth ? ac.startMonth : "-"} ~ {ac.endMonth ? ac.endMonth : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AgentFormModal isOpen={isAgentModalOpen} onClose={() => setAgentModalOpen(false)} />
      <AgentCustomerFormModal isOpen={isCustomerModalOpen} onClose={() => setCustomerModalOpen(false)} />
    </div>
  );
};

export default Agents;
