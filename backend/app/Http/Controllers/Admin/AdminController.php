<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
    }

    public function dashboard()
    {
        $stats = [
            'total_users' => User::count(),
            'new_users_today' => User::whereDate('created_at', today())->count(),
            'total_shops' => Shop::count(),
            'pending_shops' => Shop::where('status', 'pending')->count(),
            'total_products' => Product::count(),
            'pending_products' => Product::where('status', 'pending')->count(),
            'total_orders' => Order::count(),
            'new_orders_today' => Order::whereDate('created_at', today())->count(),
            'total_revenue' => Payment::where('status', 'succeeded')->sum('amount'),
            'today_revenue' => Payment::where('status', 'succeeded')
                ->whereDate('paid_at', today())
                ->sum('amount'),
            'total_commission' => Transaction::where('type', 'commission')
                ->where('status', 'completed')
                ->sum('amount'),
            'today_commission' => Transaction::where('type', 'commission')
                ->where('status', 'completed')
                ->whereDate('processed_at', today())
                ->sum('amount'),
        ];

        $recentActivities = $this->getRecentActivities();

        return response()->json([
            'stats' => $stats,
            'recent_activities' => $recentActivities,
        ]);
    }

    private function getRecentActivities()
    {
        $activities = [];

        // Recent users
        $recentUsers = User::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'created_at']);

        foreach ($recentUsers as $user) {
            $activities[] = [
                'id' => 'user_' . $user->id,
                'type' => 'user_registered',
                'description' => "Новый пользователь: {$user->name}",
                'user_name' => $user->name,
                'created_at' => $user->created_at,
                'action_url' => "/admin/users/{$user->id}",
            ];
        }

        // Recent shops
        $recentShops = Shop::with('user')
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentShops as $shop) {
            $activities[] = [
                'id' => 'shop_' . $shop->id,
                'type' => 'shop_created',
                'description' => "Новый магазин: {$shop->name}",
                'user_name' => $shop->user->name,
                'created_at' => $shop->created_at,
                'action_url' => "/admin/shops/{$shop->id}",
            ];
        }

        // Recent products
        $recentProducts = Product::with('shop.user')
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentProducts as $product) {
            $activities[] = [
                'id' => 'product_' . $product->id,
                'type' => 'product_created',
                'description' => "Новый товар: {$product->name}",
                'user_name' => $product->shop->user->name,
                'created_at' => $product->created_at,
                'action_url' => "/admin/products/{$product->id}",
            ];
        }

        // Recent orders
        $recentOrders = Order::with('user')
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentOrders as $order) {
            $activities[] = [
                'id' => 'order_' . $order->id,
                'type' => 'order_created',
                'description' => "Новый заказ #{$order->order_number}",
                'user_name' => $order->user->name,
                'created_at' => $order->created_at,
                'action_url' => "/admin/orders/{$order->id}",
            ];
        }

        // Recent payments
        $recentPayments = Payment::with('order.user')
            ->where('status', 'succeeded')
            ->latest('paid_at')
            ->take(5)
            ->get();

        foreach ($recentPayments as $payment) {
            $activities[] = [
                'id' => 'payment_' . $payment->id,
                'type' => 'payment_completed',
                'description' => "Оплачена сумма: {$payment->amount} ₽",
                'user_name' => $payment->order->user->name,
                'created_at' => $payment->paid_at,
                'action_url' => "/admin/orders/{$payment->order_id}",
            ];
        }

        // Sort by date and limit
        usort($activities, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return array_slice($activities, 0, 20);
    }

    public function salesReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30));
        $endDate = $request->get('end_date', now());

        $sales = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders_count, SUM(total) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($sales);
    }

    public function commissionReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30));
        $endDate = $request->get('end_date', now());

        $commissions = Transaction::whereBetween('processed_at', [$startDate, $endDate])
            ->where('type', 'commission')
            ->where('status', 'completed')
            ->selectRaw('DATE(processed_at) as date, SUM(amount) as commission')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($commissions);
    }

    public function sellerReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30));
        $endDate = $request->get('end_date', now());

        $sellers = User::whereHas('shop')
            ->with(['shop', 'transactions' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('processed_at', [$startDate, $endDate])
                    ->where('type', 'sale')
                    ->where('status', 'completed');
            }])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'shop_name' => $user->shop->name,
                    'shop_status' => $user->shop->status,
                    'total_sales' => $user->transactions->sum('amount'),
                    'commission_paid' => $user->transactions->count(),
                    'products_count' => $user->shop->products()->count(),
                ];
            })
            ->sortByDesc('total_sales')
            ->values();

        return response()->json($sellers);
    }
}
