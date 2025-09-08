import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { FileText, CheckCircle, Clock, Download, Send, Edit, Printer, Building2, User, Calendar as CalendarIcon } from 'lucide-react'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(amount)

type InvoiceItem = { id: number; description: string; quantity: number; rate: number; amount: number }

type Invoice = {
  id: string
  client: string
  project: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'sent'
  invoiceDate: string
  dueDate: string
  paymentDate?: string | null
  notes?: string
  items: InvoiceItem[]
}

export default function BillingDetailNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoiceStatus, setInvoiceStatus] = useState<'paid'|'pending'|'overdue'|'draft'|'sent'>('sent')

  // Dummy invoice data (single)
  const invoice: Invoice = useMemo(() => ({
    id: `INV-${String(id || '001').padStart(3,'0')}`,
    client: 'Acme Corporation',
    project: 'Website Redesign',
    amount: 25000,
    status: 'paid',
    invoiceDate: '2023-10-15',
    dueDate: '2023-11-15',
    paymentDate: '2023-11-10',
    notes: 'Thank you for your business. Payment due within 30 days.',
    items: [
      { id: 1, description: 'Website Design', quantity: 1, rate: 15000, amount: 15000 },
      { id: 2, description: 'Frontend Development', quantity: 1, rate: 10000, amount: 10000 }
    ]
  }), [id])

  const client = useMemo(() => ({
    name: 'Acme Corporation',
    contact: 'John Smith',
    email: 'john@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, San Francisco, CA 94107'
  }), [])

  const statusBadge = (status: string) => (
    <span className={[
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      status==='paid' ? 'bg-green-100 text-green-800' : status==='pending' ? 'bg-blue-100 text-blue-800' : status==='overdue' ? 'bg-red-100 text-red-800' : status==='sent' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
    ].join(' ')}>
      {status[0].toUpperCase()+status.slice(1)}
    </span>
  )

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Invoice {invoice.id}</h1>
                <p className="text-sm text-muted-foreground">{invoice.project}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(invoiceStatus)}
              <span className="text-xs text-muted-foreground">Issued: {new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />}>Print</Button>
            <Button variant="primary" leftIcon={<Download className="h-4 w-4" />}>Download PDF</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card title="Invoice Details" subtitle={`Invoice #${invoice.id} for ${invoice.project}`}>
              <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 bg-[var(--secondary-bg)] text-sm font-medium">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2">Amount</div>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                  {invoice.items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-3 text-sm">
                      <div className="col-span-6">{item.description}</div>
                      <div className="col-span-2">{item.quantity}</div>
                      <div className="col-span-2">{formatCurrency(item.rate)}</div>
                      <div className="col-span-2">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[var(--border-color)]">
                  <div className="flex justify-end">
                    <div className="w-64">
                      <div className="flex justify-between py-2"><span>Subtotal</span><span>{formatCurrency(invoice.amount)}</span></div>
                      <div className="flex justify-between py-2"><span>Tax (0%)</span><span>{formatCurrency(0)}</span></div>
                      <div className="flex justify-between py-2 border-t font-bold"><span>Total</span><span>{formatCurrency(invoice.amount)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              {invoice.notes && (
                <div className="mt-4 p-4 bg-[var(--secondary-bg)] rounded-lg">
                  <div className="font-medium mb-1">Notes</div>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </Card>

            <Card title="Payment History" subtitle="Record of payments for this invoice">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg border-[var(--border-color)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 text-green-800"><CheckCircle className="h-5 w-5" /></div>
                    <div>
                      <div className="font-medium">Payment Received</div>
                      <div className="text-xs text-muted-foreground">Transaction ID: TXN-001</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(invoice.paymentDate || invoice.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Client Information" subtitle="Details about the client">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{client.name[0]}</div>
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.contact}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> <span>{client.address}</span></div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>{client.contact}</span></div>
                <div className="flex items-center gap-2"><Send className="h-4 w-4 text-muted-foreground" /> <a className="hover:underline" href={`mailto:${client.email}`}>{client.email}</a></div>
              </div>
            </Card>

            <Card title="Invoice Actions" subtitle="Manage this invoice">
              <div className="space-y-2">
                <Button variant="outline" className="w-full" leftIcon={<Send className="h-4 w-4" />}>Send Invoice</Button>
                <Button variant="outline" className="w-full" leftIcon={<Edit className="h-4 w-4" />}>Edit Invoice</Button>
                <Button variant="outline" className="w-full" leftIcon={<Download className="h-4 w-4" />}>Download PDF</Button>
                <Button variant="outline" className="w-full text-red-600">Delete Invoice</Button>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Change Status</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['draft','sent','paid','overdue'] as const).map(s => (
                    <Button key={s} size="sm" variant={invoiceStatus===s? 'primary':'outline'} onClick={()=>setInvoiceStatus(s)}>{s[0].toUpperCase()+s.slice(1)}</Button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Payment Timeline" subtitle="Key dates for this invoice">
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center"><div className="h-2 w-2 rounded-full bg-green-500"></div><div className="h-full w-0.5 bg-[var(--border-color)] mt-1"/></div>
                  <div><div className="font-medium">Invoice Issued</div><div className="text-xs text-muted-foreground">{new Date(invoice.invoiceDate).toLocaleDateString()}</div></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center"><div className="h-2 w-2 rounded-full bg-green-500"></div><div className="h-full w-0.5 bg-[var(--border-color)] mt-1"/></div>
                  <div><div className="font-medium">Payment Due</div><div className="text-xs text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</div></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center"><div className="h-2 w-2 rounded-full bg-green-500"></div></div>
                  <div><div className="font-medium">Payment Received</div><div className="text-xs text-muted-foreground">{new Date((invoice.paymentDate||invoice.dueDate)).toLocaleDateString()}</div></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
