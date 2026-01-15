<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Shop\ShopController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Category\CategoryController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Cart\CartController;
use App\Http\Controllers\Review\ReviewController;
use App\Http\Controllers\Message\MessageController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminShopController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminUserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    
    // Public routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::get('/shops', [ShopController::class, 'index']);
    Route::get('/shops/{shop}', [ShopController::class, 'show']);
    
    // Authentication routes
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:sanctum');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);
        Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
        
        // OAuth routes
        Route::get('/oauth/{provider}', [OAuthController::class, 'redirect']);
        Route::get('/oauth/{provider}/callback', [OAuthController::class, 'callback']);
    });
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        
        // User routes
        Route::prefix('user')->group(function () {
            Route::get('/profile', [UserController::class, 'profile']);
            Route::put('/profile', [UserController::class, 'updateProfile']);
            Route::post('/avatar', [UserController::class, 'uploadAvatar']);
            Route::put('/password', [UserController::class, 'updatePassword']);
            Route::get('/balance', [UserController::class, 'balance']);
            Route::get('/transactions', [UserController::class, 'transactions']);
            Route::post('/withdraw', [UserController::class, 'withdraw']);
        });
        
        // Address routes
        Route::apiResource('addresses', \App\Http\Controllers\Address\AddressController::class);
        
        // Cart routes
        Route::prefix('cart')->group(function () {
            Route::get('/', [CartController::class, 'index']);
            Route::post('/add', [CartController::class, 'add']);
            Route::put('/{cartItem}', [CartController::class, 'update']);
            Route::delete('/{cartItem}', [CartController::class, 'remove']);
            Route::delete('/', [CartController::class, 'clear']);
        });
        
        // Order routes
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index']);
            Route::post('/', [OrderController::class, 'store']);
            Route::get('/{order}', [OrderController::class, 'show']);
            Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
            Route::post('/{order}/review', [OrderController::class, 'review']);
        });
        
        // Payment routes
        Route::prefix('payments')->group(function () {
            Route::post('/create', [PaymentController::class, 'create']);
            Route::get('/{payment}/status', [PaymentController::class, 'status']);
            Route::post('/{payment}/webhook', [PaymentController::class, 'webhook']);
        });
        
        // Review routes
        Route::apiResource('reviews', ReviewController::class)->only(['store', 'update', 'destroy']);
        
        // Message routes
        Route::prefix('messages')->group(function () {
            Route::get('/', [MessageController::class, 'index']);
            Route::post('/', [MessageController::class, 'store']);
            Route::put('/{message}/read', [MessageController::class, 'markAsRead']);
            Route::get('/unread-count', [MessageController::class, 'unreadCount']);
        });
        
        // Shop owner routes
        Route::middleware('seller')->prefix('seller')->group(function () {
            Route::post('/shops', [ShopController::class, 'store']);
            Route::put('/shops/{shop}', [ShopController::class, 'update']);
            Route::post('/shops/{shop}/logo', [ShopController::class, 'uploadLogo']);
            Route::post('/shops/{shop}/banner', [ShopController::class, 'uploadBanner']);
            
            Route::apiResource('products', ProductController::class)->except(['index', 'show']);
            Route::post('/products/{product}/images', [ProductController::class, 'uploadImages']);
            Route::post('/products/{product}/3d-model', [ProductController::class, 'upload3DModel']);
            Route::post('/products/{product}/digital-file', [ProductController::class, 'uploadDigitalFile']);
            
            Route::get('/orders', [OrderController::class, 'sellerOrders']);
            Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::post('/orders/{order}/tracking', [OrderController::class, 'addTracking']);
        });
        
        // Admin routes
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            
            // User management
            Route::apiResource('users', AdminUserController::class);
            Route::put('/users/{user}/role', [AdminUserController::class, 'updateRole']);
            Route::put('/users/{user}/status', [AdminUserController::class, 'updateStatus']);
            
            // Shop management
            Route::get('/shops', [AdminShopController::class, 'index']);
            Route::put('/shops/{shop}/approve', [AdminShopController::class, 'approve']);
            Route::put('/shops/{shop}/reject', [AdminShopController::class, 'reject']);
            Route::put('/shops/{shop}/suspend', [AdminShopController::class, 'suspend']);
            Route::put('/shops/{shop}/featured', [AdminShopController::class, 'toggleFeatured']);
            
            // Product management
            Route::get('/products', [AdminProductController::class, 'index']);
            Route::put('/products/{product}/approve', [AdminProductController::class, 'approve']);
            Route::put('/products/{product}/reject', [AdminProductController::class, 'reject']);
            Route::put('/products/{product}/featured', [AdminProductController::class, 'toggleFeatured']);
            
            // Order management
            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
            Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
            
            // Financial reports
            Route::get('/reports/sales', [AdminController::class, 'salesReport']);
            Route::get('/reports/commissions', [AdminController::class, 'commissionReport']);
            Route::get('/reports/sellers', [AdminController::class, 'sellerReport']);
        });
    });
});

Route::get('/health', function () {
    return response()->json(['status' => 'OK', 'timestamp' => now()]);
});
