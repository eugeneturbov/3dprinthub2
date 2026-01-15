<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SellerMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!auth()->user()->isSeller()) {
            return response()->json(['message' => 'Forbidden - Seller access required'], 403);
        }

        return $next($request);
    }
}
