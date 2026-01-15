<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\YooKassaService;
use App\Services\Payment\TinkoffService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['webhook']);
    }

    public function create(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'provider' => 'required|in:yookassa,tinkoff',
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be paid',
            ], 400);
        }

        // Check if payment already exists
        $existingPayment = Payment::where('order_id', $order->id)
            ->whereIn('status', ['pending', 'processing'])
            ->first();

        if ($existingPayment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment already in progress',
                'payment_id' => $existingPayment->id,
            ], 400);
        }

        $provider = $request->provider;
        $paymentService = $provider === 'yookassa' 
            ? app(YooKassaService::class)
            : app(TinkoffService::class);

        $result = $paymentService->createPayment($order);

        if ($result['success']) {
            return response()->json($result);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Payment creation failed',
        ], 500);
    }

    public function status(Payment $payment)
    {
        // Check if user owns this payment
        if ($payment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $provider = $payment->provider;
        $paymentService = $provider === 'yookassa' 
            ? app(YooKassaService::class)
            : app(TinkoffService::class);

        $result = $paymentService->getPaymentStatus($payment->payment_id);

        if ($result['success']) {
            // Update local payment status
            $payment->update([
                'status' => $result['status'],
                'provider_data' => $result,
            ]);

            return response()->json($result);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Failed to get payment status',
        ], 500);
    }

    public function webhook(Request $request, string $provider)
    {
        Log::info("Payment webhook received", [
            'provider' => $provider,
            'data' => $request->all(),
        ]);

        $paymentService = $provider === 'yookassa' 
            ? app(YooKassaService::class)
            : app(TinkoffService::class);

        // Verify webhook signature (for YooKassa)
        if ($provider === 'yookassa') {
            $signature = $request->header('Ipn-Signature');
            if (!$signature || !$this->verifyYooKassaSignature($request->getContent(), $signature)) {
                Log::error('Invalid YooKassa webhook signature');
                return response()->json(['message' => 'Invalid signature'], 401);
            }
        }

        $success = $paymentService->handleWebhook($request->all());

        if ($success) {
            return response()->json(['message' => 'Webhook processed']);
        }

        return response()->json(['message' => 'Webhook processing failed'], 500);
    }

    public function capture(Payment $payment)
    {
        // Check if user owns this payment
        if ($payment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($payment->status !== 'processing') {
            return response()->json([
                'success' => false,
                'message' => 'Payment cannot be captured',
            ], 400);
        }

        $provider = $payment->provider;
        $paymentService = $provider === 'yookassa' 
            ? app(YooKassaService::class)
            : app(TinkoffService::class);

        $result = $provider === 'yookassa' 
            ? $paymentService->capturePayment($payment->payment_id)
            : $paymentService->confirmPayment($payment->payment_id);

        if ($result['success']) {
            $payment->update([
                'status' => $result['status'],
                'provider_data' => $result,
            ]);

            return response()->json($result);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Payment capture failed',
        ], 500);
    }

    public function refund(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $payment->amount,
            'reason' => 'nullable|string|max:500',
        ]);

        // Check if user owns this payment
        if ($payment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($payment->status, ['succeeded', 'partial_refunded'])) {
            return response()->json([
                'success' => false,
                'message' => 'Payment cannot be refunded',
            ], 400);
        }

        $provider = $payment->provider;
        $paymentService = $provider === 'yookassa' 
            ? app(YooKassaService::class)
            : app(TinkoffService::class);

        $result = $paymentService->refundPayment($payment, $request->amount);

        if ($result['success']) {
            // Update payment status if full refund
            if ($request->amount >= $payment->amount) {
                $payment->update([
                    'status' => 'refunded',
                    'refunded_at' => now(),
                    'provider_data' => $result,
                ]);
            } else {
                $payment->update([
                    'status' => 'partial_refunded',
                    'provider_data' => $result,
                ]);
            }

            return response()->json($result);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error'] ?? 'Refund failed',
        ], 500);
    }

    public function methods()
    {
        $yooKassaService = app(YooKassaService::class);
        $tinkoffMethods = [
            [
                'id' => 'tinkoff_card',
                'name' => 'Банковская карта',
                'provider' => 'tinkoff',
                'type' => 'bank_card',
            ],
            [
                'id' => 'tinkoff_sbp',
                'name' => 'СБП',
                'provider' => 'tinkoff',
                'type' => 'sbp',
            ],
        ];

        $yooKassaResult = $yooKassaService->getPaymentMethods();
        $yooKassaMethods = $yooKassaResult['success'] 
            ? collect($yooKassaResult['methods'])->map(function ($method) {
                return [
                    'id' => 'yookassa_' . $method->getType(),
                    'name' => $method->getTitle() ?? $method->getType(),
                    'provider' => 'yookassa',
                    'type' => $method->getType(),
                ];
            })->toArray()
            : [];

        return response()->json([
            'success' => true,
            'methods' => array_merge($tinkoffMethods, $yooKassaMethods),
        ]);
    }

    private function verifyYooKassaSignature(string $payload, string $signature): bool
    {
        $secretKey = config('services.yookassa.secret_key');
        $expectedSignature = hash_hmac('sha1', $payload, $secretKey);
        
        return hash_equals($expectedSignature, $signature);
    }
}
