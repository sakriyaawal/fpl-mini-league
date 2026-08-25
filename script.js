const API_BASE =
    "https://fpl-api-proxy.sakriyaawal.workers.dev/api";

const LEAGUE_ID = 164381;


// ==========================================
// FETCH JSON
// ==========================================

async function fetchJSON(endpoint) {

    try {

        const response =
            await fetch(API_BASE + endpoint);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        return await response.json();

    } catch (error) {

        console.error(
            "Error fetching:",
            endpoint,
            error
        );

        return null;
    }
}


// ==========================================
// GET MINI-LEAGUE MANAGERS
// ==========================================

async function fetchMiniLeagueManagers() {

    const data = await fetchJSON(
        `/leagues-classic/${LEAGUE_ID}/standings/?page_standings=1`
    );

    if (!data) {
        return [];
    }

    // Official standings

    const standings =
        data.standings?.results || [];

    if (standings.length > 0) {
        return standings;
    }

    // Start-of-season fallback

    return data.new_entries?.results || [];
}


// ==========================================
// FETCH ONE MANAGER HISTORY
// ==========================================

async function fetchManagerHistory(entryId) {

    return await fetchJSON(
        `/entry/${entryId}/history/`
    );
}


// ==========================================
// FETCH ALL MANAGER HISTORIES
// ==========================================

async function fetchAllManagerHistories(
    managers
) {

    const results = await Promise.all(

        managers.map(async manager => {

            const history =
                await fetchManagerHistory(
                    manager.entry
                );

            return {

                entryId:
                    manager.entry,

                Team:
                    manager.entry_name,

                Manager:
                    manager.player_name ||
                    `${manager.player_first_name || ""} ${manager.player_last_name || ""}`.trim(),

                History:
                    history
            };
        })
    );


    // Remove managers whose history
    // could not be fetched

    return results.filter(
        manager => manager.History
    );
}


// ==========================================
// TABLE 1
// OVERALL MINI-LEAGUE RANKING
// ==========================================

function displayOverallRanking(
    managers
) {

    const table =
        document.getElementById(
            "overall-table"
        );


    if (managers.length === 0) {

        table.innerHTML = `
            <tr>
                <td>
                    No standings available.
                </td>
            </tr>
        `;

        return;
    }


    const overallData =
        managers.map(manager => ({

            Rank:
                manager.rank,

            Team:
                manager.entry_name,

            Manager:
                manager.player_name ||
                `${manager.player_first_name || ""} ${manager.player_last_name || ""}`.trim(),

            "Total Points":
                manager.total

        }));


    overallData.sort(
        (a, b) => a.Rank - b.Rank
    );


    table.innerHTML = `

        <thead>

            <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Manager</th>
                <th>Total Points</th>
            </tr>

        </thead>

        <tbody>

            ${overallData.map(row => `

                <tr>

                    <td>${row.Rank}</td>

                    <td>${row.Team}</td>

                    <td>${row.Manager}</td>

                    <td>${row["Total Points"]}</td>

                </tr>

            `).join("")}

        </tbody>
    `;
}


// ==========================================
// TABLE 2
// GAMEWEEK NET POINTS
// ==========================================

function createNetPointsTable(
    managerHistories
) {

    const netRows = [];


    for (
        const manager of managerHistories
    ) {

        const current =
            manager.History.current || [];


        const row = {

            Team:
                manager.Team,

            Manager:
                manager.Manager
        };


        for (const gw of current) {

            const event =
                gw.event;

            const points =
                gw.points ?? 0;

            const transferCost =
                gw.event_transfers_cost ?? 0;

            // Same as Python:
            // points + transfer_cost

            const netPoints =
                points + transferCost;


            row[`GW${event}`] =
                netPoints;
        }


        netRows.push(row);
    }


    const table =
        document.getElementById(
            "net-points-table"
        );


    if (netRows.length === 0) {

        table.innerHTML = `
            <tr>
                <td>
                    No gameweek history
                    available yet.
                </td>
            </tr>
        `;

        return;
    }


    // Find all gameweeks

    const gameweeks =
        new Set();


    for (const row of netRows) {

        for (const key of Object.keys(row)) {

            if (key.startsWith("GW")) {

                gameweeks.add(
                    parseInt(
                        key.substring(2)
                    )
                );
            }
        }
    }


    const sortedGameweeks =
        [...gameweeks].sort(
            (a, b) => a - b
        );


    table.innerHTML = `

        <thead>

            <tr>

                <th>Team</th>

                <th>Manager</th>

                ${sortedGameweeks.map(
                    gw => `
                        <th>GW${gw}</th>
                    `
                ).join("")}

            </tr>

        </thead>


        <tbody>

            ${netRows.map(row => `

                <tr>

                    <td>
                        ${row.Team}
                    </td>

                    <td>
                        ${row.Manager}
                    </td>

                    ${sortedGameweeks.map(
                        gw => `

                            <td>
                                ${row[`GW${gw}`] ?? ""}
                            </td>

                        `
                    ).join("")}

                </tr>

            `).join("")}

        </tbody>
    `;
}


// ==========================================
// GET CURRENT GAMEWEEK
// ==========================================

async function fetchCurrentGameweek() {

    const bootstrap =
        await fetchJSON(
            "/bootstrap-static/"
        );


    if (!bootstrap) {
        return null;
    }


    const currentEvents =
        (bootstrap.events || [])
            .filter(
                event => event.is_current
            );


    if (currentEvents.length === 0) {

        return null;
    }


    return currentEvents[0].id;
}


// ==========================================
// TABLE 3
// CURRENT GAMEWEEK
// ==========================================

async function createCurrentGameweekTable(
    managerHistories
) {

    const currentGW =
        await fetchCurrentGameweek();


    const title =
        document.getElementById(
            "current-gw-title"
        );


    const table =
        document.getElementById(
            "current-gw-table"
        );


    if (!currentGW) {

        title.textContent =
            "Current Gameweek";

        table.innerHTML = `
            <tr>
                <td>
                    There is currently
                    no active gameweek.
                </td>
            </tr>
        `;

        return;
    }


    title.textContent =
        `Current Gameweek - GW${currentGW}`;


    const rows = [];


    for (
        const manager of managerHistories
    ) {

        const current =
            manager.History.current || [];


        const gwData =
            current.find(
                gw =>
                    gw.event === currentGW
            );


        if (!gwData) {
            continue;
        }


        const points =
            gwData.points ?? 0;

        const hits =
            gwData.event_transfers_cost ?? 0;

        const netPoints =
            points + hits;


        rows.push({

            Team:
                manager.Team,

            Manager:
                manager.Manager,

            "Total Points":
                points,

            Hits:
                hits,

            "Net Points":
                netPoints
        });
    }


    if (rows.length === 0) {

        table.innerHTML = `
            <tr>
                <td>
                    No current gameweek
                    data available yet.
                </td>
            </tr>
        `;

        return;
    }


    // Sort by Net Points descending

    rows.sort(
        (a, b) =>
            b["Net Points"] -
            a["Net Points"]
    );


    // Add rank

    rows.forEach(
        (row, index) => {
            row.Rank = index + 1;
        }
    );


    table.innerHTML = `

        <thead>

            <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Manager</th>
                <th>Total Points</th>
                <th>Hits</th>
                <th>Net Points</th>
            </tr>

        </thead>


        <tbody>

            ${rows.map(row => `

                <tr>

                    <td>
                        ${row.Rank}
                    </td>

                    <td>
                        ${row.Team}
                    </td>

                    <td>
                        ${row.Manager}
                    </td>

                    <td>
                        ${row["Total Points"]}
                    </td>

                    <td>
                        ${row.Hits}
                    </td>

                    <td>
                        ${row["Net Points"]}
                    </td>

                </tr>

            `).join("")}

        </tbody>
    `;
}


// ==========================================
// TABLE 4
// GAMEWEEK WINNERS
// ==========================================

function createWinnerTable(
    managerHistories
) {

    const winnerRows = [];


    // Find all gameweeks

    const allGameweeks =
        new Set();


    for (
        const manager of managerHistories
    ) {

        const current =
            manager.History.current || [];


        for (const gw of current) {

            if (gw.event !== undefined) {

                allGameweeks.add(
                    gw.event
                );
            }
        }
    }


    const sortedGameweeks =
        [...allGameweeks].sort(
            (a, b) => a - b
        );


    // Process every gameweek

    for (const gw of sortedGameweeks) {

        const gwManagers = [];


        for (
            const manager of managerHistories
        ) {

            const current =
                manager.History.current || [];


            const gwData =
                current.find(
                    data =>
                        data.event === gw
                );


            if (!gwData) {
                continue;
            }


            const points =
                gwData.points ?? 0;

            const hits =
                gwData.event_transfers_cost ?? 0;

            const netPoints =
                points + hits;


            gwManagers.push({

                Team:
                    manager.Team,

                Manager:
                    manager.Manager,

                "Net Points":
                    netPoints
            });
        }


        if (gwManagers.length === 0) {
            continue;
        }


        // Highest net points

        const highestNet =
            Math.max(
                ...gwManagers.map(
                    manager =>
                        manager["Net Points"]
                )
            );


        // Keep ALL tied winners

        const winners =
            gwManagers.filter(
                manager =>
                    manager["Net Points"] ===
                    highestNet
            );


        winnerRows.push({

            Gameweek:
                `GW${gw}`,

            Winner:
                winners
                    .map(
                        manager =>
                            manager.Manager
                    )
                    .join(", "),

            Team:
                winners
                    .map(
                        manager =>
                            manager.Team
                    )
                    .join(", "),

            "Net Points":
                highestNet
        });
    }


    const table =
        document.getElementById(
            "winner-table"
        );


    if (winnerRows.length === 0) {

        table.innerHTML = `
            <tr>
                <td>
                    No completed gameweek
                    data available yet.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = `

        <thead>

            <tr>
                <th>Gameweek</th>
                <th>Winner</th>
                <th>Team</th>
                <th>Net Points</th>
            </tr>

        </thead>


        <tbody>

            ${winnerRows.map(row => `

                <tr>

                    <td>
                        ${row.Gameweek}
                    </td>

                    <td>
                        ${row.Winner}
                    </td>

                    <td>
                        ${row.Team}
                    </td>

                    <td>
                        ${row["Net Points"]}
                    </td>

                </tr>

            `).join("")}

        </tbody>
    `;
}


// ==========================================
// START EVERYTHING
// ==========================================

async function initialize() {

    console.log(
        "Loading FPL Mini League..."
    );


    // --------------------------------------
    // Get managers
    // --------------------------------------

    const managers =
        await fetchMiniLeagueManagers();


    if (managers.length === 0) {

        console.error(
            "No managers found."
        );

        return;
    }


    console.log(
        `Managers found: ${managers.length}`
    );


    // --------------------------------------
    // Table 1
    // --------------------------------------

    displayOverallRanking(
        managers
    );


    // --------------------------------------
    // Fetch ALL histories once
    // --------------------------------------

    console.log(
        "Fetching manager histories..."
    );


    const managerHistories =
        await fetchAllManagerHistories(
            managers
        );


    console.log(
        `Histories loaded: ${managerHistories.length}`
    );


    // --------------------------------------
    // Table 2
    // --------------------------------------

    createNetPointsTable(
        managerHistories
    );


    // --------------------------------------
    // Table 3
    // --------------------------------------

    await createCurrentGameweekTable(
        managerHistories
    );


    // --------------------------------------
    // Table 4
    // --------------------------------------

    createWinnerTable(
        managerHistories
    );


    console.log(
        "All tables loaded."
    );
}


// Start website

initialize();
