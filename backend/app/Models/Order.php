<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'commission_amount',
        'shipping_cost',
        'total',
        'currency',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
        'shipping_city',
        'shipping_postal_code',
        'shipping_country',
        'tracking_number',
        'delivery_method',
        'delivery_data',
        'notes',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total' => 'decimal:2',
        'delivery_data' => 'array',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function canBeReviewed()
    {
        return $this->status === 'delivered' && !$this->reviews()->exists();
    }

    public function canBeCancelled()
    {
        return in_array($this->status, ['pending', 'paid']);
    }

    public function isPaid()
    {
        return $this->status === 'paid' || 
               in_array($this->status, ['processing', 'shipped', 'delivered']);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeShipped($query)
    {
        return $query->where('status', 'shipped');
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }
}
