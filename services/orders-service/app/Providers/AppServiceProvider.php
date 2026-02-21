<?php

namespace App\Providers;

use App\Services\AuthServiceClient;
use App\Services\CatalogServiceClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AuthServiceClient::class, function (): AuthServiceClient {
            return new AuthServiceClient(config('services.auth_service_url'));
        });

        $this->app->singleton(CatalogServiceClient::class, function (): CatalogServiceClient {
            return new CatalogServiceClient(config('services.catalog_service_url'));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
