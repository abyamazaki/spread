"use client";

import React, { useState, useEffect } from "react";
import { useMasters } from "@/lib/hooks";
import { MasterData } from "@/types";
import { useAuth } from "@/lib/AuthContext";

const Masters = () => {
  const { masters, loading, saveMasters } = useMasters();
  const { appUser } = useAuth();
  
  const [localMasters, setLocalMasters] = useState<MasterData>({
    contacts: [],
    owners: [],
    regions: [],
    products: [],
    actions: []
  });

  const [saving, setSaving] = useState(false);
  const [newInputs, setNewInputs] = useState<Record<string, string>>({
    contacts: "",
    owners: "",
    regions: "",
    products: "",
    actions: ""
  });

  useEffect(() => {
    if (masters) {
      setLocalMasters({
        contacts: masters.contacts || [],
        owners: masters.owners || [],
        regions: masters.regions || [],
        products: masters.products || [],
        actions: masters.actions || []
      });
    }
  }, [masters]);

  const handleAddItem = (field: keyof MasterData) => {
    const val = newInputs[field].trim();
    if (!val) return;

    let updated = { ...localMasters };
    if (field === 'products') {
      if (!updated.products.find(p => p.name === val)) {
        updated.products = [...updated.products, { name: val, color: "blue" }];
      }
    } else {
      if (!((updated[field] as string[]).includes(val))) {
        (updated[field] as string[]) = [...(updated[field] as string[]), val];
      }
    }

    setLocalMasters(updated);
    setNewInputs({ ...newInputs, [field]: "" });
  };

  const handleRemoveItem = (field: keyof MasterData, valToRemove: string) => {
    let updated = { ...localMasters };
    if (field === 'products') {
      updated.products = updated.products.filter(p => p.name !== valToRemove);
    } else {
      (updated[field] as string[]) = (updated[field] as string[]).filter(v => v !== valToRemove);
    }
    setLocalMasters(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveMasters(localMasters);
    setSaving(false);
    alert("マスタデータを保存しました");
  };

  const handleLoadDefaults = () => {
    if (!confirm("元々の基準マスタデータを読み込みますか？")) return;
    setLocalMasters({
      contacts: ['展示会','BMS','イプロス','アウトバウンド','サービスLP','人脈・紹介','スマレジユーザー会','スマレジアプリマーケット','代理店','りているの森'],
      owners: ['古宮','福島','山口','藤瀬'],
      regions: ['北海道','東北','関東','中部','関西','中国','四国','九州','沖縄','その他'],
      products: [
        {name:'PitLog',       color:'#00acc1'},
        {name:'PitLog Mobile',color:'#1976d2'},
        {name:'tagEL',        color:'#8b0000'},
        {name:'Owleye',       color:'#7b1fa2'},
        {name:'AXCS',         color:'#43a047'},
        {name:'リテールメディア',color:'#f57c00'}
      ],
      actions: ['アポ調整','オンライン商談','訪問商談','見積提示','サンプル貸出','検討結果待ち','現地調査','PoC','導入作業','レクチャー']
    });
  };

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c3e50]">テナント マスタ設定</h1>
        <div className="flex gap-3">
          {appUser?.role === 'superuser' && (
            <button 
              onClick={handleLoadDefaults}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition"
            >
              🔄 初期データを読込
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#2ecc71] text-white rounded-lg shadow hover:bg-[#27ae60] transition disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* 商材マスタ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex justify-between">
            <span>📦 商材マスタ</span>
            <span className="text-sm font-normal text-gray-400">{localMasters.products.length}件</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {localMasters.products.length === 0 && <span className="text-sm text-gray-400">データなし</span>}
            {localMasters.products.map(p => (
              <span key={p.name} className="flex items-center gap-2 p-1 pl-3 pr-1 bg-blue-50 text-blue-800 rounded-full text-sm">
                {p.name}
                <button onClick={() => handleRemoveItem('products', p.name)} className="w-5 h-5 rounded-full hover:bg-white text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]" 
              placeholder="新しい商材名"
              value={newInputs.products}
              onChange={(e) => setNewInputs({...newInputs, products: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('products')}
            />
            <button onClick={() => handleAddItem('products')} className="px-3 bg-[#3498db] text-white rounded-md text-sm">追加</button>
          </div>
        </div>

        {/* 担当者マスタ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex justify-between">
            <span>👤 担当者マスタ</span>
            <span className="text-sm font-normal text-gray-400">{localMasters.owners.length}件</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {localMasters.owners.length === 0 && <span className="text-sm text-gray-400">データなし</span>}
            {localMasters.owners.map(o => (
              <span key={o} className="flex items-center gap-2 p-1 pl-3 pr-1 bg-gray-100 text-gray-800 rounded-lg text-sm">
                {o}
                <button onClick={() => handleRemoveItem('owners', o)} className="w-5 h-5 rounded-md hover:bg-white text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]" 
              placeholder="新しい担当者名"
              value={newInputs.owners}
              onChange={(e) => setNewInputs({...newInputs, owners: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('owners')}
            />
            <button onClick={() => handleAddItem('owners')} className="px-3 bg-[#3498db] text-white rounded-md text-sm">追加</button>
          </div>
        </div>

        {/* 地域マスタ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex justify-between">
            <span>🗺️ 地域マスタ</span>
            <span className="text-sm font-normal text-gray-400">{localMasters.regions.length}件</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {localMasters.regions.length === 0 && <span className="text-sm text-gray-400">データなし</span>}
            {localMasters.regions.map(r => (
              <span key={r} className="flex items-center gap-2 p-1 pl-3 pr-1 bg-green-50 text-green-800 rounded-full text-sm">
                {r}
                <button onClick={() => handleRemoveItem('regions', r)} className="w-5 h-5 rounded-full hover:bg-white text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]" 
              placeholder="新しい地域"
              value={newInputs.regions}
              onChange={(e) => setNewInputs({...newInputs, regions: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('regions')}
            />
            <button onClick={() => handleAddItem('regions')} className="px-3 bg-[#3498db] text-white rounded-md text-sm">追加</button>
          </div>
        </div>

        {/* 接点マスタ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex justify-between">
            <span>📞 接点（流入元）マスタ</span>
            <span className="text-sm font-normal text-gray-400">{localMasters.contacts.length}件</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {localMasters.contacts.length === 0 && <span className="text-sm text-gray-400">データなし</span>}
            {localMasters.contacts.map(c => (
              <span key={c} className="flex items-center gap-2 p-1 pl-3 pr-1 bg-purple-50 text-purple-800 rounded-full text-sm">
                {c}
                <button onClick={() => handleRemoveItem('contacts', c)} className="w-5 h-5 rounded-full hover:bg-white text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db]" 
              placeholder="ウェブサイト、紹介など"
              value={newInputs.contacts}
              onChange={(e) => setNewInputs({...newInputs, contacts: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem('contacts')}
            />
            <button onClick={() => handleAddItem('contacts')} className="px-3 bg-[#3498db] text-white rounded-md text-sm">追加</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Masters;
