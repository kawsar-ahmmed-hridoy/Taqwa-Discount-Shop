import { useState, useEffect } from 'react';
import { saleAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, Loader, RotateCcw } from 'lucide-react';
import RefundModal from './RefundModal';

interface SalesHistoryModalProps {
  onClose: () => void;
}

interface Sale {
  id: number;
  invoiceNo: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
  } | null;
  items?: any[];
  refunds?: any[];
}

const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (value: string | Date) => new Date(value).toLocaleString('en-BD', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const SalesHistoryModal = ({ onClose }: SalesHistoryModalProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await saleAPI.getAll({ limit: 50, page: 1 });
      setSales(res.data.data);
    } catch (err) {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRequestRefund = (sale: Sale) => {
    setSelectedSale(sale);
    setShowRefundModal(true);
  };

  const getRefundStatus = (refunds?: any[] | null) => {
    if (!refunds || refunds.length === 0) return null;
    const latestRefund = refunds[0];
    return latestRefund.status;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
      REFUNDED: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
      APPROVED: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
      REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400' },
      PROCESSED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    };
    const color = colors[status] || colors.COMPLETED;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${color.bg} ${color.text}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="modal-content w-full max-w-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Sales History</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>View your past sales and request refunds</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field h-9 text-[13px] px-3"
            />
          </div>

          {/* Sales List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader size={20} className="text-[#6ea8fe] animate-spin" />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[#8b95a7] text-[13px]">
                No sales found
              </div>
            ) : (
              filteredSales.map((sale) => {
                const refundStatus = getRefundStatus(sale.refunds);
                const canRequestRefund = !refundStatus || refundStatus === 'REJECTED';

                return (
                  <div
                    key={sale.id}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-[13px] font-semibold text-[#f0f2f5]">{sale.invoiceNo}</p>
                          {sale.status && getStatusBadge(sale.status)}
                          {refundStatus && getStatusBadge(refundStatus)}
                        </div>
                        <p className="text-[12px] text-[#8b95a7]">
                          {sale.customer?.name || 'Walk-in Customer'} • {fmtDateTime(sale.createdAt)}
                        </p>
                      </div>
                      <p className="text-[14px] font-semibold text-[#f0f2f5]">
                        ৳{fmt(sale.total)}
                      </p>
                    </div>

                    {sale.items && sale.items.length > 0 && (
                      <div className="mb-3 pt-3 border-t border-white/[0.05]">
                        <p className="text-[11px] text-[#8b95a7] mb-2 uppercase tracking-wider font-semibold">
                          Items ({sale.items.length})
                        </p>
                        <div className="space-y-1">
                          {sale.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-[12px] text-[#c8cdd8]">
                              • {item.product.name} x {item.quantity}
                            </p>
                          ))}
                          {sale.items.length > 2 && (
                            <p className="text-[12px] text-[#8b95a7]">
                              +{sale.items.length - 2} more items
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {sale.refunds && sale.refunds.length > 0 && (
                      <div className="mb-3 pt-3 border-t border-white/[0.05]">
                        <p className="text-[11px] text-[#8b95a7] mb-2 uppercase tracking-wider font-semibold">
                          Refund Requests
                        </p>
                        <div className="space-y-2">
                          {sale.refunds.map((refund) => (
                            <div key={refund.id} className="flex items-center justify-between bg-white/[0.02] p-2 rounded">
                              <div className="flex-1">
                                <p className="text-[12px] text-[#c8cdd8]">
                                  ৳{fmt(refund.amount)} • {refund.reason}
                                </p>
                                <p className="text-[11px] text-[#8b95a7]">
                                  {getStatusBadge(refund.status)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {canRequestRefund && (
                      <button
                        onClick={() => handleRequestRefund(sale)}
                        className="w-full h-8 text-[13px] font-medium text-[#1f6feb] bg-[#1f6feb]/10 rounded-lg hover:bg-[#1f6feb]/20 transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={14} />
                        Request Refund
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedSale && (
        <RefundModal
          sale={selectedSale}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            fetchSales();
            setShowRefundModal(false);
          }}
        />
      )}
    </>
  );
};

export default SalesHistoryModal;
