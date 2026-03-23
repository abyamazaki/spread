"use client";

import React, { useMemo } from "react";
import { useDeals, useBranches, useAgentCustomers, useMasters } from "@/lib/hooks";

const Sales: React.FC = () => {
  const { deals, loading: dealsLoading } = useDeals();
  const { branches, loading: branchesLoading } = useBranches();
  const { agentCustomers, loading: acLoading } = useAgentCustomers();
  const { masters, loading: mastersLoading } = useMasters();

  const loading = dealsLoading || branchesLoading || acLoading || mastersLoading;

  // Fiscal year months array (April to March)
  const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

  const salesData = useMemo(() => {
    if (loading) return [];
    
    // Get unique products
    const productSet = new Set<string>();
    
    // Gather all revenue-generating items
    const allItems: any[] = [];

    // Deals (Won)
    deals.filter(d => d.status === '成約').forEach(d => {
      productSet.add(d.product || '未分類');
      // d.date is "YYYY-MM-DD"
      const start = d.date ? d.date.substring(0, 7) : ''; 
      allItems.push({
        product: d.product || '未分類',
        initial: Number(d.initialCost) || 0,
        monthly: Number(d.monthlyCost) || 0,
        startMonth: start, // "YYYY-MM"
        endMonth: ''
      });
    });

    // Branches
    branches.forEach(b => {
      productSet.add(b.product || '未分類');
      allItems.push({
        product: b.product || '未分類',
        initial: Number(b.initialCost) || 0,
        monthly: Number(b.monthlyCost) || 0,
        startMonth: b.startMonth || '',
        endMonth: b.endMonth || ''
      });
    });

    // Agent Customers
    agentCustomers.forEach(ac => {
      productSet.add(ac.product || '未分類');
      allItems.push({
        product: ac.product || '未分類',
        initial: Number(ac.initialCost) || 0,
        monthly: Number(ac.monthlyCost) || 0,
        startMonth: ac.startMonth || '',
        endMonth: ac.endMonth || ''
      });
    });

    if (masters?.products) {
       masters.products.forEach(p => productSet.add(p.name));
    }

    // Current Fiscal Year calculation assuming current year is 2026 for instance
    // To make it dynamic, we use current date
    const now = new Date();
    let currentYear = now.getFullYear();
    // If we refer to "fiscal year starting April", Jan-Mar belong to previous year
    if (now.getMonth() < 3) currentYear -= 1;

    // Helper to check if a "YYYY-MM" falls in or before a specific month/year
    const isActiveInMonth = (itemStart: string, itemEnd: string, checkYear: number, checkMonth: number) => {
      if (!itemStart) return false;
      const [sYr, sMo] = itemStart.split('-').map(Number);
      if (checkYear < sYr || (checkYear === sYr && checkMonth < sMo)) return false; // Not started yet

      if (itemEnd) {
        const [eYr, eMo] = itemEnd.split('-').map(Number);
        if (checkYear > eYr || (checkYear === eYr && checkMonth > eMo)) return false; // Already ended
      }
      return true;
    };

    const isStartMonth = (itemStart: string, checkYear: number, checkMonth: number) => {
       if (!itemStart) return false;
       const [sYr, sMo] = itemStart.split('-').map(Number);
       return (checkYear === sYr && checkMonth === sMo);
    };

    const productStats = Array.from(productSet).map(prod => {
      const prodItems = allItems.filter(i => i.product === prod);
      
      const monthlyRevenues = months.map(m => {
        const checkYear = m >= 4 ? currentYear : currentYear + 1;
        let rev = 0;
        prodItems.forEach(item => {
          if (isStartMonth(item.startMonth, checkYear, m)) {
            rev += item.initial;
          }
          if (isActiveInMonth(item.startMonth, item.endMonth, checkYear, m)) {
            rev += item.monthly;
          }
        });
        return rev;
      });

      const total = monthlyRevenues.reduce((sum, val) => sum + val, 0);

      return {
        product: prod,
        monthlyRevenues,
        total
      };
    }).sort((a,b) => b.total - a.total);

    return productStats;
  }, [loading, deals, branches, agentCustomers, masters]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">売上管理</h1>
        <div className="flex gap-3">
          <button className="btn btn-primary px-4 py-2 bg-[#3498db] text-white rounded shadow hover:bg-[#2980b9] transition">
            📋 売上計画
          </button>
          <button className="btn btn-success px-4 py-2 bg-[#2ecc71] text-white rounded shadow hover:bg-[#27ae60] transition">
            + 実績エクスポート
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-6 text-[#2c3e50] border-l-4 border-[#3498db] pl-3">商材別 年度売上実績 (概算)</h3>
        
        {loading ? (
           <p className="text-gray-500 py-10 text-center">計算中...</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-[#f8fafc] border-y-2 border-gray-200">
              <tr>
                <th className="p-3 text-left font-bold text-gray-700 w-1/5">商材</th>
                {months.map(m => (
                  <th key={m} className="p-2 text-right text-gray-600 font-semibold">{m}月</th>
                ))}
                <th className="p-3 text-right font-bold text-[#3498db]">年度合計</th>
              </tr>
            </thead>
            <tbody>
              {salesData.length === 0 && (
                <tr>
                  <td colSpan={14} className="text-center py-20 text-gray-400 font-medium">実績データがありません</td>
                </tr>
              )}
              {salesData.map((row) => (
                <tr key={row.product} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium text-[#2c3e50] bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {row.product}
                  </td>
                  {row.monthlyRevenues.map((rev, idx) => (
                    <td key={idx} className="p-2 text-right text-gray-600 font-mono">
                      {rev > 0 ? `¥${rev.toLocaleString()}` : "-"}
                    </td>
                  ))}
                  <td className="p-3 text-right font-bold bg-[#f8fafc] text-[#2c3e50]">
                     ¥{row.total.toLocaleString()}
                  </td>
                </tr>
              ))}
              {salesData.length > 0 && (
                <tr className="bg-[#f0f4f8] border-t-2 border-gray-200 font-bold">
                  <td className="p-3 text-left text-[#2c3e50] sticky left-0 bg-[#f0f4f8] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">合計</td>
                  {months.map((m, idx) => {
                    const monthlyTotal = salesData.reduce((sum, row) => sum + row.monthlyRevenues[idx], 0);
                    return (
                      <td key={idx} className="p-2 text-right text-[#2c3e50]">
                         {monthlyTotal > 0 ? `¥${monthlyTotal.toLocaleString()}` : "-"}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right text-[#3498db] text-sm">
                    ¥{salesData.reduce((sum, row) => sum + row.total, 0).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Sales;
