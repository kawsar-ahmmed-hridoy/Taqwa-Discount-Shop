import { useState } from 'react';
import { saleAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, AlertCircle, Loader } from 'lucide-react';

interface RefundModalProps {
  sale: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RefundModal = ({ sale, onClose, onSuccess }: RefundModalProps) => {
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState(sale.total);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }
    
    if (amount <= 0 || amount > sale.total) {
      toast.error(`Refund amount must be between 0 and ৳${fmt(sale.total)}`);
      return;
    }

    setLoading(true);
    try {
      await saleAPI.requestRefund({
        saleId: sale.id,
        reason: reason.trim(),
        amount: parseFloat(amount as any),
        notes: notes.trim() || undefined,
      });
      toast.success('Refund request created successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create refund request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="modal-content w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Request Refund</p>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Invoice: {sale.invoiceNo}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Sale Summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#8b95a7]">Subtotal</span>
              <span className="text-[#f0f2f5]">৳{fmt(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#8b95a7]">Discount</span>
              <span className="text-[#f0f2f5]">৳{fmt(sale.discount)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#8b95a7]">VAT</span>
              <span className="text-[#f0f2f5]">৳{fmt(sale.vat)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-semibold border-t border-white/[0.05] pt-2">
              <span className="text-[#f0f2f5]">Total</span>
              <span className="text-[#6ea8fe]">৳{fmt(sale.total)}</span>
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3a404f] mb-2 block">
              Refund Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b95a7]">৳</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={sale.total}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="input-field h-9 text-[13px] pl-6 pr-3"
              />
            </div>
            <p className="text-[11px] text-[#8b95a7] mt-1">
              Max: ৳{fmt(sale.total)}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3a404f] mb-2 block">
              Refund Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field h-9 text-[13px] px-3"
            >
              <option value="">Select a reason...</option>
              <option value="DAMAGED">Damaged Product</option>
              <option value="DEFECTIVE">Defective Product</option>
              <option value="WRONG_ITEM">Wrong Item Sent</option>
              <option value="QUALITY_ISSUE">Quality Issue</option>
              <option value="NOT_AS_DESCRIBED">Not as Described</option>
              <option value="CUSTOMER_REQUEST">Customer Request</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3a404f] mb-2 block">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional details..."
              rows={3}
              className="input-field px-3 py-2 text-[13px] resize-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-200">
              Refund requests require approval from a manager before processing.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--card-bg)' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 px-4 text-[13px] font-medium text-[#8b95a7] bg-white/[0.05] border border-white/[0.07] rounded-lg hover:bg-white/[0.08] hover:text-[#c8cdd8] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-9 px-4 text-[13px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1f6feb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader size={14} className="animate-spin" />}
            Request Refund
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
