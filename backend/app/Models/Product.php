<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'category_id',
        'name',
        'slug',
        'description',
        'short_description',
        'type',
        'price',
        'compare_price',
        'stock_quantity',
        'track_quantity',
        'is_digital_download',
        'digital_file_path',
        'images',
        '3d_model_file',
        '3d_model_format',
        'specifications',
        'tags',
        'status',
        'is_featured',
        'rating',
        'rating_count',
        'sales_count',
        'views_count',
        'published_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'is_digital_download' => 'boolean',
        'track_quantity' => 'boolean',
        'images' => 'array',
        'specifications' => 'array',
        'tags' => 'array',
        'is_featured' => 'boolean',
        'rating' => 'decimal:2',
        'published_at' => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function activeVariants()
    {
        return $this->variants()->where('is_active', true);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function visibleReviews()
    {
        return $this->reviews()->where('is_visible', true);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function isInStock()
    {
        if (!$this->track_quantity) {
            return true;
        }
        
        return $this->stock_quantity > 0;
    }

    public function updateRating()
    {
        $reviews = $this->visibleReviews();
        $this->rating_count = $reviews->count();
        $this->rating = $this->rating_count > 0 ? $reviews->avg('rating') : 0;
        $this->save();
    }

    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function getMainImageAttribute()
    {
        $images = $this->images;
        return $images && count($images) > 0 ? $images[0] : null;
    }

    public function getMainImageUrlAttribute()
    {
        $mainImage = $this->main_image;
        return $mainImage ? asset('storage/' . $mainImage) : null;
    }

    public function get3dModelUrlAttribute()
    {
        return $this->3d_model_file ? asset('storage/' . $this->3d_model_file) : null;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeDigital($query)
    {
        return $query->where('type', 'digital');
    }

    public function scopePhysical($query)
    {
        return $query->where('type', 'physical');
    }

    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('track_quantity', false)
              ->orWhere('stock_quantity', '>', 0);
        });
    }
}
