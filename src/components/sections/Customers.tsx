"use client";

import React, { useState } from "react";
import { useCompanies, useBranches } from "@/lib/hooks";
import { CompanyFormModal } from "../ui/CompanyFormModal";
import { BranchFormModal } from "../ui/BranchFormModal";

const Customers: React.FC = () => {
  const [activeTab, setActiveTab] = useState("company");
  const { companies, loading: compLoading } = useCompanies();
  const { branches, loading: branchLoading } = useBranches();
  
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
  const [isBranchModalOpen, setBranchModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">顧客管理</h1>
        <div className="flex gap-3">
          <button 
            className="btn btn-primary px-4 py-2 bg-[#3498db] text-white rounded shadow hover:bg-[#2980b9] transition"
            onClick={() => setCompanyModalOpen(true)}
          >
            ＋ 会社登録
          </button>
          <button 
            className="btn btn-success px-4 py-2 bg-[#2ecc71] text-white rounded shadow hover:bg-[#27ae60] transition"
            onClick={() => setBranchModalOpen(true)}
          >
            ＋ 拠点登録
          </button>
        </div>
      </div>

      <nav className="flex gap-4 border-b-2 border-[#e9ecef] mb-6">
        <div
          className={`px-5 py-2.5 cursor-pointer font-medium transition-all ${
            activeTab === "company" ? "text-[#3498db] border-b-4 border-[#3498db]" : "text-gray-400 hover:text-[#2c3e50]"
          }`}
          onClick={() => setActiveTab("company")}
        >
          🏢 会社一覧
        </div>
        <div
          className={`px-5 py-2.5 cursor-pointer font-medium transition-all ${
            activeTab === "branch" ? "text-[#3498db] border-b-4 border-[#3498db]" : "text-gray-400 hover:text-[#2c3e50]"
          }`}
          onClick={() => setActiveTab("branch")}
        >
          📍 拠点一覧
        </div>
      </nav>

      {activeTab === "company" ? (
        <div className="bg-white rounded-xl shadow-sm p-6 overflow-hidden">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" className="p-2 border rounded-md" placeholder="会社名で検索..." />
            <select className="p-2 border rounded-md">
              <option value="">すべての接点</option>
            </select>
            <select className="p-2 border rounded-md">
              <option value="">すべての担当者</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left w-1/4">会社名</th>
                  <th className="p-3 text-left">接点</th>
                  <th className="p-3 text-left">地域</th>
                  <th className="p-3 text-left">担当者</th>
                  <th className="p-3 text-left">連絡先</th>
                  <th className="p-3 text-left">備考</th>
                </tr>
              </thead>
              <tbody>
                {compLoading ? (
                  <tr className="border-b">
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">読み込み中...</td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">会社登録がありません</td>
                  </tr>
                ) : (
                  companies.map(company => (
                    <tr key={company.id} className="border-b hover:bg-gray-50 transition cursor-pointer">
                      <td className="p-3 font-medium text-[#2c3e50]">{company.name}</td>
                      <td className="p-3">
                        {company.contactPoint ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{company.contactPoint}</span>
                        ) : null}
                      </td>
                      <td className="p-3 text-gray-600">{company.region || "-"}</td>
                      <td className="p-3 text-gray-600">{company.owner || "-"}</td>
                      <td className="p-3 text-sm text-gray-500">
                        {company.phone && <div className="truncate">{company.phone}</div>}
                        {company.email && <div className="truncate">{company.email}</div>}
                        {!company.phone && !company.email && "-"}
                      </td>
                      <td className="p-3 text-sm text-gray-500 truncate max-w-[150px]">{company.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" className="p-2 border rounded-md" placeholder="拠点名で検索..." />
            <select className="p-2 border rounded-md">
              <option value="">すべての会社</option>
            </select>
            <select className="p-2 border rounded-md">
              <option value="">すべての商材</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left">会社名</th>
                  <th className="p-3 text-left">拠点名</th>
                  <th className="p-3 text-left">住所</th>
                  <th className="p-3 text-left">デバイス数</th>
                  <th className="p-3 text-left">商材</th>
                  <th className="p-3 text-left">初期 / 月額</th>
                  <th className="p-3 text-left">担当</th>
                </tr>
              </thead>
              <tbody>
                {branchLoading ? (
                  <tr className="border-b">
                    <td colSpan={7} className="text-center py-20 text-gray-400 font-medium">読み込み中...</td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan={7} className="text-center py-20 text-gray-400 font-medium">拠点登録がありません</td>
                  </tr>
                ) : (
                  branches.map(branch => (
                    <tr key={branch.id} className="border-b hover:bg-gray-50 transition cursor-pointer">
                      <td className="p-3 font-medium text-gray-700">{branch.companyName}</td>
                      <td className="p-3 font-medium text-[#2c3e50]">{branch.name}</td>
                      <td className="p-3 text-gray-600 truncate max-w-[150px]">{branch.address || "-"}</td>
                      <td className="p-3 text-gray-600">{branch.devices || 0}</td>
                      <td className="p-3 text-gray-600">
                        {branch.product && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{branch.product}</span>}
                      </td>
                      <td className="p-3 text-gray-600">
                        {(branch.initialCost || branch.monthlyCost) ? (
                          <>
                            <div>初: ¥{branch.initialCost?.toLocaleString() || 0}</div>
                            <div>月: ¥{branch.monthlyCost?.toLocaleString() || 0}</div>
                          </>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-gray-600">{branch.owner || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CompanyFormModal isOpen={isCompanyModalOpen} onClose={() => setCompanyModalOpen(false)} />
      <BranchFormModal isOpen={isBranchModalOpen} onClose={() => setBranchModalOpen(false)} />
    </div>
  );
};

export default Customers;
