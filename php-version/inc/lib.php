<?php
require_once __DIR__ . '/config.php';

function bm_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $nueva = !file_exists(BM_DB);
        $pdo = new PDO('sqlite:' . BM_DB);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec("CREATE TABLE IF NOT EXISTS recetas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            categoria TEXT NOT NULL DEFAULT 'principal',
            descripcion TEXT NOT NULL DEFAULT '',
            ingredientes TEXT NOT NULL DEFAULT '',
            pasos TEXT NOT NULL DEFAULT '',
            consejo TEXT NOT NULL DEFAULT '',
            tiempo_min INTEGER NOT NULL DEFAULT 30,
            comensales INTEGER NOT NULL DEFAULT 4,
            dificultad TEXT NOT NULL DEFAULT 'Media',
            foto TEXT NOT NULL DEFAULT '',
            destacada INTEGER NOT NULL DEFAULT 0,
            creada_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        )");
        if ($nueva) {
            bm_sembrar($pdo);
        }
    }
    return $pdo;
}

function bm_slug(string $t): string {
    $t = mb_strtolower(trim($t));
    $t = strtr($t, ['á'=>'a','à'=>'a','é'=>'e','è'=>'e','í'=>'i','ï'=>'i','ó'=>'o','ò'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n','ç'=>'c']);
    $t = preg_replace('/[^a-z0-9]+/', '-', $t);
    return trim($t, '-') ?: 'receta';
}

function e(?string $s): string {
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}

function bm_wa_link(string $mensaje): string {
    return 'https://wa.me/' . BM_WHATSAPP . '?text=' . rawurlencode($mensaje);
}

function bm_foto_url(array $r): string {
    if ($r['foto'] !== '' && str_starts_with($r['foto'], 'assets/')) {
        return $r['foto'];
    }
    if ($r['foto'] !== '' && is_file(BM_UPLOADS . '/' . $r['foto'])) {
        return 'uploads/' . rawurlencode($r['foto']);
    }
    return 'assets/img/recetas/generica.svg';
}

function bm_lineas(string $texto): array {
    return array_values(array_filter(array_map('trim', explode("\n", $texto)), fn($l) => $l !== ''));
}

function bm_guardar_foto(array $archivo): ?string {
    if (($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return null;
    }
    $info = @getimagesize($archivo['tmp_name']);
    $ext = match ($info['mime'] ?? '') {
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        default      => null,
    };
    if ($ext === null) {
        return null;
    }
    $nombre = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    if (!move_uploaded_file($archivo['tmp_name'], BM_UPLOADS . '/' . $nombre)) {
        return null;
    }
    return $nombre;
}

function bm_sembrar(PDO $pdo): void {
    $recetas = [
        [
            'titulo' => 'Paella valenciana tradicional',
            'categoria' => 'arroces',
            'descripcion' => 'La de la terreta, con pollo, conejo, garrofó y bajoqueta. Fuego de leña si puede ser, y el arroz en su punto: seco, suelto y con socarraet.',
            'ingredientes' => "400 g de arroz redondo (albufera o senia)\n600 g de pollo troceado\n400 g de conejo troceado\n200 g de bajoqueta (judía verde plana)\n150 g de garrofó fresco o remojado\n2 tomates maduros rallados\nAceite de oliva virgen extra\nPimentón dulce, azafrán en hebra\nRomero fresco, sal y agua",
            'pasos' => "Calienta el aceite en la paella y sofríe el pollo y el conejo hasta que estén bien dorados. Sin prisa: aquí está la mitad del sabor.\nAñade la bajoqueta y el garrofó, y dales unas vueltas.\nAparta la carne a los bordes, sofríe el tomate rallado en el centro y, cuando pierda el agua, añade el pimentón y remueve diez segundos para que no se queme.\nCubre con agua hasta los remaches de las asas, añade el azafrán y deja hervir 25-30 minutos para hacer el caldo.\nPrueba de sal (debe estar un punto salado), reparte el arroz en forma de cruz y nivélalo.\nCocina 10 minutos a fuego vivo y 8 a fuego suave. Los últimos segundos, sube el fuego si quieres socarraet.\nApaga, corona con una ramita de romero y deja reposar 5 minutos tapada con papel de periódico.",
            'consejo' => 'La medida clásica: el doble y un poco más de agua que de arroz, pero manda el caldo que quede tras la cocción de la carne. Y la paella nunca se remueve una vez echado el arroz.',
            'tiempo_min' => 75, 'comensales' => 4, 'dificultad' => 'Elaborada',
            'foto' => 'assets/img/platos/paella.jpg', 'destacada' => 1,
        ],
        [
            'titulo' => 'Fideuà de Gandia',
            'categoria' => 'arroces',
            'descripcion' => 'El plato marinero de la Safor: fideo fino dorado, fumet potente de morralla y ese alioli casero que no puede faltar en la mesa.',
            'ingredientes' => "400 g de fideo fino del nº 2\n300 g de gamba pelada (reserva las cabezas)\n300 g de rape o sepia troceada\n1,2 l de fumet de morralla\n2 ñoras o 1 cucharadita de pimentón\n2 tomates rallados, 3 dientes de ajo\nAceite de oliva virgen extra y sal\nAlioli para servir",
            'pasos' => "Sofríe las cabezas de gamba en el aceite, aplástalas para que suelten el jugo y retíralas.\nEn ese aceite, dora la sepia o el rape con el ajo picado.\nAñade el tomate y la carne de ñora, y sofríe hasta que oscurezca.\nIncorpora el fideo y remuévelo un par de minutos hasta que tome color tostado.\nVierte el fumet hirviendo, prueba de sal y cocina 8-10 minutos sin remover.\nAñade las gambas en los dos últimos minutos.\nSi el horno está fuerte, un golpe de gratinado hace que el fideo se ponga de punta. Sirve con alioli.",
            'consejo' => 'El secreto es tostar el fideo en seco antes de mojarlo: cambia por completo el sabor final.',
            'tiempo_min' => 50, 'comensales' => 4, 'dificultad' => 'Media',
            'foto' => 'assets/img/platos/fideua.jpg', 'destacada' => 1,
        ],
        [
            'titulo' => 'Esgarraet amb mullaor',
            'categoria' => 'entrantes',
            'descripcion' => 'Pimiento rojo asado desgarrado a mano con bacalao, ajo y un buen aceite. Frío, sencillo y absolutamente adictivo con pan tostado.',
            'ingredientes' => "3 pimientos rojos grandes\n200 g de bacalao salado desmigado\n2 dientes de ajo laminados\nAceite de oliva virgen extra (generoso)\nOpcional: olivas negras y huevo duro",
            'pasos' => "Asa los pimientos enteros al horno a 200 °C unos 40 minutos, girándolos a mitad.\nDéjalos sudar tapados 15 minutos, pélalos y desgárralos a tiras con las manos. Nunca con cuchillo: por eso se llama esgarraet.\nDesala el bacalao bajo el grifo si es muy fuerte y desmígalo.\nMezcla pimiento, bacalao y ajo laminado en una fuente plana.\nCubre con un buen chorro de aceite y deja reposar en nevera al menos 2 horas.\nSirve a temperatura ambiente con pan para mojar el aceite, que es el mullaor.",
            'consejo' => 'De un día para otro está aún mejor: el aceite se impregna del asado y del bacalao.',
            'tiempo_min' => 60, 'comensales' => 6, 'dificultad' => 'Fácil',
            'foto' => 'assets/img/platos/esgarraet.jpg', 'destacada' => 0,
        ],
        [
            'titulo' => "All i pebre d'anguila",
            'categoria' => 'principal',
            'descripcion' => "El guiso de la Albufera: anguila, ajo, pimentón y patata en un caldo corto que se liga con almendra picada. Cocina de barraca en estado puro.",
            'ingredientes' => "1 kg de anguila limpia y troceada\n6 dientes de ajo\n1 cucharada colmada de pimentón\n600 g de patatas chascadas\n1 guindilla (al gusto)\n12 almendras fritas y una rebanada de pan frito\nAceite de oliva, agua y sal",
            'pasos' => "Dora los ajos enteros aplastados en aceite, aparta la cazuela del fuego y añade el pimentón y la guindilla.\nAntes de que se queme el pimentón, añade un litro de agua caliente.\nIncorpora las patatas chascadas y cuece 15 minutos.\nMaja las almendras con el pan frito y un ajo, y disuélvelo en el caldo para ligarlo.\nAñade la anguila y cuece 8-10 minutos más, moviendo la cazuela en vaivén, sin cuchara.\nPrueba de sal y sirve hirviendo, con pan cerca.",
            'consejo' => 'Si la anguila impone, funciona igual de bien con rape o con sepia. El vaivén de la cazuela liga el caldo sin romper el pescado.',
            'tiempo_min' => 45, 'comensales' => 4, 'dificultad' => 'Media',
            'foto' => 'assets/img/platos/allipebre.jpg', 'destacada' => 0,
        ],
        [
            'titulo' => 'Arròs al forn',
            'categoria' => 'arroces',
            'descripcion' => 'El arroz de cazuela de barro y del día después del cocido: costilla, morcilla, garbanzos, patata y una cabeza de ajos en el centro presidiendo.',
            'ingredientes' => "400 g de arroz redondo\n800 ml de caldo de cocido o de puchero\n300 g de costilla de cerdo troceada\n2 morcillas de cebolla\n150 g de garbanzos cocidos\n1 patata en rodajas, 1 tomate en rodajas\n1 cabeza de ajos entera\nPimentón, azafrán, aceite y sal",
            'pasos' => "Precalienta el horno a 200 °C con el caldo ya caliente.\nEn la cazuela de barro, dora la costilla, la patata y la cabeza de ajos entera.\nAñade el arroz y los garbanzos, y repártelo todo bien; espolvorea el pimentón.\nColoca encima las rodajas de tomate y las morcillas, y la cabeza de ajos en el centro.\nVierte el caldo hirviendo con el azafrán y prueba de sal.\nHornea 20-25 minutos sin tocar, hasta que el arroz esté seco y la superficie dorada.\nDeja reposar 5 minutos antes de llevar la cazuela a la mesa.",
            'consejo' => 'Aquí el caldo es el doble justo que el arroz: en el horno no evapora tanto como en el fuego.',
            'tiempo_min' => 60, 'comensales' => 4, 'dificultad' => 'Media',
            'foto' => 'assets/img/platos/arrosalforn.jpg', 'destacada' => 0,
        ],
        [
            'titulo' => 'Coca de llanda',
            'categoria' => 'dulces',
            'descripcion' => 'El bizcocho valenciano de toda la vida, esponjoso y humilde, con su azúcar y canela por encima. En llanda, como manda la tradición.',
            'ingredientes' => "3 huevos\n250 g de azúcar\n250 ml de leche\n130 ml de aceite de girasol\nRalladura de 1 limón\n300 g de harina floja\n2 gaseosas de papelillos (o 16 g de levadura química)\nAzúcar y canela para espolvorear",
            'pasos' => "Precalienta el horno a 180 °C y forra la llanda con papel de horno.\nBate los huevos con el azúcar hasta que blanqueen.\nAñade la leche, el aceite y la ralladura, y mezcla.\nIncorpora la harina tamizada con las gaseosas y mezcla lo justo, sin trabajar de más.\nVierte en la llanda, espolvorea generosamente azúcar y canela.\nHornea 30-35 minutos, hasta que al pinchar el palillo salga limpio.\nDeja templar y corta en cuadrados directamente en la llanda.",
            'consejo' => 'Para merendar como Dios manda: un cuadrado de coca y un vaso de mistela o de horchata bien fría.',
            'tiempo_min' => 50, 'comensales' => 8, 'dificultad' => 'Fácil',
            'foto' => 'assets/img/platos/coca.jpg', 'destacada' => 0,
        ],
        [
            'titulo' => 'Horchata de chufa y fartons',
            'categoria' => 'bebidas',
            'descripcion' => "Chufa de Alboraia, agua y el punto justo de dulce. Y para acompañar, fartons esponjosos para sucar hasta el fondo del vaso.",
            'ingredientes' => "250 g de chufa seca de Alboraia\n1 l de agua fría (y más para remojar)\n80-100 g de azúcar (al gusto)\nOpcional: canela y piel de limón\nFartons para acompañar",
            'pasos' => "Lava bien las chufas y déjalas en remojo 24-48 horas en la nevera, cambiando el agua a diario.\nTritúralas con el litro de agua fría, en dos tandas si hace falta, hasta que quede una crema.\nDeja reposar 20 minutos y cuela con un paño fino apretando bien.\nDisuelve el azúcar, y aromatiza si quieres con canela y limón.\nEnfría al máximo sin que llegue a congelar: la horchata se toma casi al hielo.\nSirve con fartons y a sucar sin vergüenza.",
            'consejo' => 'Se conserva solo 2-3 días en nevera: es un producto vivo, sin conservantes. Agítala antes de servir.',
            'tiempo_min' => 40, 'comensales' => 4, 'dificultad' => 'Fácil',
            'foto' => 'assets/img/platos/horchata.jpg', 'destacada' => 1,
        ],
    ];
    $st = $pdo->prepare('INSERT INTO recetas (titulo, slug, categoria, descripcion, ingredientes, pasos, consejo, tiempo_min, comensales, dificultad, foto, destacada)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($recetas as $r) {
        $st->execute([
            $r['titulo'], bm_slug($r['titulo']), $r['categoria'], $r['descripcion'],
            $r['ingredientes'], $r['pasos'], $r['consejo'],
            $r['tiempo_min'], $r['comensales'], $r['dificultad'], $r['foto'], $r['destacada'],
        ]);
    }
}
