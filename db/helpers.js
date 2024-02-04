import { pool } from "./index.js";

export async function resetServerTable() {
    await pool.query(`
    DROP TABLE IF EXISTS servers;

    CREATE TABLE servers (
        serverKey VARCHAR(255) PRIMARY KEY,
        CT INTEGER,
        TERRORIST INTEGER,
        map VARCHAR(255),
        rounds INTEGER,
        admin BOOLEAN
    );
                  `);

    await pool.query(
        `
        INSERT INTO servers (serverKey, CT, TERRORIST, map, rounds, admin)
        VALUES ('127.0.0.1:99999', 10, 5, 'de_vertigo', 15, FALSE);
                                `
    );
}
