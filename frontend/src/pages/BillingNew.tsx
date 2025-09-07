import React from 'react'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'

export default function BillingNew() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Billing</h1>
        <Card>
          <div className="text-sm text-muted-foreground">Billing dashboards and invoices will appear here. Coming soon.</div>
        </Card>
      </div>
    </AppShell>
  )
}

