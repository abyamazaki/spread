import React, { useState } from "react";
import { Modal } from "./Modal";
import { useBranches, useCompanies, useMasters } from "@/lib/hooks";

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({ isOpen, onClose }) => {
  const { addBranch } = useBranches();
  const { companies } = useCompanies();
  const { masters } = useMasters();

  const [formData, setFormData] = useState({
    companyId: "",
    name: "",
    address: "",
    phone: "",
    devices: 0,
    owner: "",
    product: "",
    salesType: "" as "グループ内" | "外販" | "",
    initialCost: 0,
    monthlyCost: 0,
    startMonth: "",
    endMonth: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId || !formData.name) return;
    
    const company = companies.find(c => c.id === formData.companyId);
    if (!company) return;

    setSaving(true);
    try {
      await addBranch({
        ...formData,
        companyName: company.name
      });
      setFormData({
        companyId: "",
        name: "",
        address: "",
        phone: "",
        devices: 0,
        owner: "",
        product: "",
        salesType: "",
        initialCost: 0,
        monthlyCost: 0,
        startMonth: "",
        endMonth: "",
        notes: "",
      });
      onClose();
    } catch (error) {
      console.error("Error adding branch:", error);
      alert("エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="拠点登録">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">対象会社 <span className="text-red-500">*</span></label>
          <select
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            value={formData.companyId}
            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
          >
            <option value="">選択してください</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">拠点名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">販売種別</label>
            <select
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.salesType}
              onChange={(e) => setFormData({ ...formData, salesType: e.target.value as any })}
            >
              <option value="">選択してください</option>
              <option value="グループ内">グループ内</option>
              <option value="外販">外販</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">デバイス数</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.devices}
              onChange={(e) => setFormData({ ...formData, devices: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">利用開始月</label>
            <input
              type="month"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.startMonth}
              onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">利用終了月</label>
            <input
              type="month"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
              value={formData.endMonth}
              onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3498db]"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
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
