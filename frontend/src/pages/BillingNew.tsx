import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Toast from "../components/Toast";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Send,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface Invoice {
  id: number;
  project: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft" | "sent";
  invoiceDate: string | null;
  dueDate: string | null;
  paymentDate: string | null;
  tasksCompleted: number;
  totalTasks: number;
  projectProgress: number;
}

export default function BillingNew() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
    isVisible: boolean;
  }>({ message: "", type: "info", isVisible: false });
  const closeToast = () => setToast((p) => ({ ...p, isVisible: false }));

  // Dummy invoices (from reference)
  const [invoices] = useState<Invoice[]>([
    {
      id: 1,
      project: "Website Redesign",
      client: "Acme Corporation",
      amount: 25000,
      status: "paid",
      invoiceDate: "2023-10-15",
      dueDate: "2023-11-15",
      paymentDate: "2023-11-10",
      tasksCompleted: 12,
      totalTasks: 12,
      projectProgress: 100,
    },
    {
      id: 2,
      project: "Product Launch",
      client: "Globex Inc",
      amount: 45000,
      status: "pending",
      invoiceDate: "2023-11-01",
      dueDate: "2023-12-01",
      paymentDate: null,
      tasksCompleted: 18,
      totalTasks: 20,
      projectProgress: 90,
    },
    {
      id: 3,
      project: "Marketing Campaign",
      client: "Wayne Enterprises",
      amount: 15000,
      status: "overdue",
      invoiceDate: "2023-09-01",
      dueDate: "2023-10-01",
      paymentDate: null,
      tasksCompleted: 8,
      totalTasks: 8,
      projectProgress: 100,
    },
    {
      id: 4,
      project: "Mobile App Development",
      client: "Stark Industries",
      amount: 75000,
      status: "draft",
      invoiceDate: null,
      dueDate: null,
      paymentDate: null,
      tasksCompleted: 5,
      totalTasks: 25,
      projectProgress: 20,
    },
    {
      id: 5,
      project: "E-commerce Platform",
      client: "Parker Industries",
      amount: 60000,
      status: "sent",
      invoiceDate: "2023-11-10",
      dueDate: "2023-12-10",
      paymentDate: null,
      tasksCompleted: 15,
      totalTasks: 15,
      projectProgress: 100,
    },
  ]);

  // Search/filter
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((inv) =>
      [inv.project, inv.client].some((v) => v.toLowerCase().includes(term))
    );
  }, [q, invoices]);

  const totalInvoiced = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.amount, 0),
    [invoices]
  );
  const totalPaid = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount, 0),
    [invoices]
  );
  const totalOutstanding = useMemo(
    () =>
      invoices
        .filter((i) => ["pending", "overdue", "sent"].includes(i.status))
        .reduce((s, i) => s + i.amount, 0),
    [invoices]
  );
  const overdueAmount = useMemo(
    () =>
      invoices
        .filter((i) => i.status === "overdue")
        .reduce((s, i) => s + i.amount, 0),
    [invoices]
  );
  const paidPercentage = useMemo(
    () =>
      totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0,
    [totalInvoiced, totalPaid]
  );
  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status === "overdue").length,
    [invoices]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  // Charts (dummy)
  const statusData = useMemo(
    () => [
      {
        name: "Paid",
        value: invoices.filter((i) => i.status === "paid").length || 12,
        color: "#10b981",
      },
      {
        name: "Pending",
        value: invoices.filter((i) => i.status === "pending").length || 5,
        color: "#3b82f6",
      },
      {
        name: "Overdue",
        value: invoices.filter((i) => i.status === "overdue").length || 3,
        color: "#ef4444",
      },
      {
        name: "Draft",
        value: invoices.filter((i) => i.status === "draft").length || 2,
        color: "#94a3b8",
      },
      {
        name: "Sent",
        value: invoices.filter((i) => i.status === "sent").length || 8,
        color: "#f59e0b",
      },
    ],
    [invoices]
  );
  const totalInvoices = useMemo(
    () => statusData.reduce((s, i) => s + i.value, 0),
    [statusData]
  );
  const revenueData = useMemo(
    () => [
      { month: "Jan", revenue: 45000, invoices: 12 },
      { month: "Feb", revenue: 52000, invoices: 15 },
      { month: "Mar", revenue: 48000, invoices: 14 },
      { month: "Apr", revenue: 61000, invoices: 18 },
      { month: "May", revenue: 55000, invoices: 16 },
      { month: "Jun", revenue: 67000, invoices: 20 },
    ],
    []
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Billings</h1>
            <p className="text-sm text-muted-foreground">
              Track project invoices and payments
            </p>
          </div>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* Payment Reminder */}
        {overdueInvoices > 0 && (
          <Card className="border-red-500">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-red-600 font-semibold text-lg">
                    {/* Bell icon to match spec */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Payment Reminders
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have overdue invoices that require attention
                  </p>
                  <div className="mt-4 text-sm font-medium">
                    {overdueInvoices} overdue invoice
                    {overdueInvoices > 1 ? "s" : ""}
                  </div>
                  <div className="text-3xl font-bold text-red-600 mt-1">
                    {formatCurrency(overdueAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Total overdue amount
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setToast({
                        message: `Sent ${overdueInvoices} payment reminders.`,
                        type: "success",
                        isVisible: true,
                      });
                    }}
                    className="bg-red-600 hover:bg-red-700"
                    variant="danger"
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Send Reminders
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last reminder sent 3 days ago
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Total Invoiced</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalInvoiced)}
              </div>
              <div className="text-xs text-muted-foreground">
                Across all projects
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Total Paid</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPaid)}
              </div>
              <div className="text-xs text-muted-foreground">
                Payments received
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Outstanding</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totalOutstanding)}
              </div>
              <div className="text-xs text-muted-foreground">
                Pending payments
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Overdue</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(overdueAmount)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-2 w-16 bg-[var(--border-color)] rounded">
                  <div
                    className="h-2 bg-green-500 rounded"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {paidPercentage}% paid
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="flex flex-col md:flex-row gap-4">
<div className="flex-1 min-w-0 md:basis-1/2">
            <Card>
              <div className="p-4">
                <div className="mb-1 text-base font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Invoice Status Overview
                </div>
                <div className="text-sm text-muted-foreground">
                  Distribution of invoices by status
                </div>
                <div className="flex flex-wrap gap-4 mb-4 justify-between">
                  <div className="border rounded-lg p-4 text-center flex-1 min-w-[140px] max-w-[180px]">
                    <div className="flex justify-center mb-2 text-green-600">
                      <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold">{statusData[0].value}</div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center flex-1 min-w-[140px] max-w-[180px]">
                    <div className="flex justify-center mb-2 text-blue-600">
                      <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold">{statusData[1].value}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center flex-1 min-w-[140px] max-w-[180px]">
                    <div className="flex justify-center mb-2 text-red-600">
                      <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold">{statusData[2].value}</div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center flex-1 min-w-[140px] max-w-[180px]">
                    <div className="flex justify-center mb-2 text-slate-500">
                      <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold">{statusData[3].value}</div>
                    <div className="text-xs text-muted-foreground">Draft</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center flex-1 min-w-[140px] max-w-[180px]">
                    <div className="flex justify-center mb-2 text-amber-500">
                      <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold">{statusData[4].value}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [value, 'Invoices']} labelFormatter={(name: any) => `${name} Invoices`} />
                      <Bar dataKey="value" name="Invoices">
                        {statusData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-center text-sm text-muted-foreground">
                  Total Invoices: <span className="font-medium text-foreground">{totalInvoices}</span>
                </div>
              </div>
            </Card>
          </div>

<div className="flex-1 min-w-0 md:basis-1/2">
            <Card>
              <div className="p-4">
                <div className="mb-1 text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Revenue Overview
                </div>
                <div className="text-sm text-muted-foreground">
                  Monthly revenue and invoice trends
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />{" "}
                      Total Revenue
                    </div>
                    <div className="text-3xl font-bold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(revenueData.reduce((s, i) => s + i.revenue, 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      This year
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />{" "}
                      Avg. Monthly
                    </div>
                    <div className="text-3xl font-bold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(
                        Math.round(
                          revenueData.reduce((s, i) => s + i.revenue, 0) /
                            revenueData.length
                        )
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      6 months
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        formatter={(v: any) => [
                          new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          }).format(v),
                          "Revenue",
                        ]}
                        labelFormatter={(name: any) => `Month: ${name}`}
                      />
                      <Bar dataKey="revenue" name="Revenue">
                        {revenueData.map((e, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === revenueData.length - 1
                                ? "#3b82f6"
                                : "#94a3b8"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-center text-sm text-muted-foreground">
                  Showing revenue data for the last 6 months
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Billing Overview Table */}
        <Card>
          <div className="p-4">
            <div className="mb-3">
              <div className="text-base font-semibold">Billing Overview</div>
              <div className="text-xs text-muted-foreground">
                Track invoices, payments, and project status
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <Input
                  placeholder="Search projects or clients..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  leftIcon={<FileText className="h-4 w-4" />}
                />
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border-color)]">
              <div className="border-b border-[var(--border-color)] p-3 font-medium">
                <div className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-3">Project</div>
                  <div className="col-span-2">Client</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-1" />
                </div>
              </div>
              <div className="divide-y divide-[var(--border-color)]">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 hover:bg-[var(--secondary-bg)]"
                  >
                    <div className="grid grid-cols-12 gap-2 items-center text-sm">
                      <div className="col-span-3">
                        <div className="font-medium">{inv.project}</div>
                        <div className="text-xs text-muted-foreground">
                          {inv.invoiceDate
                            ? `Invoiced: ${new Date(
                                inv.invoiceDate
                              ).toLocaleDateString()}`
                            : "Not invoiced"}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[10px] flex items-center justify-center text-foreground">
                            {inv.client
                              .split(" ")
                              .map((x) => x[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span>{inv.client}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-medium">
                          {formatCurrency(inv.amount)}
                        </div>
                        {inv.dueDate && (
                          <div className="text-xs text-muted-foreground">
                            Due: {new Date(inv.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <div className="inline-flex items-center gap-2">
                          {inv.status === "paid" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : inv.status === "pending" ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : inv.status === "overdue" ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              inv.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : inv.status === "pending"
                                ? "bg-blue-100 text-blue-800"
                                : inv.status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : inv.status === "sent"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800",
                            ].join(" ")}
                          >
                            {inv.status.charAt(0).toUpperCase() +
                              inv.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full bg-[var(--border-color)] rounded">
                            <div
                              className="h-2 bg-blue-600 rounded"
                              style={{ width: `${inv.projectProgress}%` }}
                            />
                          </div>
                          <span className="text-xs w-10 text-right">
                            {inv.projectProgress}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {inv.tasksCompleted}/{inv.totalTasks} tasks
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/billing/${inv.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Client Payment History (dummy) */}
        <Card>
          <div className="p-4">
            <div className="mb-3">
              <div className="text-base font-semibold">
                Client Payment History
              </div>
              <div className="text-xs text-muted-foreground">
                Payment trends by client
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  name: "Acme Corporation",
                  totalInvoiced: 75000,
                  totalPaid: 75000,
                  outstanding: 0,
                  lastPayment: "2023-11-10",
                  paymentHistory: [
                    { date: "2023-11-10", amount: 25000, status: "paid" },
                    { date: "2023-10-15", amount: 25000, status: "paid" },
                    { date: "2023-09-20", amount: 25000, status: "paid" },
                  ],
                },
                {
                  id: 2,
                  name: "Globex Inc",
                  totalInvoiced: 65000,
                  totalPaid: 45000,
                  outstanding: 20000,
                  lastPayment: "2023-11-05",
                  paymentHistory: [
                    { date: "2023-11-05", amount: 20000, status: "paid" },
                    { date: "2023-10-20", amount: 25000, status: "paid" },
                    { date: "2023-09-15", amount: 20000, status: "pending" },
                  ],
                },
                {
                  id: 3,
                  name: "Wayne Enterprises",
                  totalInvoiced: 30000,
                  totalPaid: 15000,
                  outstanding: 15000,
                  lastPayment: "2023-10-25",
                  paymentHistory: [
                    { date: "2023-10-25", amount: 15000, status: "paid" },
                    { date: "2023-09-30", amount: 15000, status: "overdue" },
                  ],
                },
              ].map((client) => {
                const paymentPercentage =
                  client.totalInvoiced > 0
                    ? Math.round(
                        (client.totalPaid / client.totalInvoiced) * 100
                      )
                    : 0;
                return (
                  <div key={client.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[11px] flex items-center justify-center text-foreground">
                        {client.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Last payment:{" "}
                          {new Date(client.lastPayment).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          Total Invoiced
                        </div>
                        <div className="font-medium">
                          {formatCurrency(client.totalInvoiced)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Paid</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(client.totalPaid)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Outstanding</div>
                        <div
                          className={
                            client.outstanding > 0
                              ? "font-medium text-red-600"
                              : "font-medium"
                          }
                        >
                          {formatCurrency(client.outstanding)}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Payment Progress</span>
                        <span>{paymentPercentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--border-color)] rounded">
                        <div
                          className="h-2 bg-blue-600 rounded"
                          style={{ width: `${paymentPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Recent Payments
                      </div>
                      <div className="space-y-1 text-sm">
                        {client.paymentHistory.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(p.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatCurrency(p.amount)}
                              </span>
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  p.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : p.status === "pending"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800",
                                ].join(" ")}
                              >
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
        />
      </div>
    </AppShell>
  );
}
