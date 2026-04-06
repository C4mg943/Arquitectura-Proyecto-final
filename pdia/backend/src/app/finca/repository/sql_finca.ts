export const SQL_FINCAS = {
    FIND_ALL: `
        SELECT f.id, f.nombre, f.municipio, f.departamento, f.productor_id,
               u.nombre AS productor_nombre, f.area_hectareas, f.codigo_ica, f.created_at
        FROM fincas f
                 LEFT JOIN users u ON u.id = f.productor_id
        ORDER BY f.id
    `,

    FINDBY_PRODUCTOR: `
        SELECT id FROM users WHERE id = $1
    `,

    CHECK_DUPLICADO: `
        SELECT COUNT(*) AS cantidad
        FROM fincas
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) 
          AND LOWER(TRIM(municipio)) = LOWER(TRIM($2)) 
          AND productor_id = $3;
    `,

    CHECK_DUPLICADO_UPDATE: `
        SELECT COUNT(id) AS cantidad
        FROM public.fincas
        WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
          AND productor_id = $2
          AND id != $3
    `,

    UPDATE: `
        UPDATE fincas 
        SET nombre = $1, municipio = $2, departamento = $3, productor_id = $4,
            area_hectareas = $5, codigo_ica = $6
        WHERE id = $7
    `,

    ADD: `
        INSERT INTO fincas (nombre, municipio, departamento, productor_id, area_hectareas, codigo_ica)
        VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
    `,
   
    FIND_BY_ID: `
        SELECT id, nombre, municipio, departamento, productor_id, area_hectareas, codigo_ica 
        FROM fincas WHERE id = $1
    `,

    DELETE: `
        DELETE FROM fincas WHERE id = $1
    `,
};