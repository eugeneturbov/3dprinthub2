<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Services\CommissionService;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class TinkoffService
{
    private Client $client;
    private CommissionService $commissionService;
    private string $terminalKey;
    private string $secretKey;
    private bool $demo;

    public function __construct(CommissionService $commissionService)
    {
        $this->client = new Client([
            'base_uri' => config('services.tinkoff.demo', true) 
                ? 'https://securepay.tinkoff.ru/v2/' 
                : 'https://securepay.tinkoff.ru/v2/',
            'timeout' => 30,
        ]);

        $this->terminalKey = config('services.tinkoff.terminal_key');
        $this->secretKey = config('services.tinkoff.secret_key');
        $this->demo = config('services.tinkoff.demo', true);
        $this->commissionService = $commissionService;
    }

    public function createPayment(Order $order): array
    {
        try {
            $data = [
                'TerminalKey' => $this->terminalKey,
                'Amount' => $order->total * 100, // Tinkoff works in kopecks
                'OrderId' => $order->id,
                'Description' => "Оплата заказа #{$order->order_number}",
                'DATA' => [
                    'Email' => $order->user->email,
                    'Phone' => $order->shipping_phone,
                ],
                'Receipt' => [
                    'Email' => $order->user->email,
                    'Phone' => $order->shipping_phone,
                    'Taxation' => 'USN',
                    'Items' => $this->buildReceiptItems($order),
                ],
                'SuccessURL' => config('app.frontend_url') . "/checkout/success?order_id={$order->id}",
                'FailURL' => config('app.frontend_url') . "/checkout/failed?order_id={$order->id}",
                'NotificationURL' => config('app.url') . "/api/v1/payments/tinkoff/webhook",
            ];

            $data['Token'] = $this->generateToken($data);

            $response = $this->client->post('Init', [
                'json' => $data,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            if ($result['Success'] ?? false) {
                // Save payment to database
                $payment = Payment::create([
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'payment_id' => $result['PaymentId'],
                    'provider' => 'tinkoff',
                    'status' => $this->mapTinkoffStatus($result['Status'] ?? 'NEW'),
                    'amount' => $order->total,
                    'currency' => 'RUB',
                    'payment_method' => 'card',
                    'provider_data' => $result,
                ]);

                return [
                    'success' => true,
                    'payment_id' => $payment->id,
                    'payment_url' => $result['PaymentURL'] ?? null,
                    'payment_status' => $payment->status,
                ];
            }

            return [
                'success' => false,
                'error' => $result['Details'] ?? 'Unknown error',
                'message' => $result['Message'] ?? 'Payment initialization failed',
            ];

        } catch (RequestException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getPaymentStatus(string $paymentId): array
    {
        try {
            $data = [
                'TerminalKey' => $this->terminalKey,
                'PaymentId' => $paymentId,
            ];

            $data['Token'] = $this->generateToken($data);

            $response = $this->client->post('GetState', [
                'json' => $data,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            if ($result['Success'] ?? false) {
                return [
                    'success' => true,
                    'status' => $this->mapTinkoffStatus($result['Status'] ?? 'NEW'),
                    'amount' => ($result['Amount'] ?? 0) / 100,
                    'currency' => 'RUB',
                    'payment_method' => 'card',
                    'created_at' => $result['Created'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => $result['Details'] ?? 'Unknown error',
            ];

        } catch (RequestException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function confirmPayment(string $paymentId): array
    {
        try {
            $data = [
                'TerminalKey' => $this->terminalKey,
                'PaymentId' => $paymentId,
            ];

            $data['Token'] = $this->generateToken($data);

            $response = $this->client->post('Confirm', [
                'json' => $data,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            if ($result['Success'] ?? false) {
                return [
                    'success' => true,
                    'status' => $this->mapTinkoffStatus($result['Status'] ?? 'NEW'),
                ];
            }

            return [
                'success' => false,
                'error' => $result['Details'] ?? 'Unknown error',
            ];

        } catch (RequestException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function refundPayment(Payment $payment, float $amount): array
    {
        try {
            $data = [
                'TerminalKey' => $this->terminalKey,
                'PaymentId' => $payment->payment_id,
                'Amount' => $amount * 100, // Convert to kopecks
                'Receipt' => [
                    'Email' => $payment->user->email,
                    'Taxation' => 'USN',
                    'Items' => $this->buildRefundReceiptItems($payment, $amount),
                ],
            ];

            $data['Token'] = $this->generateToken($data);

            $response = $this->client->post('Cancel', [
                'json' => $data,
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            if ($result['Success'] ?? false) {
                return [
                    'success' => true,
                    'refund_id' => $result['OriginalPaymentId'] ?? $payment->payment_id,
                    'status' => 'refunded',
                    'amount' => $amount,
                ];
            }

            return [
                'success' => false,
                'error' => $result['Details'] ?? 'Unknown error',
            ];

        } catch (RequestException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function handleWebhook(array $data): bool
    {
        try {
            $paymentId = $data['PaymentId'] ?? null;
            $status = $data['Status'] ?? null;
            $token = $data['Token'] ?? '';

            if (!$paymentId || !$status) {
                return false;
            }

            // Verify token
            $expectedToken = $this->generateToken($data);
            if ($token !== $expectedToken) {
                \Log::error('Tinkoff webhook token mismatch');
                return false;
            }

            $payment = Payment::where('payment_id', $paymentId)
                ->where('provider', 'tinkoff')
                ->first();

            if (!$payment) {
                return false;
            }

            $mappedStatus = $this->mapTinkoffStatus($status);

            switch ($mappedStatus) {
                case 'succeeded':
                    $this->handlePaymentSucceeded($payment, $data);
                    break;

                case 'cancelled':
                    $this->handlePaymentCanceled($payment, $data);
                    break;

                case 'refunded':
                    $this->handlePaymentRefunded($payment, $data);
                    break;

                default:
                    $payment->update([
                        'status' => $mappedStatus,
                        'provider_data' => $data,
                    ]);
                    break;
            }

            return true;

        } catch (\Exception $e) {
            \Log::error('Tinkoff webhook error: ' . $e->getMessage());
            return false;
        }
    }

    private function handlePaymentSucceeded(Payment $payment, array $data): void
    {
        $payment->update([
            'status' => 'succeeded',
            'paid_at' => now(),
            'provider_data' => $data,
        ]);

        // Update order status
        $order = $payment->order;
        $order->update(['status' => 'paid']);

        // Process commission
        $this->commissionService->processCommission($order);
    }

    private function handlePaymentCanceled(Payment $payment, array $data): void
    {
        $payment->update([
            'status' => 'cancelled',
            'failure_reason' => $data['Reason'] ?? 'Unknown',
            'provider_data' => $data,
        ]);

        // Update order status
        $payment->order->update(['status' => 'cancelled']);
    }

    private function handlePaymentRefunded(Payment $payment, array $data): void
    {
        $payment->update([
            'status' => 'refunded',
            'refunded_at' => now(),
            'provider_data' => $data,
        ]);

        // Update order status
        $payment->order->update(['status' => 'refunded']);

        // Process refund commission
        $order = $payment->order;
        $refundAmount = ($data['Amount'] ?? 0) / 100;
        $this->commissionService->processRefund($order, $refundAmount);
    }

    private function generateToken(array $data): string
    {
        // Remove Token from data if exists
        unset($data['Token']);
        
        // Sort by key
        ksort($data);
        
        // Create string
        $string = implode('', $data) . $this->secretKey;
        
        return hash('sha256', $string);
    }

    private function mapTinkoffStatus(string $tinkoffStatus): string
    {
        return match ($tinkoffStatus) {
            'NEW', 'FORM_SHOWED' => 'pending',
            'PREAUTHORIZING', 'AUTHORIZING', 'AUTHORIZED', 'REVERSING' => 'processing',
            'CONFIRMED', 'AUTH_FAIL' => 'succeeded',
            'CANCELED', 'REJECTED', 'PARTIAL_REFUNDED', 'REFUNDED' => 'cancelled',
            'PARTIAL_REVERSED', 'REVERSED' => 'refunded',
            default => 'failed',
        };
    }

    private function buildReceiptItems(Order $order): array
    {
        $items = [];
        
        foreach ($order->items as $item) {
            $items[] = [
                'Name' => $item->product_name,
                'Price' => $item->price * 100, // Convert to kopecks
                'Quantity' => $item->quantity,
                'Amount' => $item->price * $item->quantity * 100,
                'Tax' => 'none',
            ];
        }

        // Add shipping if applicable
        if ($order->shipping_cost > 0) {
            $items[] = [
                'Name' => 'Доставка',
                'Price' => $order->shipping_cost * 100,
                'Quantity' => 1,
                'Amount' => $order->shipping_cost * 100,
                'Tax' => 'none',
            ];
        }

        return $items;
    }

    private function buildRefundReceiptItems(Payment $payment, float $refundAmount): array
    {
        $order = $payment->order;
        $items = [];
        
        foreach ($order->items as $item) {
            $itemAmount = $item->price * $item->quantity;
            $itemRefundAmount = min($itemAmount, $refundAmount);
            
            if ($itemRefundAmount > 0) {
                $items[] = [
                    'Name' => $item->product_name,
                    'Price' => $item->price * 100,
                    'Quantity' => $itemRefundAmount / $item->price,
                    'Amount' => $itemRefundAmount * 100,
                    'Tax' => 'none',
                ];
                
                $refundAmount -= $itemRefundAmount;
            }
        }

        return $items;
    }
}
