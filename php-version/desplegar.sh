#!/bin/bash
# Despliega Bon Mos en el Apache de LAMPP (ejecutar con sudo)
set -e
PROYECTO="/home/yermandonka/Projects/bon-mos/php-version"

ln -sfn "$PROYECTO" /opt/lampp/htdocs/bonmos

# Apache (usuario daemon) necesita escribir la base de datos y las fotos
chown -R daemon:daemon "$PROYECTO/data" "$PROYECTO/uploads" 2>/dev/null || chmod -R 777 "$PROYECTO/data" "$PROYECTO/uploads"

# Solo Apache: la web usa SQLite, no hace falta MySQL
/opt/lampp/lampp startapache

echo
echo "Bon Mos desplegado → http://localhost/bonmos/"
echo "Desde el móvil (misma wifi) → http://$(hostname -I | awk '{print $1}')/bonmos/"
