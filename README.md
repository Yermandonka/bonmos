# Bon Mos

Web-escaparate de chef privado a domicilio, con estética valenciana. La carta de platos se gestiona desde un panel sin complicaciones y las reservas llegan por WhatsApp.

## Cómo funciona

- **PHP 8 + SQLite** — sin MySQL ni configuración: la base de datos (`data/bonmos.sqlite`) se crea sola con 7 platos valencianos de ejemplo la primera vez que se abre la web.
- **Panel del chef** (`admin.php`): publicar, editar y borrar platos, con subida de foto (JPG/PNG/WebP).
- **Ficha comercial**: producto de mercado, cómo funciona el servicio y botones de reserva por WhatsApp y correo.
- Previews estilo iOS (hoja deslizante con animación de la foto), adaptada primero a móvil.

## Puesta en marcha

Con el PHP de XAMPP/LAMPP (o cualquier PHP 8 con pdo_sqlite):

```bash
php -S 0.0.0.0:8790
```

O servido por el Apache de LAMPP:

```bash
sudo bash desplegar.sh
```

## Configuración

En `inc/config.php`: nombre, lema, categorías y — **importante** — `BM_WHATSAPP` y `BM_EMAIL`, que son de ejemplo y hay que cambiar por los datos reales del chef.

Las fotos de los platos de ejemplo proceden de Wikimedia Commons; la atribución está en `assets/img/platos/CREDITOS.txt`.
