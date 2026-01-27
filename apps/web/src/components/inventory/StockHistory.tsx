'use client'

import { format } from 'date-fns'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface StockMovement {
    id: string
    type: string
    quantity: number
    notes?: string
    createdAt: string | number
    referenceType?: string
}

interface StockHistoryProps {
    movements: StockMovement[]
}

export function StockHistory({ movements }: StockHistoryProps) {
    if (!movements || movements.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No stock movement history available.
            </div>
        )
    }

    // Sort by date desc
    const sortedMovements = [...movements].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {sortedMovements.map((movement, movementIdx) => {
                    const isPositive = movement.quantity > 0
                    const isZero = movement.quantity === 0
                    const isNegative = movement.quantity < 0

                    return (
                        <li key={movement.id}>
                            <div className="relative pb-8">
                                {movementIdx !== sortedMovements.length - 1 ? (
                                    <span
                                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                                        aria-hidden="true"
                                    />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span
                                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${isZero
                                                ? 'bg-gray-400'
                                                : isPositive
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                                }`}
                                        >
                                            {isZero ? (
                                                <Minus className="h-5 w-5 text-white" aria-hidden="true" />
                                            ) : isPositive ? (
                                                <ArrowUp className="h-5 w-5 text-white" aria-hidden="true" />
                                            ) : (
                                                <ArrowDown className="h-5 w-5 text-white" aria-hidden="true" />
                                            )}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {movement.type.replace(/_/g, ' ')}
                                                </span>{' '}
                                                {movement.notes && <span className="text-gray-400">- {movement.notes}</span>}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            <div className={`font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                {isPositive ? '+' : ''}{movement.quantity}
                                            </div>
                                            <time dateTime={new Date(movement.createdAt).toISOString()}>
                                                {format(new Date(movement.createdAt), 'MMM d, yyyy HH:mm')}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
