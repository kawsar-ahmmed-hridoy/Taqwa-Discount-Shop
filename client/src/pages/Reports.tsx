import { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Download, Calendar, TrendingUp, Package, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

const Reports = () => {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'expenses'>('sales');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'sales':
          response = await reportAPI.sales(dateRange);
          break;
        case 'inventory':
          response = await reportAPI.inventory();
          break;
        case 'expenses':
          response = await reportAPI.expenses(dateRange);
          break;
      }
      setReportData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch report'+error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${reportType.toUpperCase()} Report`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 38);

    if (reportData) {
      const yPos = 50;
      if (reportType === 'sales' && reportData.summary) {
        doc.text(`Total Sales: ${reportData.summary.totalSales}`, 14, yPos);
        doc.text(`Total Revenue: BDT ${reportData.summary.totalRevenue.toFixed(2)}`, 14, yPos + 8);
        doc.text(`Total Discount: BDT ${reportData.summary.totalDiscount.toFixed(2)}`, 14, yPos + 16);
        doc.text(`Total VAT: BDT ${reportData.summary.totalVAT.toFixed(2)}`, 14, yPos + 24);
      } else if (reportType === 'inventory' && reportData.summary) {
        doc.text(`Total Products: ${reportData.summary.totalProducts}`, 14, yPos);
        doc.text(`Total Value: BDT ${reportData.summary.totalValue.toFixed(2)}`, 14, yPos + 8);
        doc.text(`Low Stock Items: ${reportData.summary.lowStockItems}`, 14, yPos + 16);
      } else if (reportType === 'expenses' && reportData.summary) {
        doc.text(`Total Expenses: ${reportData.summary.totalExpenses}`, 14, yPos);
        doc.text(`Total Amount: BDT ${reportData.summary.totalAmount.toFixed(2)}`, 14, yPos + 8);
      }
    }

    doc.save(`${reportType}-report-${new Date().getTime()}.pdf`);
    toast.success('PDF exported successfully');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${reportType} Report`);

    worksheet.addRow([`${reportType.toUpperCase()} Report`]);
    worksheet.addRow([`Generated on: ${new Date().toLocaleDateString()}`]);
    worksheet.addRow([`Period: ${dateRange.startDate} to ${dateRange.endDate}`]);
    worksheet.addRow([]);

    if (reportData) {
      if (reportType === 'sales' && reportData.sales) {
        worksheet.addRow(['Invoice No', 'Date', 'Customer', 'Items', 'Total', 'Payment Mode']);
        reportData.sales.forEach((sale: any) => {
          worksheet.addRow([
            sale.invoiceNo,
            new Date(sale.createdAt).toLocaleDateString(),
            sale.customer?.name || 'Walk-in',
            sale.items.length,
            sale.total.toFixed(2),
            sale.paymentMode,
          ]);
        });
      } else if (reportType === 'inventory' && reportData.products) {
        worksheet.addRow(['Name', 'SKU', 'Category', 'Stock', 'Price', 'Value']);
        reportData.products.forEach((product: any) => {
          worksheet.addRow([
            product.name,
            product.sku,
            product.category.name,
            product.stockQuantity,
            product.sellingPrice.toFixed(2),
            (product.stockQuantity * product.sellingPrice).toFixed(2),
          ]);
        });
      } else if (reportType === 'expenses' && reportData.expenses) {
        worksheet.addRow(['Date', 'Category', 'Amount', 'Description', 'Status']);
        reportData.expenses.forEach((expense: any) => {
          worksheet.addRow([
            new Date(expense.expenseDate).toLocaleDateString(),
            expense.category,
            expense.amount.toFixed(2),
            expense.description,
            expense.status,
          ]);
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().getTime()}.xlsx`;
    a.click();
    toast.success('Excel exported successfully');
  };

  const getSalesChartData = () => {
    if (!reportData?.sales) return [];
    const salesByDate: { [key: string]: number } = {};
    reportData.sales.forEach((sale: any) => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + sale.total;
    });
    return Object.entries(salesByDate).map(([date, total]) => ({ date, total }));
  };

  const getInventoryChartData = () => {
    if (!reportData?.products) return [];
    const categoryData: { [key: string]: number } = {};
    reportData.products.forEach((product: any) => {
      const category = product.category.name;
      categoryData[category] = (categoryData[category] || 0) + 1;
    });
    return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  };

  const getExpenseChartData = () => {
    if (!reportData?.summary?.byCategory) return [];
    return Object.entries(reportData.summary.byCategory).map(([name, value]) => ({ name, value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and export business performance reports</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToPDF} className="btn-secondary flex items-center gap-2">
            <Download size={18} />
            Export PDF
          </button>
          <button onClick={exportToExcel} className="btn-success flex items-center gap-2">
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setReportType('sales')}
          className={`card text-left p-6 transition-all border-2 ${
            reportType === 'sales' ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${reportType === 'sales' ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <TrendingUp className={reportType === 'sales' ? 'text-primary-600' : 'text-gray-500'} size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Sales Report</h3>
          <p className="text-sm text-gray-500 mt-1">Revenue and transaction analysis</p>
        </button>

        <button
          onClick={() => setReportType('inventory')}
          className={`card text-left p-6 transition-all border-2 ${
            reportType === 'inventory' ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${reportType === 'inventory' ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <Package className={reportType === 'inventory' ? 'text-primary-600' : 'text-gray-500'} size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Inventory Report</h3>
          <p className="text-sm text-gray-500 mt-1">Stock levels and product analysis</p>
        </button>

        <button
          onClick={() => setReportType('expenses')}
          className={`card text-left p-6 transition-all border-2 ${
            reportType === 'expenses' ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${reportType === 'expenses' ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <DollarSign className={reportType === 'expenses' ? 'text-primary-600' : 'text-gray-500'} size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Expense Report</h3>
          <p className="text-sm text-gray-500 mt-1">Spending and cost analysis</p>
        </button>
      </div>

      {reportType !== 'inventory' && (
        <div className="card p-5">
          <h3 className="section-title flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-primary-500" />
            Date Range
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {reportType === 'sales' && reportData.summary && (
              <>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{reportData.summary.totalSales}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    BDT {reportData.summary.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Discount</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    BDT {reportData.summary.totalDiscount.toFixed(2)}
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total VAT</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    BDT {reportData.summary.totalVAT.toFixed(2)}
                  </p>
                </div>
              </>
            )}
            {reportType === 'inventory' && reportData.summary && (
              <>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{reportData.summary.totalProducts}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    BDT {reportData.summary.totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{reportData.summary.lowStockItems}</p>
                </div>
              </>
            )}
            {reportType === 'expenses' && reportData.summary && (
              <>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{reportData.summary.totalExpenses}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    BDT {reportData.summary.totalAmount.toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="section-title mb-4">
                {reportType === 'sales' ? 'Sales Trend' : reportType === 'inventory' ? 'Products by Category' : 'Expenses by Category'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                {reportType === 'sales' ? (
                  <LineChart data={getSalesChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                ) : reportType === 'inventory' ? (
                  <PieChart>
                    <Pie
                      data={getInventoryChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getInventoryChartData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <BarChart data={getExpenseChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-4">Recent Transactions</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {reportType === 'sales' && reportData.sales?.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{sale.invoiceNo}</p>
                      <p className="text-sm text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-green-600">BDT {sale.total.toFixed(2)}</p>
                  </div>
                ))}
                {reportType === 'inventory' && reportData.products?.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category.name}</p>
                    </div>
                    <p className="font-semibold">Stock: {product.stockQuantity}</p>
                  </div>
                ))}
                {reportType === 'expenses' && reportData.expenses?.slice(0, 5).map((expense: any) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-gray-600">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-red-600">BDT {expense.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;