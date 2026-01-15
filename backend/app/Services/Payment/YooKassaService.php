<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Services\CommissionService;
use YooKassa\Client;
use YooKassa\Request\Payments\CreatePaymentRequest;
use YooKassa\Request\Payments\Payment\CaptureRequest;
use YooKassa\Request\Refunds\CreateRefundRequest;

class YooKassaService
{
    private Client $client;
    private CommissionService $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->client = new Client();
        $this->client->setAuth(
            config('services.yookassa.shop_id'),
            config('services.yookassa.secret_key')
        );
        $this->commissionService = $commissionService;
    }

    public function createPayment(Order $order): array
    {
        try {
            $paymentRequest = new CreatePaymentRequest();
            $paymentRequest->setAmount($order->total);
            $paymentRequest->setCurrency('RUB');
            $paymentRequest->setDescription("Оплата заказа #{$order->order_number}");
            
            // Set return URLs
            $paymentRequest->setConfirmation([
                'type' => 'redirect',
                'return_url' => config('app.frontend_url') . "/checkout/success?order_id={$order->id}",
            ]);
            
            // Set metadata
            $paymentRequest->setMetadata([
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ]);

            // Enable different payment methods
            $paymentRequest->setPaymentMethodData([
                'type' => 'bank_card',
            ]);

            $response = $this->client->createPayment($paymentRequest);

            // Save payment to database
            $payment = Payment::create([
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'payment_id' => $response->getId(),
                'provider' => 'yookassa',
                'status' => $this->mapYooKassaStatus($response->getStatus()),
                'amount' => $response->getAmount()->getValue(),
                'currency' => $response->getAmount()->getCurrency(),
                'payment_method' => $response->getPaymentMethod()?->getType(),
                'provider_data' => $response->jsonSerialize(),
            ]);

            return [
                'success' => true,
                'payment_id' => $payment->id,
                'confirmation_url' => $response->getConfirmation()?->getConfirmationUrl(),
                'payment_status' => $payment->status,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getPaymentStatus(string $paymentId): array
    {
        try {
            $response = $this->client->getPaymentInfo($paymentId);

            return [
                'success' => true,
                'status' => $this->mapYooKassaStatus($response->getStatus()),
                'paid' => $response->getPaid(),
                'amount' => $response->getAmount()->getValue(),
                'currency' => $response->getAmount()->getCurrency(),
                'payment_method' => $response->getPaymentMethod()?->getType(),
                'created_at' => $response->getCreatedAt(),
                'captured_at' => $response->getCapturedAt(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function capturePayment(string $paymentId): array
    {
        try {
            $captureRequest = new CaptureRequest();
            $response = $this->client->capturePayment($captureRequest, $paymentId);

            return [
                'success' => true,
                'status' => $this->mapYooKassaStatus($response->getStatus()),
                'captured_at' => $response->getCapturedAt(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function refundPayment(Payment $payment, float $amount): array
    {
        try {
            $refundRequest = new CreateRefundRequest();
            $refundRequest->setAmount($amount);
            $refundRequest->setCurrency('RUB');
            $refundRequest->setPaymentId($payment->payment_id);

            $response = $this->client->createRefund($refundRequest);

            return [
                'success' => true,
                'refund_id' => $response->getId(),
                'status' => $response->getStatus(),
                'amount' => $response->getAmount()->getValue(),
                'created_at' => $response->getCreatedAt(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function handleWebhook(array $data): bool
    {
        try {
            $event = $data['event'] ?? null;
            $paymentData = $data['object'] ?? null;

            if (!$event || !$paymentData) {
                return false;
            }

            $payment = Payment::where('payment_id', $paymentData['id'])->first();
            if (!$payment) {
                return false;
            }

            switch ($event) {
                case 'payment.succeeded':
                    $this->handlePaymentSucceeded($payment, $paymentData);
                    break;

                case 'payment.canceled':
                    $this->handlePaymentCanceled($payment, $paymentData);
                    break;

                case 'refund.succeeded':
                    $this->handleRefundSucceeded($payment, $paymentData);
                    break;

                default:
                    break;
            }

            return true;

        } catch (\Exception $e) {
            \Log::error('YooKassa webhook error: ' . $e->getMessage());
            return false;
        }
    }

    private function handlePaymentSucceeded(Payment $payment, array $paymentData): void
    {
        $payment->update([
            'status' => 'succeeded',
            'paid_at' => now(),
            'provider_data' => $paymentData,
        ]);

        // Update order status
        $order = $payment->order;
        $order->update(['status' => 'paid']);

        // Process commission
        $this->commissionService->processCommission($order);
    }

    private function handlePaymentCanceled(Payment $payment, array $paymentData): void
    {
        $payment->update([
            'status' => 'cancelled',
            'failure_reason' => $paymentData['cancellation_details']['reason'] ?? 'Unknown',
            'provider_data' => $paymentData,
        ]);

        // Update order status
        $payment->order->update(['status' => 'cancelled']);
    }

    private function handleRefundSucceeded(Payment $payment, array $paymentData): void
    {
        $payment->update([
            'status' => 'refunded',
            'refunded_at' => now(),
            'provider_data' => $paymentData,
        ]);

        // Update order status
        $payment->order->update(['status' => 'refunded']);

        // Process refund commission
        $order = $payment->order;
        $refundAmount = $paymentData['amount']['value'];
        $this->commissionService->processRefund($order, $refundAmount);
    }

    private function mapYooKassaStatus(string $yooKassaStatus): string
    {
        return match ($yooKassaStatus) {
            'pending' => 'pending',
            'waiting_for_capture' => 'processing',
            'succeeded' => 'succeeded',
            'canceled' => 'cancelled',
            default => 'failed',
        };
    }

    public function getPaymentMethods(): array
    {
        try {
            $response = $this->client->getPaymentMethods();
            
            return [
                'success' => true,
                'methods' => $response->getItems(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
