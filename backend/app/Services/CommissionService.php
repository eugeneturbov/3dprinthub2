<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use App\Models\User;

class CommissionService
{
    /**
     * Calculate commission for an order item
     */
    public function calculateItemCommission(OrderItem $item): float
    {
        $product = $item->product;
        $commissionRate = $this->getCommissionRate($product->type);
        
        return $item->price * $item->quantity * ($commissionRate / 100);
    }

    /**
     * Calculate total commission for an order
     */
    public function calculateOrderCommission(Order $order): float
    {
        $totalCommission = 0;
        
        foreach ($order->items as $item) {
            $totalCommission += $this->calculateItemCommission($item);
        }
        
        return $totalCommission;
    }

    /**
     * Get commission rate based on product type
     */
    public function getCommissionRate(string $productType): float
    {
        return match($productType) {
            'physical' => config('commission.physical', 12),
            'digital' => config('commission.digital', 20),
            default => config('commission.physical', 12),
        };
    }

    /**
     * Process commission after successful payment
     */
    public function processCommission(Order $order): void
    {
        foreach ($order->items as $item) {
            $commissionAmount = $this->calculateItemCommission($item);
            
            // Create commission transaction for platform
            Transaction::create([
                'user_id' => null, // Platform transaction
                'order_id' => $order->id,
                'type' => 'commission',
                'amount' => $commissionAmount,
                'balance_before' => 0,
                'balance_after' => 0,
                'description' => "Commission from order #{$order->id}",
                'status' => 'completed',
                'processed_at' => now(),
                'metadata' => [
                    'order_item_id' => $item->id,
                    'commission_rate' => $this->getCommissionRate($item->product->type),
                ],
            ]);

            // Create sale transaction for seller
            $seller = $item->shop->user;
            $saleAmount = $item->price * $item->quantity - $commissionAmount;
            
            Transaction::create([
                'user_id' => $seller->id,
                'order_id' => $order->id,
                'type' => 'sale',
                'amount' => $saleAmount,
                'balance_before' => $seller->balance,
                'balance_after' => $seller->balance + $saleAmount,
                'description' => "Sale from order #{$order->id}",
                'status' => 'completed',
                'processed_at' => now(),
                'metadata' => [
                    'order_item_id' => $item->id,
                    'commission_amount' => $commissionAmount,
                ],
            ]);

            // Update seller balance
            $seller->balance += $saleAmount;
            $seller->save();
        }
    }

    /**
     * Process refund and adjust commissions
     */
    public function processRefund(Order $order, float $refundAmount): void
    {
        foreach ($order->items as $item) {
            $itemRefundAmount = ($item->price * $item->quantity / $order->subtotal) * $refundAmount;
            $commissionAmount = $this->calculateItemCommission($item);
            $commissionRefund = ($commissionAmount / ($item->price * $item->quantity)) * $itemRefundAmount;
            
            $seller = $item->shop->user;
            $saleRefund = $itemRefundAmount - $commissionRefund;
            
            // Create refund transaction for seller
            Transaction::create([
                'user_id' => $seller->id,
                'order_id' => $order->id,
                'type' => 'refund',
                'amount' => -$saleRefund,
                'balance_before' => $seller->balance,
                'balance_after' => $seller->balance - $saleRefund,
                'description' => "Refund for order #{$order->id}",
                'status' => 'completed',
                'processed_at' => now(),
                'metadata' => [
                    'order_item_id' => $item->id,
                    'commission_refund' => $commissionRefund,
                ],
            ]);

            // Update seller balance
            $seller->balance -= $saleRefund;
            $seller->save();
        }
    }

    /**
     * Calculate seller earnings after commission
     */
    public function calculateSellerEarnings(OrderItem $item): float
    {
        $commissionAmount = $this->calculateItemCommission($item);
        return ($item->price * $item->quantity) - $commissionAmount;
    }
}
