import { useEffect, useMemo, useState } from 'react';
import { saleAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Clock3,
  ChevronDown,
  Filter,
  Loader,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
  BadgeCheck,
  Receipt,
} from 'lucide-react';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PROCESSED', label: 'Processed' },
] as const;

type RefundStatus = typeof FILTERS[number]['value'];

type RefundRow = {
  id: number;
  saleId: number;
  reason: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  approvedBy?: number | null;
  processedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  sale: {
    id: number;
    invoiceNo: string;
    total: number;
    createdAt: string;
    customer?: { name: string } | null;
    user?: { fullName: string } | null;
    items?: Array<{
      product: { name: string };
      quantity: number;
      price: number;
      total: number;
    }>;
  };
};

const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (value: string | Date) => new Date(value).toLocaleString('en-BD', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const statusConfig: Record<RefundRow['status'], { label: string; bg: string; text: string; icon: typeof Clock3 }> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-400/10', text: 'text-amber-400', icon: Clock3 },
  APPROVED: { label: 'Approved', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  PROCESSED: { label: 'Processed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: BadgeCheck },
};


const Refunds = () => {
  const [refundRequests, setRefundRequests] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<RefundStatus>('all');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<number | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await saleAPI.getAll({ limit: 100, page: 1 });
      const allRefunds = res.data.data
        .flatMap((sale: any) =>
          sale.refunds?.map((refund: any) => ({ ...refund, sale })) || []
        )
        .sort((a: RefundRow, b: RefundRow) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRefundRequests(allRefunds);
    } catch {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (refundId: number) => {
    setProcessingId(refundId);
    try {
      await saleAPI.approveRefund(refundId);
      toast.success('Refund approved');
      fetchRefunds(true);
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
        const next = { ...prev };
        delete next[refundId];
        return next;
      });
      setShowRejectForm(null);
      fetchRefunds(true);
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
      fetchRefunds(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return refundRequests.filter((r) => {
      const matchesStatus = filter === 'all' || r.status === filter;
      const matchesSearch =
        !q ||
        [
          r.sale.invoiceNo,
          r.sale.customer?.name ?? '',
          r.sale.user?.fullName ?? '',
          r.reason,
          r.notes ?? '',
          r.status,
          r.sale.items?.map((item) => item.product.name).join(' ') ?? '',
        ].some((value) => value.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [filter, refundRequests, search]);

  const counts = {
    all: refundRequests.length,
    pending: refundRequests.filter((r) => r.status === 'PENDING').length,
    approved: refundRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: refundRequests.filter((r) => r.status === 'REJECTED').length,
    processed: refundRequests.filter((r) => r.status === 'PROCESSED').length,
  };

  const summaryCards = [
    { label: 'Total requests', value: counts.all, icon: Receipt, tone: 'text-[#6ea8fe]' },
    { label: 'Pending', value: counts.pending, icon: Clock3, tone: 'text-amber-400' },
    { label: 'Approved', value: counts.approved, icon: CheckCircle2, tone: 'text-blue-400' },
    { label: 'Processed', value: counts.processed, icon: BadgeCheck, tone: 'text-emerald-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111318] p-5 flex items-center justify-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#333844] mb-1">Commerce</p>
          <h1 className="text-[20px] font-semibold text-[#c8cdd8] tracking-tight leading-none">Refunds</h1>
          <p className="text-[12px] text-[#3a404f] mt-2 max-w-2xl">
            Review refund requests, approve valid claims, and process completed refunds from a single panel.
          </p>
        </div>

        <button
          onClick={() => fetchRefunds(true)}
          disabled={refreshing}
          className="flex items-center gap-2 h-9 px-3 rounded-[8px] border border-white/[0.07] bg-white/[0.03] text-[12px] text-[#c8cdd8] hover:bg-white/[0.06] transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-[#111318] border border-white/[0.055] rounded-[10px] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Icon size={14} className={card.tone} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.08em] text-[#3a404f]">Live</span>
              </div>
              <p className="text-[22px] font-semibold text-[#c8cdd8] tracking-tight leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
                {card.value}
              </p>
              <p className="text-[11px] font-medium text-[#505668] mt-2">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-[#111318] border border-white/[0.055] rounded-[12px] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5060]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice, customer, reason, status, or item..."
              className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-white/[0.03] border border-white/[0.07] text-[13px] text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-[#4a5060]" />
            <div className="flex items-center gap-2 flex-wrap">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`h-10 px-3 rounded-[8px] text-[12px] font-medium transition-all border ${
                    filter === item.value
                      ? 'bg-[#1f6feb]/12 border-[#1f6feb]/25 text-[#6ea8fe]'
                      : 'bg-white/[0.03] border-white/[0.07] text-[#3a404f] hover:text-[#c8cdd8] hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                  <span className="ml-2 text-[11px] opacity-70">{item.value === 'all' ? counts.all : counts[item.value.toLowerCase() as keyof typeof counts]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111318] border border-white/[0.055] rounded-[12px] overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-11 h-11 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <ShieldAlert size={18} className="text-[#3a404f]" />
            </div>
            <p className="text-[13px] font-medium text-[#3a404f]">No refund requests found</p>
            <p className="text-[11px] text-[#3a404f]">Try clearing filters or wait for new requests.</p>
          </div>
        ) : (
          <div className="space-y-2 p-2.5">
            {filteredRequests.map((refund) => {
              const status = statusConfig[refund.status];
              const StatusIcon = status.icon;
              const isExpanded = expandedId === refund.id;

              return (
                <div key={refund.id} className="border border-white/[0.055] rounded-[12px] overflow-hidden bg-white/[0.02] hover:border-white/[0.09] transition-colors">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : refund.id)}
                    className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-white/[0.025] transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[13px] font-semibold text-[#e2e5eb]">{refund.sale.invoiceNo}</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#3a404f]">
                        <span>{refund.sale.customer?.name || 'Walk-in customer'}</span>
                        <span>Requested {fmtDateTime(refund.createdAt)}</span>
                        <span>Amount ৳{fmt(refund.amount)}</span>
                        <span>Reason: {refund.reason}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <p className="text-[14px] font-semibold text-[#e2e5eb] min-w-[120px] text-right">৳{fmt(refund.amount)}</p>
                      <ChevronDown size={14} className={`text-[#3a404f] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/[0.055] p-4 bg-white/[0.02] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] p-3 space-y-2">
                          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#3a404f]">Sale details</p>
                          <div className="space-y-1.5 text-[12px] text-[#3a404f]">
                            <div className="flex justify-between gap-4"><span>Invoice</span><span className="text-[#c8cdd8]">{refund.sale.invoiceNo}</span></div>
                            <div className="flex justify-between gap-4"><span>Total</span><span className="text-[#c8cdd8]">৳{fmt(refund.sale.total)}</span></div>
                            <div className="flex justify-between gap-4"><span>Created</span><span className="text-[#c8cdd8]">{fmtDateTime(refund.sale.createdAt)}</span></div>
                            <div className="flex justify-between gap-4"><span>Cashier</span><span className="text-[#c8cdd8]">{refund.sale.user?.fullName || 'N/A'}</span></div>
                          </div>
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] p-3 space-y-2">
                          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#3a404f]">Refund details</p>
                          <div className="space-y-1.5 text-[12px] text-[#3a404f]">
                            <div className="flex justify-between gap-4"><span>Amount</span><span className="text-[#6ea8fe] font-semibold">৳{fmt(refund.amount)}</span></div>
                            <div className="flex justify-between gap-4"><span>Status</span><span className="text-[#c8cdd8]">{status.label}</span></div>
                            <div className="flex justify-between gap-4"><span>Reason</span><span className="text-[#c8cdd8]">{refund.reason}</span></div>
                            <div className="flex justify-between gap-4"><span>Requested</span><span className="text-[#c8cdd8]">{fmtDateTime(refund.createdAt)}</span></div>
                            {refund.notes && <div className="flex justify-between gap-4"><span>Notes</span><span className="text-[#c8cdd8]">{refund.notes}</span></div>}
                          </div>
                        </div>
                      </div>

                      {refund.sale.items && refund.sale.items.length > 0 && (
                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] p-3 space-y-2">
                          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#3a404f]">Items</p>
                          <div className="space-y-2">
                            {refund.sale.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-4 text-[12px] py-2 border-b border-white/[0.045] last:border-0 last:pb-0 first:pt-0">
                                <div className="min-w-0">
                                  <p className="text-[#c8cdd8] font-medium truncate">{item.product.name}</p>
                                  <p className="text-[#3a404f] text-[11px]">Qty {item.quantity} • Unit ৳{fmt(item.price)}</p>
                                </div>
                                <p className="text-[#c8cdd8] font-medium whitespace-nowrap">৳{fmt(item.total)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {refund.status === 'PENDING' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <button
                            onClick={() => handleApprove(refund.id)}
                            disabled={processingId === refund.id}
                            className="h-10 rounded-[8px] text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            {processingId === refund.id && <Loader size={14} className="animate-spin" />}
                            Approve refund
                          </button>

                          <button
                            onClick={() => setShowRejectForm(showRejectForm === refund.id ? null : refund.id)}
                            disabled={processingId === refund.id}
                            className="h-10 rounded-[8px] text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
                          >
                            Reject refund
                          </button>
                        </div>
                      )}

                      {showRejectForm === refund.id && refund.status === 'PENDING' && (
                        <div className="space-y-3 pt-1 border-t border-white/[0.055]">
                          <textarea
                            placeholder="Enter rejection reason..."
                            value={rejectReason[refund.id] || ''}
                            onChange={(e) => setRejectReason((prev) => ({ ...prev, [refund.id]: e.target.value }))}
                            className="w-full min-h-[84px] px-3 py-2.5 text-[12.5px] bg-white/[0.03] border border-white/[0.07] rounded-[8px] text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(refund.id)}
                              disabled={processingId === refund.id}
                              className="flex-1 h-9 rounded-[8px] text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                              Confirm reject
                            </button>
                            <button
                              onClick={() => setShowRejectForm(null)}
                              className="flex-1 h-9 rounded-[8px] text-[12px] font-medium text-[#c8cdd8] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {refund.status === 'APPROVED' && (
                        <div className="pt-1 border-t border-white/[0.055]">
                          <button
                            onClick={() => handleProcess(refund.id)}
                            disabled={processingId === refund.id}
                            className="w-full h-10 rounded-[8px] text-[13px] font-medium text-white bg-[#1f6feb] hover:bg-[#1a5fd4] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            {processingId === refund.id && <Loader size={14} className="animate-spin" />}
                            Process refund
                          </button>
                        </div>
                      )}

                      {(refund.status === 'REJECTED' || refund.status === 'PROCESSED') && (
                        <div className="pt-1 border-t border-white/[0.055]">
                          <div className="rounded-[8px] border border-white/[0.05] bg-white/[0.025] p-3 text-[12px] text-[#3a404f]">
                            {refund.status === 'PROCESSED'
                              ? `Processed on ${refund.processedAt ? fmtDateTime(refund.processedAt) : 'Unknown date'}`
                              : `Rejected: ${refund.notes || 'No reason provided'}`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11.5px] text-[#3a404f] px-1">
        <span>{filteredRequests.length} refund request{filteredRequests.length === 1 ? '' : 's'} shown</span>
        <span className="inline-flex items-center gap-1.5 text-[#505668]">
          <RotateCcw size={12} />
          Sidebar-linked commerce view
        </span>
      </div>
    </div>
  );
};

export default Refunds;
