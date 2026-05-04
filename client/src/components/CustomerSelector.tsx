import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Mail, Phone} from 'lucide-react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface CustomerSelectorProps {
  selectedCustomerId: number | null;
  onSelectCustomer: (customerId: number | null) => void;
  customers: Customer[];
  onCustomersChange: (customers: Customer[]) => void;
}

const CustomerSelector = ({
  selectedCustomerId,
  onSelectCustomer,
  customers,
  onCustomersChange,
}: CustomerSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!newCustomer.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setIsAdding(true);
    try {
      const res = await customerAPI.create({
        name: newCustomer.name,
        email: newCustomer.email || undefined,
        phone: newCustomer.phone,
        address: newCustomer.address || undefined,
      });

      const addedCustomer = res.data.data;
      const updatedCustomers = [...customers, addedCustomer];
      onCustomersChange(updatedCustomers);
      onSelectCustomer(addedCustomer.id);
      
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setShowAddForm(false);
      setSearchQuery('');
      toast.success('Customer added successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to add customer');
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-2">
      {/* Selected Customer Info */}
      {selectedCustomer && (
        <div
          className="p-2.5 rounded-[7px] border text-[11px]"
          style={{ background: 'var(--accent)/[0.08]', borderColor: 'var(--accent)/30' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                {selectedCustomer.name}
              </p>
              <div className="space-y-1 mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={9} />
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={9} className="flex-shrink-0" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                onSelectCustomer(null);
                setSearchQuery('');
              }}
              className="flex-shrink-0 p-1 hover:bg-white/[0.08] rounded-[4px] transition-colors"
              style={{ color: 'var(--muted)' }}
              title="Clear customer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={12}
          strokeWidth={1.8}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--muted)' }}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search or add customer..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearching(true);
          }}
          className="w-full h-8 bg-white/[0.04] hover:bg-white/[0.055] border border-white/[0.08] rounded-[7px] text-[12px] placeholder:text-[#333844] pl-8 pr-3 outline-none transition-all duration-[120ms]"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {/* Add New Customer Button */}
      {!showAddForm && searchQuery.trim() && filteredCustomers.length === 0 && (
        <button
          onClick={() => {
            setNewCustomer({ ...newCustomer, name: searchQuery });
            setShowAddForm(true);
          }}
          className="w-full flex items-center justify-center gap-1.5 h-8 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.13] rounded-[7px] text-[11.5px] font-medium transition-all duration-[120ms]"
          style={{ color: 'var(--accent)' }}
        >
          <Plus size={12} strokeWidth={2} />
          Add New Customer
        </button>
      )}

      {/* Add Customer Form */}
      {showAddForm && (
        <div
          className="p-3 rounded-[7px] border space-y-2"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--muted)' }}>
              Name *
            </label>
            <input
              type="text"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full h-7 bg-white/[0.04] border border-white/[0.08] rounded-[6px] text-[11px] px-2.5 outline-none transition-all"
              style={{ color: 'var(--text)' }}
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--muted)' }}>
              Phone *
            </label>
            <input
              type="tel"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full h-7 bg-white/[0.04] border border-white/[0.08] rounded-[6px] text-[11px] px-2.5 outline-none transition-all"
              style={{ color: 'var(--text)' }}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--muted)' }}>
              Email
            </label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full h-7 bg-white/[0.04] border border-white/[0.08] rounded-[6px] text-[11px] px-2.5 outline-none transition-all"
              style={{ color: 'var(--text)' }}
              placeholder="Email (optional)"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--muted)' }}>
              Address
            </label>
            <input
              type="text"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              className="w-full h-7 bg-white/[0.04] border border-white/[0.08] rounded-[6px] text-[11px] px-2.5 outline-none transition-all"
              style={{ color: 'var(--text)' }}
              placeholder="Address (optional)"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddCustomer}
              disabled={isAdding}
              className="flex-1 h-7 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 rounded-[6px] text-white text-[11px] font-semibold transition-opacity"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewCustomer({ name: '', email: '', phone: '', address: '' });
              }}
              className="flex-1 h-7 bg-white/[0.05] hover:bg-white/[0.08] rounded-[6px] text-[11px] font-semibold transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Customer List (Dropdown) */}
      {isSearching && searchQuery.trim() && filteredCustomers.length > 0 && !showAddForm && (
        <div
          className="border rounded-[7px] max-h-48 overflow-y-auto"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}
        >
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => {
                onSelectCustomer(customer.id);
                setSearchQuery('');
                setIsSearching(false);
              }}
              className={`w-full text-left px-3 py-2.5 border-b last:border-0 hover:bg-white/[0.05] transition-colors text-[11px]`}
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <p className="font-medium" style={{ color: 'var(--text)' }}>
                {customer.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={8} />
                    {customer.phone}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Walk-in Customer Option */}
      <button
        onClick={() => {
          onSelectCustomer(null);
          setSearchQuery('');
          setIsSearching(false);
        }}
        className={`w-full h-8 rounded-[7px] border text-[11px] font-medium transition-all duration-[120ms] ${
          selectedCustomerId === null
            ? 'border-[var(--accent)]/45 bg-[var(--accent)]/[0.08]'
            : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
        }`}
        style={{ color: selectedCustomerId === null ? 'var(--accent)' : 'var(--muted-2)' }}
      >
        Walk-in Customer
      </button>
    </div>
  );
};

export default CustomerSelector;
