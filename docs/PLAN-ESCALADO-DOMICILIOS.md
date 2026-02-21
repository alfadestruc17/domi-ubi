# Plan de escalado — De viajes a app de domicilios

Este documento define los pasos para escalar **Domi-Ubi** (MVP de viajes) a una **aplicación de domicilios**: catálogo de tiendas/restaurantes, carrito, pedidos y entrega por repartidor.

Se mantiene la arquitectura de microservicios: cada nuevo dominio es un servicio Laravel independiente, sin compartir BD ni modelos entre servicios.

---

## 1. Diferencias clave: viajes vs domicilios

| Aspecto        | Hoy (viajes)           | Domicilios                          |
|----------------|------------------------|-------------------------------------|
| Origen         | Usuario elige en mapa  | Tienda/restaurante (fijo)           |
| Destino        | Usuario elige en mapa  | Dirección del cliente               |
| “Carga”        | Persona                | Pedido (ítems, total)               |
| Flujo          | Viaje → conductor      | Pedido → tienda prepara → conductor |
| Estados        | Trip (requested, etc.) | Order (pending, preparing, etc.)    |

**Reutilizable sin cambiar:** Auth, Users, Drivers, Realtime, Gateway, Frontend (login, perfil, mapa, conductor).

**Nuevo o ampliado:** catálogo (tiendas/productos), pedidos (órdenes + ítems), y opcionalmente pagos.

---

## 2. Servicios propuestos (visión final)

| Servicio           | Responsabilidad                          | Estado      |
|--------------------|------------------------------------------|------------|
| Auth Service       | Identidad, JWT                            | ✅ Existe   |
| Users Service      | Perfil, roles (cliente, conductor, **tienda**) | ✅ Extender |
| Drivers Service    | Repartidores, disponibilidad, ubicación   | ✅ Existe   |
| **Catalog Service** | Tiendas/restaurantes, productos, precios  | 🆕 Nuevo   |
| **Orders Service**  | Pedidos, ítems, estados, asignación repartidor | 🆕 Nuevo   |
| Trips Service      | Viajes (opcional: mantener o unificar con Orders) | ✅ Mantener o fusionar |
| Realtime Service   | WebSockets (trip, drivers, **order**)     | ✅ Extender |
| **Payments Service** (opcional) | Pagos (simulado o pasarela)        | 🔲 Fase posterior |

Decisión de diseño: **Orders** como núcleo de “domicilios”: un pedido tiene origen (tienda), destino (cliente), ítems y repartidor asignado. Trips puede quedar para “solo transporte” o migrar flujos a Orders.

---

## 3. Fases del escalado

### Fase D1 — Catálogo (Catalog Service)

**Objetivo:** Tiendas/restaurantes y sus productos visibles en la app.

| Paso | Tarea |
|------|--------|
| D1.1 | Crear **catalog-service** (Laravel), su BD (`catalog_db`) y contenedor en `docker-compose`. |
| D1.2 | Modelos: `Store` (nombre, dirección, lat/lng, activo), `Product` (nombre, precio, store_id, activo). Migraciones. |
| D1.3 | API: `GET /api/stores` (listado), `GET /api/stores/{id}` (detalle + productos), `GET /api/products` (por tienda o búsqueda). Sin auth al inicio para listado público. |
| D1.4 | Gateway: añadir `location /catalog` en nginx y reiniciar. |
| D1.5 | Frontend: página “Tiendas” con listado y detalle de tienda con productos; sin carrito aún. |

**Entregable:** Usuario puede ver tiendas y productos.

---

### Fase D2 — Roles y perfil (Users Service)

**Objetivo:** Rol “tienda” para que un usuario pueda ser dueño/admin de una tienda (futuro: gestionar productos).

| Paso | Tarea |
|------|--------|
| D2.1 | En **users-service**: ampliar rol a `customer | driver | store`. Migración o enum. |
| D2.2 | Endpoint (interno o admin): asociar `user_id` ↔ `store_id` (tabla `store_users` en catalog-service o en users-service; si en users, solo guardar `store_id` en perfil y catalog expone la tienda). Recomendación: en **catalog-service** tabla `store_users(user_id, store_id, role)` y Users solo tiene rol `store`; Catalog valida que el user tenga tienda. |
| D2.3 | Frontend: en perfil mostrar rol; si es `store`, en el futuro mostrar “Mis productos” (Fase D4). |

**Entregable:** Soporte de rol tienda en backend y perfil.

---

### Fase D3 — Pedidos (Orders Service)

**Objetivo:** Cliente hace un “pedido” con ítems; el pedido tiene estados y luego se asignará un repartidor.

| Paso | Tarea |
|------|--------|
| D3.1 | Crear **orders-service** (Laravel), BD `orders_db`, contenedor y gateway `location /orders`. |
| D3.2 | Modelos: `Order` (user_id, store_id, status, origin_lat/lng, dest_lat/lng, driver_id nullable, total, etc.), `OrderItem` (order_id, product_id, quantity, unit_price). Estados: `pending`, `confirmed`, `preparing`, `ready_for_pickup`, `assigned`, `picked_up`, `on_the_way`, `delivered`, `cancelled`. |
| D3.3 | Orders llama a **Auth** (validar JWT), **Catalog** (validar store y productos/precios), **Users** (perfil si hace falta). No compartir BD. |
| D3.4 | API: `POST /api/orders` (crear pedido con ítems), `GET /api/orders` (mis pedidos), `GET /api/orders/{id}` (detalle). `PATCH /api/orders/{id}/status` (para tienda o sistema). |
| D3.5 | Eventos: `OrderStatusChanged` (emitir a Realtime). Canal `order.{id}` para seguimiento en vivo. |
| D3.6 | Frontend: “Carrito” (estado local o contexto) y “Confirmar pedido” que llama a `POST /orders`; página “Mis pedidos” con listado y detalle. |

**Entregable:** Cliente puede hacer pedido y ver sus pedidos; estados y realtime preparados.

---

### Fase D4 — Asignación repartidor y entrega (Orders + Drivers)

**Objetivo:** Cuando el pedido está “listo para recoger”, se asigna un repartidor; el repartidor ve pedidos asignados y actualiza estado (recogido, en camino, entregado).

| Paso | Tarea |
|------|--------|
| D4.1 | **Orders-service**: al pasar a `ready_for_pickup`, solicitar repartidor disponible (llamada HTTP a Drivers o evento RabbitMQ). Asignar `driver_id` y estado `assigned`. |
| D4.2 | **Drivers-service**: endpoint `GET /api/drivers/me/orders` (pedidos asignados al conductor) o que Orders exponga “pedidos por driver” y Drivers solo da disponibilidad. Opción más simple: Orders tiene `driver_id`; conductor consulta Orders con su `driver_id`. Para eso Orders debe exponer algo como `GET /api/orders?driver_id=me` (usando JWT). |
| D4.3 | **Orders**: `PATCH /api/orders/{id}/status` permitir transiciones: tienda (pending→preparing→ready_for_pickup), conductor (assigned→picked_up→on_the_way→delivered). Validar según rol (Users) y que el driver sea el asignado. |
| D4.4 | Realtime: broadcast `OrderStatusChanged` en canal `order.{id}` y opcionalmente lista para conductor. |
| D4.5 | Frontend conductor: vista “Pedidos asignados” (lista y detalle) y botones para cambiar estado (recogido, en camino, entregado). Frontend cliente: en detalle de pedido mostrar estado en vivo (igual que viaje). |

**Entregable:** Flujo completo: pedido → tienda prepara → repartidor asigna → repartidor recoge y entrega; cliente y conductor ven estados en tiempo real.

---

### Fase D5 — Catálogo gestionado por la tienda (opcional)

**Objetivo:** Usuario con rol “tienda” puede crear/editar su tienda y productos.

| Paso | Tarea |
|------|--------|
| D5.1 | **Catalog-service**: endpoints protegidos (JWT + “este user es dueño de esta tienda”): `POST/PUT /api/stores`, `POST/PUT/DELETE /api/stores/{id}/products`. Validar con Users que el user tenga rol `store` y esté asociado a la tienda. |
| D5.2 | Frontend: sección “Mi tienda” (si rol store): editar datos de tienda y CRUD de productos. |

**Entregable:** Tiendas pueden gestionar su propio catálogo.

---

### Fase D6 — Pagos (opcional, última)

**Objetivo:** Pagar al confirmar pedido (simulado o pasarela real).

| Paso | Tarea |
|------|--------|
| D6.1 | Decidir: solo “pago simulado” (campo `payment_status` en Order) o integración Stripe/Mercado Pago. |
| D6.2 | Si es servicio aparte: **payments-service** con `POST /api/intent` o `POST /api/charge`; Orders llama después de crear pedido y actualiza `payment_status`. Si es simulado: Orders actualiza `payment_status = paid` al confirmar. |
| D6.3 | Frontend: tras “Confirmar pedido”, pantalla de pago (simulado: “Pagar” → éxito) o formulario de pasarela. |

**Entregable:** Flujo de pago integrado al pedido.

---

## 4. Orden recomendado de implementación

1. **Fase D1** — Catalog Service y pantallas de tiendas/productos.  
2. **Fase D2** — Rol tienda en Users (y relación user–store si aplica).  
3. **Fase D3** — Orders Service, carrito y “Mis pedidos”.  
4. **Fase D4** — Asignación repartidor y flujo conductor + realtime.  
5. **Fase D5** — Gestión de catálogo por la tienda (opcional).  
6. **Fase D6** — Pagos (opcional).

---

## 5. Resumen de nuevos recursos

| Recurso | Descripción |
|---------|-------------|
| **catalog-service** | Laravel, BD `catalog_db`, modelos Store, Product; rutas bajo `/catalog` en gateway. |
| **orders-service** | Laravel, BD `orders_db`, modelos Order, OrderItem; rutas bajo `/orders`; llama a Auth, Catalog, Users, Drivers. |
| **Gateway** | Nuevas rutas: `/catalog`, `/orders`. |
| **Frontend** | Páginas: Tiendas, Detalle tienda (productos), Carrito, Confirmar pedido, Mis pedidos; vista conductor: Pedidos asignados. |
| **Realtime** | Canales `order.{id}` y eventos `OrderStatusChanged`. |

---

## 6. Diagrama de flujo (domicilios)

```
Cliente                    Catalog          Orders           Drivers         Realtime
   |                          |                |                 |                |
   |-- GET /stores ---------->|                |                 |                |
   |<-- listado --------------|                |                 |                |
   |-- GET /stores/1 -------->|                |                 |                |
   |<-- tienda + productos ---|                |                 |                |
   |                                                           |                |
   |-- POST /orders (items) ------------------>|                 |                |
   |     (Orders valida con Catalog)           |                 |                |
   |<-- 201 order ----------------------------|                 |                |
   |                              OrderStatusChanged ---------->|                |
   |                                                           |                |
   |                    [Tienda prepara; status → ready_for_pickup]             |
   |                              Orders asigna driver -----------> Drivers     |
   |                                                           |                |
   |                    [Conductor: picked_up → on_the_way → delivered]         |
   |                              OrderStatusChanged -------------------------->|
   |<-- estado en vivo (Echo) ------------------------------------------------|
```

---

## 7. Checklist rápido por fase

- **D1:** Catalog service creado, migraciones, GET stores/products, gateway, frontend Tiendas.
- **D2:** Rol `store` en users, relación user–store (en catalog o users).
- **D3:** Orders service, Order + OrderItem, POST/GET orders, carrito + confirmar + Mis pedidos, eventos Realtime.
- **D4:** Asignación repartidor, endpoints conductor, transiciones de estado, frontend conductor pedidos.
- **D5:** Catalog: CRUD tienda/productos por usuario tienda; frontend Mi tienda.
- **D6:** Pago simulado o pasarela; Orders payment_status; frontend pago.

---

*Documento vivo: se puede ajustar según prioridades (por ejemplo, dejar Trips como está y que “domicilios” sea solo Orders + Catalog + mismo conductor).*
