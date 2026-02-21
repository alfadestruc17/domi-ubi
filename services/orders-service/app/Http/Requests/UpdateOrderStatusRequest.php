<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    Order::STATUS_PREPARING,
                    Order::STATUS_READY_FOR_PICKUP,
                    Order::STATUS_PICKED_UP,
                    Order::STATUS_ON_THE_WAY,
                    Order::STATUS_DELIVERED,
                ]),
            ],
        ];
    }
}
