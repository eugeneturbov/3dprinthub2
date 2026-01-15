<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'logo',
        'banner',
        'email',
        'phone',
        'website',
        'social_links',
        'status',
        'rejection_reason',
        'rating',
        'rating_count',
        'is_featured',
    ];

    protected $casts = [
        'social_links' => 'array',
        'rating' => 'decimal:2',
        'is_featured' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function activeProducts()
    {
        return $this->products()->where('status', 'active');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasManyThrough(Review::class, Product::class);
    }

    public function updateRating()
    {
        $reviews = $this->reviews()->where('is_visible', true);
        $this->rating_count = $reviews->count();
        $this->rating = $this->rating_count > 0 ? $reviews->avg('rating') : 0;
        $this->save();
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/' . $this->logo) : null;
    }

    public function getBannerUrlAttribute()
    {
        return $this->banner ? asset('storage/' . $this->banner) : null;
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
