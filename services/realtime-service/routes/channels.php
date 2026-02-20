<?php

use Illuminate\Support\Facades\Broadcast;

/**
 * Canales públicos (MVP): trip.{id}, drivers.
 * Trips/Drivers emiten eventos a estos canales vía Reverb.
 * Para canales privados se podría validar JWT con Auth Service.
 */
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
