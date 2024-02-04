import { pool } from "../../db/index.js";

async function addNewServer(serverKey) {
    try {
        const checkQuery = "SELECT * FROM servers WHERE serverKey = $1";
        const res = await pool.query(checkQuery, [serverKey]);

        if (res.rows.length > 0) {
            return true;
        }

        if (res.rows.length === 0) {
            const insertQuery = `
            INSERT INTO servers (serverKey, CT, TERRORIST, map, rounds, admin)
            VALUES ($1, 0, 0, 'unknown_map', 0, FALSE)
            `;
            await pool.query(insertQuery, [serverKey]);
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function updateScore(serverKey, team, score) {
    if (team !== "CT" && team !== "TERRORIST") {
        throw new Error("Invalid team name, must be CT or TERRORIST!");
    }

    if (!Number.isInteger(score)) {
        score = Number(score)
    }

    if (addNewServer(serverKey)) {
        const query = `
    UPDATE servers
    SET ${team} = $1
    WHERE serverKey = $2
    `;

        try {
            await pool.query(query, [score, serverKey]);
        } catch (e) {
            console.error("Error updating scores: ", e);
            throw e;
        }
    }
}
