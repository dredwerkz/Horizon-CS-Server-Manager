import { pool } from "../index.js"
import { resetServerTable } from "../helpers.js"

try {
    await resetServerTable()
} catch (e) {
    console.error(e)
} finally {
    await pool.end()
}