<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'payment_id',
        'provider',
        'status',
        'amount',
        'currency',
        'payment_method',
        'provider_data',
        'paid_at',
        'refunded_at',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'provider_data' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isSuccessful()
    {
        return $this->status === 'succeeded';
    }

    public function isPending()
    {
        return $this->status === 'pending' || $this->status === 'processing';
    }

    public function isFailed()
    {
        return $this->status === 'failed' || $this->status === 'cancelled';
    }

    public function isRefunded()
    {
        return $this->status === 'refunded';
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'succeeded');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'processing']);
    }

    public function scopeFailed($query)
    {
        return $query->whereIn('status', ['failed', 'cancelled']);
    }
}
