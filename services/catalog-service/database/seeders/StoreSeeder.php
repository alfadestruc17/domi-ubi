<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $stores = [
            [
                'name' => 'Pizzería La Romana',
                'address' => 'Calle 45 # 12-34',
                'latitude' => 4.711,
                'longitude' => -74.072,
                'products' => [
                    ['name' => 'Pizza Margarita', 'description' => 'Salsa de tomate, mozzarella y albahaca', 'price' => 25000],
                    ['name' => 'Pizza Hawaiana', 'description' => 'Jamón, piña y queso', 'price' => 28000],
                    ['name' => 'Pizza Napolitana', 'description' => 'Tomate, mozzarella, anchoas', 'price' => 30000],
                ],
            ],
            [
                'name' => 'Sushi Bar Sakura',
                'address' => 'Carrera 15 # 80-20',
                'latitude' => 4.698,
                'longitude' => -74.055,
                'products' => [
                    ['name' => 'Roll Filadelfia', 'description' => 'Salmón, queso crema, aguacate', 'price' => 32000],
                    ['name' => 'Roll Tempura', 'description' => 'Camarón empanizado, aguacate', 'price' => 28000],
                    ['name' => 'Sashimi Mixto', 'description' => '12 piezas de pescado fresco', 'price' => 45000],
                ],
            ],
            [
                'name' => 'Hamburguesas El Rincón',
                'address' => 'Av. 68 # 45-30',
                'latitude' => 4.652,
                'longitude' => -74.098,
                'products' => [
                    ['name' => 'Clásica', 'description' => 'Carne, lechuga, tomate, queso', 'price' => 18000],
                    ['name' => 'Doble carne', 'description' => 'Doble carne, bacon, cheddar', 'price' => 22000],
                    ['name' => 'Vegetariana', 'description' => 'Medallón de garbanzos y vegetales', 'price' => 19000],
                ],
            ],
        ];

        foreach ($stores as $data) {
            $products = $data['products'];
            unset($data['products']);

            $store = Store::query()->create($data);

            foreach ($products as $p) {
                Product::query()->create([
                    'store_id' => $store->id,
                    'name' => $p['name'],
                    'description' => $p['description'],
                    'price' => $p['price'],
                ]);
            }
        }

        // Asignar primera tienda al usuario auth 1 (para pruebas: el primer usuario que se registre puede ser tienda)
        $firstStore = Store::query()->first();
        if ($firstStore && ! \App\Models\StoreUser::query()->where('auth_user_id', 1)->exists()) {
            \App\Models\StoreUser::query()->create([
                'auth_user_id' => 1,
                'store_id' => $firstStore->id,
            ]);
        }
    }
}
