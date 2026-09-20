import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const typeLabels: Record<string, string> = {
  credit_grant: 'Starter credits',
  escrow_lock: 'Escrow deposit',
  escrow_release: 'Escrow returned',
  escrow_forfeit: 'Escrow forfeited',
  session_earn: 'Session earnings',
  session_spend: 'Session spend',
  penalty: 'Penalty',
  refund: 'Refund',
}

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('user_id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('tx_id, type, amount, balance_after, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Credit Ledger</h1>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-6 py-3 text-center">
          <p className="text-xs text-indigo-500">Current balance</p>
          <p className="text-2xl font-bold text-indigo-700">
            {profile?.credit_balance ?? 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {transactions && transactions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  Description
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Balance after
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx: any) => (
                <tr key={tx.tx_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {typeLabels[tx.type] ?? tx.type}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{tx.description}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {tx.balance_after}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">
            No transactions yet. Complete your email verification to receive
            your 5 starter credits.
          </div>
        )}
      </div>
    </div>
  )
}
