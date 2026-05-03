import { useState, useEffect, useCallback, useMemo } from 'react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar, TrendingUp, Package, DollarSign,
  RefreshCw, FileSpreadsheet, FileText, ArrowUpRight,
  ArrowDownRight, Minus, BarChart2, 
  LineChart as LineIcon, Printer, ChevronDown, Zap,
  AlertTriangle, Info,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'sales' | 'inventory' | 'expenses';
type ChartMode  = 'line' | 'bar' | 'area' | 'pie';
type DatePreset = 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'custom';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#1f6feb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const DARK_TOOLTIP = {
  contentStyle: { background: '#13161c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#9ca3af' },
  itemStyle: { color: '#6ea8fe' },
};

const reportTabs: { key: ReportType; label: string; icon: typeof TrendingUp; desc: string }[] = [
  { key: 'sales',     label: 'Sales',     icon: TrendingUp, desc: 'Revenue & transactions' },
  { key: 'inventory', label: 'Inventory', icon: Package,    desc: 'Stock & product analysis' },
  { key: 'expenses',  label: 'Expenses',  icon: DollarSign, desc: 'Spending & cost analysis' },
];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today',      label: 'Today' },
  { key: 'week',       label: 'This week' },
  { key: 'month',      label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'quarter',    label: 'This quarter' },
  { key: 'custom',     label: 'Custom' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n?: number) => n != null ? `৳${n.toFixed(2)}` : '—';
const pct = (a: number, b: number) => b === 0 ? null : ((a - b) / b) * 100;

function getPresetRange(preset: DatePreset): { startDate: string; endDate: string } {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().split('T')[0];

  if (preset === 'today') return { startDate: iso(today), endDate: iso(today) };

  if (preset === 'week') {
    const day = today.getDay();
    const start = new Date(today); start.setDate(today.getDate() - day);
    return { startDate: iso(start), endDate: iso(today) };
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: iso(start), endDate: iso(today) };
  }
  if (preset === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end   = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: iso(start), endDate: iso(end) };
  }
  if (preset === 'quarter') {
    const q = Math.floor(today.getMonth() / 3);
    const start = new Date(today.getFullYear(), q * 3, 1);
    return { startDate: iso(start), endDate: iso(today) };
  }
  return {
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
  delta?: number | null;
  subtitle?: string;
}

const StatCard = ({ label, value, color = 'text-[#e2e5eb]', delta, subtitle }: StatCardProps) => {
  const sign = delta != null ? (delta > 0 ? 1 : delta < 0 ? -1 : 0) : null;

  return (
    <div className="border border-white/[0.055] rounded-xl bg-white/[0.025] px-4 py-4 flex flex-col gap-2 transition-all hover:border-white/[0.09] hover:bg-white/[0.035]">
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">{label}</p>
      <p className={`text-[22px] font-bold leading-none ${color}`}>{value}</p>
      <div className="flex items-center gap-2 mt-auto">
        {sign !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${sign > 0 ? 'text-emerald-400' : sign < 0 ? 'text-red-400' : 'text-[#6b7280]'}`}>
            {sign > 0 ? <ArrowUpRight size={11} /> : sign < 0 ? <ArrowDownRight size={11} /> : <Minus size={11} />}
            {Math.abs(delta!).toFixed(1)}%
          </span>
        )}
        {subtitle && <span className="text-[10.5px] text-[#3a404f]">{subtitle}</span>}
      </div>
    </div>
  );
};

const InsightItem = ({ type, text }: { type: 'up' | 'down' | 'info' | 'warn'; text: string }) => {
  const cfg = {
    up:   { icon: ArrowUpRight,   cls: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    down: { icon: ArrowDownRight, cls: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
    info: { icon: Info,           cls: 'text-[#6ea8fe]',   bg: 'bg-[#1f6feb]/10 border-[#1f6feb]/20' },
    warn: { icon: AlertTriangle,  cls: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${cfg.bg}`}>
      <Icon size={13} className={`${cfg.cls} mt-0.5 shrink-0`} />
      <p className="text-[12px] text-[#c8cdd8] leading-relaxed">{text}</p>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
      <Package size={16} className="text-[#3a404f]" />
    </div>
    <p className="text-[12.5px] text-[#3a404f]">{message}</p>
  </div>
);

// ─── Chart toggle ─────────────────────────────────────────────────────────────

const ChartToggle = ({ mode, onChange, options }: { mode: ChartMode; onChange: (m: ChartMode) => void; options: { key: ChartMode; icon: typeof BarChart2 }[] }) => (
  <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
    {options.map(({ key, icon: Icon }) => (
      <button key={key} onClick={() => onChange(key)}
        className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${mode === key ? 'bg-[#1f6feb] text-white' : 'text-[#3a404f] hover:text-[#6b7280]'}`}>
        <Icon size={11} />
      </button>
    ))}
  </div>
);

// ─── Top performers ───────────────────────────────────────────────────────────

const TopList = ({ title, items }: { title: string; items: { label: string; sub?: string; value: string; color?: string; rank: number }[] }) => (
  <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-5">
    <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3a404f] mb-4">{title}</p>
    {items.length === 0
      ? <EmptyState message="No data available" />
      : (
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.rank} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
              <span className={`text-[11px] font-bold w-5 text-center ${item.rank <= 3 ? 'text-[#6ea8fe]' : 'text-[#3a404f]'}`}>
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#e2e5eb] truncate">{item.label}</p>
                {item.sub && <p className="text-[11px] text-[#3a404f]">{item.sub}</p>}
              </div>
              <span className={`text-[12.5px] font-semibold shrink-0 ${item.color ?? 'text-[#6b7280]'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function Reports() {
  const [reportType, setReportType]   = useState<ReportType>('sales');
  const [loading, setLoading]         = useState(false);
  const [reportData, setReportData]   = useState<any>(null);
  const [prevData, setPrevData]       = useState<any>(null);
  const [datePreset, setDatePreset]   = useState<DatePreset>('month');
  const [dateRange, setDateRange]     = useState(getPresetRange('month'));
  const [chartMode, setChartMode]     = useState<ChartMode>('line');
  const [showPresets, setShowPresets] = useState(false);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') setDateRange(getPresetRange(preset));
    setShowPresets(false);
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const r = reportType === 'sales'
        ? await reportAPI.sales(dateRange)
        : reportType === 'inventory'
        ? await reportAPI.inventory()
        : await reportAPI.expenses(dateRange);
      setReportData(r.data.data);

      // Fetch comparison data (previous period) for sales/expenses
      if (reportType !== 'inventory') {
        const start  = new Date(dateRange.startDate);
        const end    = new Date(dateRange.endDate);
        const diff   = end.getTime() - start.getTime();
        const pStart = new Date(start.getTime() - diff - 86400000).toISOString().split('T')[0];
        const pEnd   = new Date(start.getTime() - 86400000).toISOString().split('T')[0];
        const prev   = reportType === 'sales'
          ? await reportAPI.sales({ startDate: pStart, endDate: pEnd })
          : await reportAPI.expenses({ startDate: pStart, endDate: pEnd });
        setPrevData(prev.data.data);
      }
    } catch { toast.error('Failed to fetch report'); }
    finally { setLoading(false); }
  }, [reportType, dateRange]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // ── Export PDF ──────────────────────────────────────────────────────────────

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header bar
    doc.setFillColor(31, 111, 235);
    doc.rect(0, 0, 210, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reportType.toUpperCase()} REPORT`, 14, 9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 140, 9.5);

    // Title
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 32);

    // Period
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${dateRange.startDate}  →  ${dateRange.endDate}`, 14, 40);

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 44, 196, 44);

    // Summary
    const s = reportData?.summary;
    if (s) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Summary', 14, 54);

      const lines: [string, string][] = reportType === 'sales'
        ? [['Total Sales', `${s.totalSales}`], ['Total Revenue', `৳${s.totalRevenue?.toFixed(2)}`], ['Total Discount', `৳${s.totalDiscount?.toFixed(2)}`], ['VAT Collected', `৳${s.totalVAT?.toFixed(2)}`]]
        : reportType === 'inventory'
        ? [['Total Products', `${s.totalProducts}`], ['Total Value', `৳${s.totalValue?.toFixed(2)}`], ['Low Stock Items', `${s.lowStockItems}`]]
        : [['Total Expenses', `${s.totalExpenses}`], ['Total Amount', `৳${s.totalAmount?.toFixed(2)}`]];

      let y = 62;
      lines.forEach(([k, v]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(k, 14, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(v, 100, y);
        y += 9;
      });
    }

    doc.save(`${reportType}-report-${Date.now()}.pdf`);
    toast.success('PDF exported');
  };

  // ── Export Excel ────────────────────────────────────────────────────────────

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Reports Module';
    wb.created  = new Date();

    const ws = wb.addWorksheet(`${reportType} Report`, {
      properties: { tabColor: { argb: '1F6FEB' } },
    });

    // Title rows
    ws.mergeCells('A1:F1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `${reportType.toUpperCase()} REPORT`;
    titleCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    ws.addRow([`Period: ${dateRange.startDate} to ${dateRange.endDate}`]);
    ws.addRow([`Generated: ${new Date().toLocaleDateString()}`]);
    ws.addRow([]);

    if (reportType === 'sales' && reportData?.sales) {
      const headers = ['Invoice No', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'VAT', 'Total', 'Payment Mode'];
      const headerRow = ws.addRow(headers);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1a2a3a' } };
        cell.border = { bottom: { style: 'medium', color: { argb: '1F6FEB' } } };
      });
      reportData.sales.forEach((s: any, i: number) => {
        const row = ws.addRow([
          s.invoiceNo,
          new Date(s.createdAt).toLocaleDateString(),
          s.customer?.name || 'Walk-in',
          s.items.length,
          s.subtotal?.toFixed(2),
          s.discount?.toFixed(2),
          s.vat?.toFixed(2),
          s.total.toFixed(2),
          s.paymentMode,
        ]);
        if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f9fafb' } }; });
      });
      ws.columns = [12, 14, 22, 8, 12, 12, 12, 12, 16].map(width => ({ width }));

    } else if (reportType === 'inventory' && reportData?.products) {
      const headers = ['Product Name', 'SKU', 'Category', 'Stock Qty', 'Selling Price', 'Total Value', 'Status'];
      const headerRow = ws.addRow(headers);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1a2a3a' } };
        cell.border = { bottom: { style: 'medium', color: { argb: '1F6FEB' } } };
      });
      reportData.products.forEach((p: any, i: number) => {
        const status = p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity <= p.minStockLevel ? 'Low Stock' : 'In Stock';
        const row = ws.addRow([p.name, p.sku, p.category.name, p.stockQuantity, p.sellingPrice.toFixed(2), (p.stockQuantity * p.sellingPrice).toFixed(2), status]);
        if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f9fafb' } }; });
      });
      ws.columns = [24, 14, 18, 12, 14, 14, 14].map(width => ({ width }));

    } else if (reportType === 'expenses' && reportData?.expenses) {
      const headers = ['Date', 'Category', 'Amount', 'Description', 'Status'];
      const headerRow = ws.addRow(headers);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1a2a3a' } };
        cell.border = { bottom: { style: 'medium', color: { argb: '1F6FEB' } } };
      });
      reportData.expenses.forEach((e: any, i: number) => {
        const row = ws.addRow([new Date(e.expenseDate).toLocaleDateString(), e.category, e.amount.toFixed(2), e.description, e.status]);
        if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f9fafb' } }; });
      });
      ws.columns = [14, 18, 12, 30, 14].map(width => ({ width }));
    }

    // Summary sheet
    if (reportData?.summary) {
      const sw = wb.addWorksheet('Summary');
      sw.addRow(['Metric', 'Value']).eachCell(c => {
        c.font = { bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
        c.font = { bold: true, color: { argb: 'FFFFFF' } };
      });
      Object.entries(reportData.summary).forEach(([k, v]) => {
        if (typeof v !== 'object') sw.addRow([k, v]);
      });
      sw.columns = [{ width: 22 }, { width: 18 }];
    }

    const buf  = await wb.xlsx.writeBuffer();
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    link.download = `${reportType}-report-${Date.now()}.xlsx`;
    link.click();
    toast.success('Excel exported');
  };

  // ── Chart data ──────────────────────────────────────────────────────────────

  const salesChartData = useMemo(() => {
    if (!reportData?.sales) return [];
    const m: Record<string, number> = {};
    reportData.sales.forEach((s: any) => {
      const d = new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      m[d] = (m[d] || 0) + s.total;
    });
    return Object.entries(m).map(([date, total]) => ({ date, total: +total.toFixed(2) }));
  }, [reportData]);

  const inventoryChartData = useMemo(() => {
    if (!reportData?.products) return [];
    const m: Record<string, number> = {};
    reportData.products.forEach((p: any) => { m[p.category.name] = (m[p.category.name] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [reportData]);

  const expenseChartData = useMemo(() => {
    if (!reportData?.summary?.byCategory) return [];
    return Object.entries(reportData.summary.byCategory).map(([name, value]) => ({ name, value }));
  }, [reportData]);

  // ── Insights ────────────────────────────────────────────────────────────────

  const insights = useMemo(() => {
    const s   = reportData?.summary;
    const ps  = prevData?.summary;
    const out: { type: 'up' | 'down' | 'info' | 'warn'; text: string }[] = [];

    if (!s) return out;

    if (reportType === 'sales' && s) {
      if (ps) {
        const delta = pct(s.totalRevenue, ps.totalRevenue);
        if (delta != null) out.push({ type: delta >= 0 ? 'up' : 'down', text: `Revenue ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta).toFixed(1)}% vs the prior period (৳${ps.totalRevenue?.toFixed(2)})` });
      }
      const avgOrder = s.totalRevenue / (s.totalSales || 1);
      out.push({ type: 'info', text: `Average order value is ৳${avgOrder.toFixed(2)} across ${s.totalSales} transactions` });
      if (s.totalDiscount > 0) {
        const discPct = (s.totalDiscount / (s.totalRevenue + s.totalDiscount)) * 100;
        out.push({ type: discPct > 15 ? 'warn' : 'info', text: `Discounts account for ${discPct.toFixed(1)}% of gross revenue — ${discPct > 15 ? 'consider reviewing discount policy' : 'within acceptable range'}` });
      }
    }

    if (reportType === 'inventory' && s) {
      if (s.lowStockItems > 0) out.push({ type: 'warn', text: `${s.lowStockItems} product${s.lowStockItems > 1 ? 's are' : ' is'} below minimum stock level — reorder recommended` });
      const deadItems = reportData.products?.filter((p: any) => p.stockQuantity === 0).length ?? 0;
      if (deadItems > 0) out.push({ type: 'down', text: `${deadItems} product${deadItems > 1 ? 's are' : ' is'} completely out of stock` });
      out.push({ type: 'info', text: `Total inventory valued at ${fmt(s.totalValue)} across ${s.totalProducts} products` });
    }

    if (reportType === 'expenses' && s) {
      if (ps) {
        const delta = pct(s.totalAmount, ps.totalAmount);
        if (delta != null) out.push({ type: delta <= 0 ? 'up' : 'down', text: `Spend ${delta <= 0 ? 'decreased' : 'increased'} by ${Math.abs(delta).toFixed(1)}% compared to the prior period` });
      }
      if (s.byCategory) {
        const top = Object.entries(s.byCategory).sort((a: any, b: any) => b[1] - a[1])[0];
        if (top) out.push({ type: 'info', text: `Largest expense category is "${top[0]}" at ${fmt(top[1] as number)}` });
      }
    }

    return out;
  }, [reportData, prevData, reportType]);

  // ── Top performers ──────────────────────────────────────────────────────────

  const topSales = useMemo(() => {
    if (!reportData?.sales) return [];
    const m: Record<string, { total: number; count: number }> = {};
    reportData.sales.forEach((s: any) => {
      const name = s.customer?.name || 'Walk-in';
      if (!m[name]) m[name] = { total: 0, count: 0 };
      m[name].total += s.total; m[name].count += 1;
    });
    return Object.entries(m)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([label, { total, count }], i) => ({ rank: i + 1, label, sub: `${count} orders`, value: fmt(total), color: 'text-emerald-400' }));
  }, [reportData]);

  const topProducts = useMemo(() => {
    if (!reportData?.products) return [];
    return [...reportData.products]
      .sort((a: any, b: any) => (b.stockQuantity * b.sellingPrice) - (a.stockQuantity * a.sellingPrice))
      .slice(0, 5)
      .map((p: any, i: number) => ({
        rank: i + 1, label: p.name, sub: p.category.name,
        value: fmt(p.stockQuantity * p.sellingPrice),
        color: p.stockQuantity === 0 ? 'text-red-400' : p.stockQuantity <= p.minStockLevel ? 'text-amber-400' : 'text-[#6ea8fe]',
      }));
  }, [reportData]);

  const topExpenses = useMemo(() => {
    if (!reportData?.expenses) return [];
    const m: Record<string, number> = {};
    reportData.expenses.forEach((e: any) => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, total], i) => ({ rank: i + 1, label, value: fmt(total), color: 'text-red-400' }));
  }, [reportData]);

  const s   = reportData?.summary;
  const ps  = prevData?.summary;

  const salesChartOptions: { key: ChartMode; icon: typeof BarChart2 }[] = [
    { key: 'line', icon: LineIcon }, { key: 'area', icon: LineIcon }, { key: 'bar', icon: BarChart2 },
  ];

  const renderSalesChart = () => {
    const props = { data: salesChartData };
    const common = <>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
      <XAxis dataKey="date" tick={{ fill: '#3a404f', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#3a404f', fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip {...DARK_TOOLTIP} formatter={(v: any) => [`৳${v}`, 'Revenue']} />
    </>;
    if (chartMode === 'bar') return <BarChart {...props}>{common}<Bar dataKey="total" fill="#1f6feb" radius={[4, 4, 0, 0]} /></BarChart>;
    if (chartMode === 'area') return <AreaChart {...props}>{common}<defs><linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1f6feb" stopOpacity={0.2} /><stop offset="95%" stopColor="#1f6feb" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="total" stroke="#1f6feb" strokeWidth={2} fill="url(#salesGrad)" dot={false} /></AreaChart>;
    return <LineChart {...props}>{common}<Line type="monotone" dataKey="total" stroke="#1f6feb" strokeWidth={2} dot={false} activeDot={{ r: 4 }} /></LineChart>;
  };

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5 print:bg-white print:text-black" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5] tracking-tight">Reports & Analytics</h1>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">Generate, compare, and export business performance reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchReport} title="Refresh"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.03] hover:bg-white/[0.07] text-[#3a404f] hover:text-[#c8cdd8] transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => window.print()} title="Print"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.03] hover:bg-white/[0.07] text-[#3a404f] hover:text-[#c8cdd8] transition-all">
            <Printer size={13} />
          </button>
          <button onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-[#c8cdd8] border border-white/[0.08] bg-white/[0.04] rounded-lg hover:bg-white/[0.08] transition-all">
            <FileText size={13} /> PDF
          </button>
          <button onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] transition-all">
            <FileSpreadsheet size={13} /> Excel
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-0 border-b border-white/[0.055]">
        {reportTabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setReportType(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium border-b-2 -mb-px transition-all
              ${reportType === key ? 'text-[#6ea8fe] border-[#1f6feb]' : 'text-[#3a404f] border-transparent hover:text-[#6b7280]'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── Date controls ── */}
      {reportType !== 'inventory' && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preset dropdown */}
          <div className="relative">
            <button onClick={() => setShowPresets(v => !v)}
              className="flex items-center gap-1.5 h-8 px-3 text-[12.5px] text-[#c8cdd8] border border-white/[0.07] bg-white/[0.04] rounded-lg hover:bg-white/[0.08] transition-all">
              <Calendar size={12} />
              {DATE_PRESETS.find(p => p.key === datePreset)?.label}
              <ChevronDown size={11} className={`transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>
            {showPresets && (
              <div className="absolute top-full mt-1.5 left-0 z-20 bg-[#13161c] border border-white/[0.08] rounded-xl shadow-xl py-1 min-w-[140px]">
                {DATE_PRESETS.map(p => (
                  <button key={p.key} onClick={() => applyPreset(p.key)}
                    className={`w-full text-left px-3.5 py-2 text-[12.5px] transition-colors hover:bg-white/[0.05]
                      ${datePreset === p.key ? 'text-[#6ea8fe]' : 'text-[#c8cdd8]'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom range inputs (shown always, disabled on non-custom) */}
          <input type="date" value={dateRange.startDate}
            onChange={e => { setDatePreset('custom'); setDateRange(d => ({ ...d, startDate: e.target.value })); }}
            className="h-8 px-3 text-[12.5px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all" />
          <span className="text-[#3a404f] text-[12px]">→</span>
          <input type="date" value={dateRange.endDate}
            onChange={e => { setDatePreset('custom'); setDateRange(d => ({ ...d, endDate: e.target.value })); }}
            className="h-8 px-3 text-[12.5px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all" />

          {/* Comparison badge */}
          {prevData && (
            <span className="flex items-center gap-1 text-[11px] text-[#3a404f] border border-white/[0.055] px-2.5 py-1 rounded-full bg-white/[0.02]">
              <Zap size={10} className="text-[#6ea8fe]" /> vs. prior period
            </span>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
        </div>
      )}

      {/* ── Content ── */}
      {!loading && reportData && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {reportType === 'sales' && s && (<>
              <StatCard label="Total Sales"   value={`${s.totalSales}`}
                delta={ps ? pct(s.totalSales, ps.totalSales) : null} subtitle="transactions" />
              <StatCard label="Revenue"       value={fmt(s.totalRevenue)}   color="text-emerald-400"
                delta={ps ? pct(s.totalRevenue, ps.totalRevenue) : null} />
              <StatCard label="Discounts"     value={fmt(s.totalDiscount)}  color="text-red-400"
                delta={ps ? pct(s.totalDiscount, ps.totalDiscount) : null} />
              <StatCard label="VAT Collected" value={fmt(s.totalVAT)}       color="text-[#6ea8fe]"
                delta={ps ? pct(s.totalVAT, ps.totalVAT) : null} />
            </>)}
            {reportType === 'inventory' && s && (<>
              <StatCard label="Total Products" value={`${s.totalProducts}`} />
              <StatCard label="Total Value"    value={fmt(s.totalValue)}  color="text-emerald-400" />
              <StatCard label="Low Stock"      value={`${s.lowStockItems}`} color="text-amber-400" subtitle="need reorder" />
              <StatCard label="Out of Stock"   value={`${reportData.products?.filter((p: any) => p.stockQuantity === 0).length ?? 0}`} color="text-red-400" />
            </>)}
            {reportType === 'expenses' && s && (<>
              <StatCard label="Total Expenses" value={`${s.totalExpenses}`}
                delta={ps ? pct(s.totalExpenses, ps.totalExpenses) : null} />
              <StatCard label="Total Amount"   value={fmt(s.totalAmount)} color="text-red-400"
                delta={ps ? pct(s.totalAmount, ps.totalAmount) : null} />
              {s.byCategory && (
                <StatCard label="Categories" value={`${Object.keys(s.byCategory).length}`} subtitle="expense types" />
              )}
              <StatCard label="Avg per Expense" value={fmt(s.totalAmount / (s.totalExpenses || 1))} color="text-[#6ea8fe]" />
            </>)}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {insights.map((ins, i) => <InsightItem key={i} {...ins} />)}
            </div>
          )}

          {/* Chart + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3a404f]">
                  {reportType === 'sales' ? 'Sales trend' : reportType === 'inventory' ? 'Products by category' : 'Expenses by category'}
                </p>
                {reportType === 'sales' && (
                  <ChartToggle mode={chartMode} onChange={setChartMode} options={salesChartOptions} />
                )}
              </div>

              {(reportType === 'sales' && salesChartData.length === 0) ||
               (reportType === 'inventory' && inventoryChartData.length === 0) ||
               (reportType === 'expenses' && expenseChartData.length === 0)
                ? <EmptyState message="No data to display for this period" />
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    {reportType === 'sales' ? renderSalesChart()
                      : reportType === 'inventory' ? (
                        <PieChart>
                          <Pie data={inventoryChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {inventoryChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip {...DARK_TOOLTIP} />
                        </PieChart>
                      ) : (
                        <BarChart data={expenseChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="name" tick={{ fill: '#3a404f', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#3a404f', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip {...DARK_TOOLTIP} formatter={(v: any) => [`৳${v}`, 'Amount']} />
                          <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                  </ResponsiveContainer>
                )}
            </div>

            {/* Recent list */}
            <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3a404f] mb-4">Recent</p>
              <div className="space-y-0.5 max-h-[280px] overflow-y-auto pr-1 custom-scroll">
                {reportType === 'sales' && (reportData.sales?.length === 0
                  ? <EmptyState message="No sales in this period" />
                  : reportData.sales?.slice(0, 10).map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default">
                      <div>
                        <p className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{sale.invoiceNo}</p>
                        <p className="text-[11px] text-[#3a404f]">{new Date(sale.createdAt).toLocaleDateString()} · {sale.customer?.name || 'Walk-in'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12.5px] font-semibold text-emerald-400">{fmt(sale.total)}</p>
                        <p className="text-[10.5px] text-[#3a404f]">{sale.paymentMode}</p>
                      </div>
                    </div>
                  ))
                )}
                {reportType === 'inventory' && (reportData.products?.length === 0
                  ? <EmptyState message="No products found" />
                  : reportData.products?.slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default">
                      <div>
                        <p className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{p.name}</p>
                        <p className="text-[11px] text-[#3a404f]">{p.category.name} · {p.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[12px] font-semibold ${p.stockQuantity === 0 ? 'text-red-400' : p.stockQuantity <= p.minStockLevel ? 'text-amber-400' : 'text-[#6b7280]'}`}>
                          {p.stockQuantity} units
                        </span>
                        <p className="text-[10.5px] text-[#3a404f]">{fmt(p.sellingPrice)} ea.</p>
                      </div>
                    </div>
                  ))
                )}
                {reportType === 'expenses' && (reportData.expenses?.length === 0
                  ? <EmptyState message="No expenses in this period" />
                  : reportData.expenses?.slice(0, 10).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default">
                      <div>
                        <p className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{e.category}</p>
                        <p className="text-[11px] text-[#3a404f]">{new Date(e.expenseDate).toLocaleDateString()} · {e.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12.5px] font-semibold text-red-400">{fmt(e.amount)}</p>
                        <p className={`text-[10.5px] ${e.status === 'paid' ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>{e.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {reportType === 'sales' && (
              <TopList title="Top Customers" items={topSales} />
            )}
            {reportType === 'inventory' && (
              <TopList title="Highest Value Products" items={topProducts} />
            )}
            {reportType === 'expenses' && (
              <TopList title="Top Expense Categories" items={topExpenses} />
            )}

            {/* Breakdown table — sales payment modes or expense statuses */}
            {reportType === 'sales' && reportData.sales && (() => {
              const modes: Record<string, { count: number; total: number }> = {};
              reportData.sales.forEach((s: any) => {
                if (!modes[s.paymentMode]) modes[s.paymentMode] = { count: 0, total: 0 };
                modes[s.paymentMode].count += 1;
                modes[s.paymentMode].total += s.total;
              });
              return (
                <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3a404f] mb-4">Payment Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(modes).map(([mode, { count, total }]) => {
                      const share = (total / (s?.totalRevenue || 1)) * 100;
                      return (
                        <div key={mode}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] capitalize" style={{ color: 'var(--text)' }}>{mode}</span>
                            <span className="text-[12px] text-[#6b7280]">{count} · {fmt(total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full bg-[#1f6feb]" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {reportType === 'inventory' && s && (
              <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3a404f] mb-4">Stock Status</p>
                {(() => {
                  const products = reportData.products ?? [];
                  const inStock  = products.filter((p: any) => p.stockQuantity > p.minStockLevel).length;
                  const low      = products.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length;
                  const out      = products.filter((p: any) => p.stockQuantity === 0).length;
                  const total    = products.length;
                  const bars = [
                    { label: 'In Stock', count: inStock, color: 'bg-emerald-400' },
                    { label: 'Low Stock', count: low,    color: 'bg-amber-400' },
                    { label: 'Out of Stock', count: out, color: 'bg-red-400' },
                  ];
                  return (
                    <div className="space-y-2">
                      {bars.map(({ label, count, color }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px]" style={{ color: 'var(--text)' }}>{label}</span>
                            <span className="text-[12px] text-[#6b7280]">{count} products</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {reportType === 'expenses' && reportData.expenses && (() => {
              const statuses: Record<string, { count: number; total: number }> = {};
              reportData.expenses.forEach((e: any) => {
                if (!statuses[e.status]) statuses[e.status] = { count: 0, total: 0 };
                statuses[e.status].count += 1;
                statuses[e.status].total += e.amount;
              });
              return (
                <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-5">
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-[#3a404f] mb-4">Status Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(statuses).map(([status, { count, total }]) => {
                      const share = (total / (s?.totalAmount || 1)) * 100;
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] capitalize" style={{ color: 'var(--text)' }}>{status}</span>
                            <span className="text-[12px] text-[#6b7280]">{count} · {fmt(total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className={`h-full rounded-full ${status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Filler for 3-col layout when only 2 things shown */}
            <div />
          </div>
        </>
      )}

      {/* ── Empty state (no data at all) ── */}
      {!loading && !reportData && (
        <div className="flex flex-col items-center justify-center h-64 gap-3 border border-white/[0.055] rounded-xl bg-white/[0.02]">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <FileText size={18} className="text-[#3a404f]" />
          </div>
          <p className="text-[13px] text-[#3a404f]">No report data available</p>
          <button onClick={fetchReport} className="text-[12px] text-[#6ea8fe] hover:underline">Try again</button>
        </div>
      )}
    </div>
  );
}