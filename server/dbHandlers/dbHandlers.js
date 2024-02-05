import { pool } from "../../db/index.js";

async function checkForNewServer(serverKey) {
    try {
        const upsertQuery = `
            INSERT INTO servers (serverKey, CT, TERRORIST, map, rounds, admin)
            VALUES ($1, 0, 0, 'unknown_map', 0, FALSE)
            ON CONFLICT (serverKey) DO NOTHING;
        `;
        await pool.query(upsertQuery, [serverKey]);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function updateScore(serverKey, team, score) {
    if (team !== "CT" && team !== "TERRORIST") {
        throw new Error("Invalid team name, must be CT or TERRORIST!");
    }

    score = Number(score);

    if (await checkForNewServer(serverKey)) {
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

export async function updateMap(serverKey, {map, rounds}) {
    rounds = Number(rounds)

    if (await checkForNewServer(serverKey)) {
        const query = `
        UPDATE servers
        SET map = $1,
        rounds = $2
        WHERE serverKey = $3
        `;


        try { 
            await pool.query(query, [map, rounds, serverKey]);
        } catch (e) {
            console.error("Error updating map/rounds: ", e)
        }
    }
}

export async function getAllServerData() {
    try {
        const query = `
    SELECT * FROM servers
    ORDER BY serverkey ASC`;
        const res = await pool.query(query);
        const serverData = res.rows;
        return serverData || {};
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
