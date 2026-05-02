import { useState, useEffect } from 'react';
import { saleAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Clock, ChevronDown, Loader, RefreshCw } from 'lucide-react';

const Refunds = () => {
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processed'>('all');
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<number | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await saleAPI.getAll({ limit: 100, page: 1 });
      const allRefunds = res.data.data
        .flatMap((sale: any) =>
          sale.refunds?.map((refund: any) => ({ ...refund, sale })) || []
        )
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRefundRequests(allRefunds);
    } catch (err) {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refundId: number) => {
    setProcessingId(refundId);
    try {
      await saleAPI.approveRefund(refundId);
      toast.success('Refund approved');
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve refund');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (refundId: number) => {
    if (!rejectReason[refundId]?.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(refundId);
    try {
      await saleAPI.rejectRefund(refundId, { reason: rejectReason[refundId] });
      toast.success('Refund rejected');
      setRejectReason((prev) => {
        const newState = { ...prev };
        delete newState[refundId];
        return newState;
      });
      setShowRejectForm(null);
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject refund');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcess = async (refundId: number) => {
    setProcessingId(refundId);
    try {
      await saleAPI.processRefund(refundId);
      toast.success('Refund processed successfully');
      fetchRefunds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock },
      APPROVED: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle2 },
      REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
      PROCESSED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
    };
    const color = colors[status] || colors.PENDING;
    const Icon = color.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium ${color.bg} ${color.text}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDateTime = (value: string | Date) => new Date(value).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filteredRequests =
    filter === 'all'
      ? refundRequests
      : refundRequests.filter((r) => r.status === filter);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#f0f2f5]">Refund Requests</h1>
          <p className="text-[13px] text-[#8b95a7] mt-1">Manage and process refund requests from customers</p>
        </div>
        <button
          onClick={() => fetchRefunds()}
          disabled={loading}
          className="flex items-center gap-2 px-4 h-9 text-[13px] font-medium text-[#1f6feb] bg-[#1f6feb]/10 rounded-lg hover:bg-[#1f6feb]/20 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'processed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 h-9 text-[12px] font-medium rounded-lg transition-all uppercase tracking-wider ${
              filter === f
                ? 'bg-[#1f6feb] text-white'
                : 'bg-white/[0.05] text-[#8b95a7] hover:bg-white/[0.08] hover:text-[#c8cdd8]'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Refund List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#8b95a7]">
            <Loader size={20} className="animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-12 text-center">
            <p className="text-[#8b95a7] text-[13px]">No refund requests found</p>
          </div>
        ) : (
          filteredRequests.map((refund) => (
            <div
              key={refund.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-all"
            >
              {/* Main Card */}
              <button
                onClick={() => setExpandedId(expandedId === refund.id ? null : refund.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all text-left"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-[13px] font-semibold text-[#f0f2f5]">{refund.sale.invoiceNo}</p>
                    {getStatusBadge(refund.status)}
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="text-[#8b95a7]">
                      {refund.sale.customer?.name || 'Walk-in'}
                    </span>
                    <span className="text-[#8b95a7]">Amount: ৳{fmt(refund.amount)}</span>
                    <span className="text-[#8b95a7]">Reason: {refund.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[14px] font-semibold text-[#f0f2f5] min-w-[120px] text-right">
                    ৳{fmt(refund.amount)}
                  </p>
                  <ChevronDown
                    size={14}
                    className={`text-[#3a404f] transition-transform ${expandedId === refund.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === refund.id && (
                <div className="border-t border-white/[0.06] p-5 bg-white/[0.02] space-y-4">
                  
                  {/* Sale Details */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f]">Sale Details</p>
                    <div className="bg-white/[0.03] rounded-lg p-3 space-y-1 text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-[#8b95a7]">Invoice</span>
                        <span className="text-[#c8cdd8]">{refund.sale.invoiceNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8b95a7]">Sale Total</span>
                        <span className="text-[#c8cdd8]">৳{fmt(refund.sale.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8b95a7]">Created</span>
                        <span className="text-[#c8cdd8]">{fmtDateTime(refund.sale.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Refund Details */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f]">Refund Details</p>
                    <div className="bg-white/[0.03] rounded-lg p-3 space-y-1 text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-[#8b95a7]">Amount</span>
                        <span className="text-[#6ea8fe] font-semibold">৳{fmt(refund.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8b95a7]">Reason</span>
                        <span className="text-[#c8cdd8]">{refund.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8b95a7]">Requested</span>
                        <span className="text-[#c8cdd8]">{fmtDateTime(refund.createdAt)}</span>
                      </div>
                      {refund.notes && (
                        <div className="flex justify-between">
                          <span className="text-[#8b95a7]">Notes</span>
                          <span className="text-[#c8cdd8]">{refund.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {refund.sale.items && refund.sale.items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f]">Items</p>
                      <div className="bg-white/[0.03] rounded-lg p-3 space-y-1 text-[12px]">
                        {refund.sale.items.map((item: any, idx: number) => (
                          <p key={idx} className="text-[#c8cdd8]">
                            {item.product.name} × {item.quantity} @ ৳{fmt(item.price)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {refund.status === 'PENDING' && (
                    <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleApprove(refund.id)}
                        disabled={processingId === refund.id}
                        className="w-full h-9 text-[13px] font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {processingId === refund.id && <Loader size={14} className="animate-spin" />}
                        Approve Refund
                      </button>
                      <button
                        onClick={() => setShowRejectForm(showRejectForm === refund.id ? null : refund.id)}
                        disabled={processingId === refund.id}
                        className="w-full h-9 text-[13px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                      >
                        Reject Refund
                      </button>

                      {showRejectForm === refund.id && (
                        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                          <textarea
                            placeholder="Enter rejection reason..."
                            value={rejectReason[refund.id] || ''}
                            onChange={(e) => setRejectReason((prev) => ({ ...prev, [refund.id]: e.target.value }))}
                            className="w-full px-3 py-2 text-[12px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(refund.id)}
                              disabled={processingId === refund.id}
                              className="flex-1 h-8 text-[12px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => setShowRejectForm(null)}
                              className="flex-1 h-8 text-[12px] font-medium text-[#8b95a7] bg-white/[0.05] rounded-lg hover:bg-white/[0.08] transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {refund.status === 'APPROVED' && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleProcess(refund.id)}
                        disabled={processingId === refund.id}
                        className="w-full h-9 text-[13px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1f6feb]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {processingId === refund.id && <Loader size={14} className="animate-spin" />}
                        Process Refund
                      </button>
                    </div>
                  )}

                  {(refund.status === 'REJECTED' || refund.status === 'PROCESSED') && (
                    <div className="pt-2 border-t border-white/[0.06] bg-white/[0.02] rounded-lg p-3">
                      <p className="text-[12px] text-[#8b95a7]">
                        {refund.status === 'PROCESSED'
                          ? `Processed on ${refund.processedAt ? fmtDateTime(refund.processedAt) : 'Unknown date'}`
                          : `Rejected: ${refund.notes || 'No reason provided'}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Refunds;
