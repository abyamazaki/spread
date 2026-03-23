import React, { useState } from "react";
import { Modal } from "./Modal";
import { useDeals, useCompanies, useMasters } from "@/lib/hooks";

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealFormModal: React.FC<DealFormModalProps> = ({ isOpen, onClose }) => {
  const { addDeal } = useDeals();
  const { companies } = useCompanies();
  const { masters } = useMasters();

  const [formData, setFormData] = useState({
    customerId: "",
    product: "",
    status: "新規" as any,
    date: new Date().toISOString().split("T")[0],
    activity: "",
    nextAction: "",
    owner: "",
    salesType: "グループ内",
    initialCost: 0,
    monthlyCost: 0,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.date) return;
    
    const company = companies.find(c => c.id === formData.customerId);
    if (!company) return;

    setSaving(true);
    try {
      await addDeal({
        ...formData,
        customerName: company.name
      });
      setFormData({
        customerId: "",
        product: "",
        status: "新規",
        date: new Date().toISOString().split("T")[0],
        activity: "",
        nextAction: "",
        owner: "",
        salesType: "グループ内",
        initialCost: 0,
        monthlyCost: 0,
      });
      onClose();
    } catch (error) {
      console.error("Error adding deal:", error);
      alert("エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="商談登録">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">顧客（会社） <span className="text-red-500">*</span></label>
          <select
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          >
            <option value="">選択してください</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商材</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            >
              <option value="">選択してください</option>
              {masters?.products?.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="新規">新規</option>
              <option value="接触済">接触済</option>
              <option value="商談中">商談中</option>
              <option value="成約">成約</option>
              <option value="失注">失注</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商談日 <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            >
              <option value="">選択してください</option>
              {masters?.owners?.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活動内容</label>
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            rows={2}
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ネクストアクション</label>
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            rows={2}
            value={formData.nextAction}
            onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
          />
        </div>

        <div className="pt-4 border-t mt-4">
          <p className="text-sm text-gray-500 mb-3 block">見込み情報 (オプション)</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">販売種別</label>
              <select
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                value={formData.salesType}
                onChange={(e) => setFormData({ ...formData, salesType: e.target.value })}
              >
                <option value="グループ内">グループ内</option>
                <option value="外販">外販</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">初期費用</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                value={formData.initialCost}
                onChange={(e) => setFormData({ ...formData, initialCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">月額費用</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                value={formData.monthlyCost}
                onChange={(e) => setFormData({ ...formData, monthlyCost: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-100 mt-2 py-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#2ecc71] text-white rounded-md hover:bg-[#27ae60] disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
