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
// TABLE 1
// OVERALL MINI-LEAGUE RANKING
// ==========================================

async function loadOverallRanking() {

    const standings = await fetchJSON(
        `/leagues-classic/${LEAGUE_ID}/standings/?page_standings=1`
    );


    if (!standings) {

        document.getElementById(
            "overall-table"
        ).innerHTML = `
            <tr>
                <td>
                    Could not fetch mini-league standings.
                </td>
            </tr>
        `;

        return;
    }


    const results =
        standings.standings?.results || [];


    if (results.length === 0) {

        document.getElementById(
            "overall-table"
        ).innerHTML = `
            <tr>
                <td>
                    No completed gameweek standings
                    are available yet.
                </td>
            </tr>
        `;

        return;
    }


    // Equivalent to the Python DataFrame

    const overallData = results.map(manager => ({

        Rank:
            manager.rank,

        Team:
            manager.entry_name,

        Manager:
            manager.player_name,

        "Total Points":
            manager.total

    }));


    // Sort by Rank

    overallData.sort(
        (a, b) => a.Rank - b.Rank
    );


    // ==========================================
    // CREATE HTML TABLE
    // ==========================================

    const table =
        document.getElementById(
            "overall-table"
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

                </tr>

            `).join("")}

        </tbody>
    `;
}


// ==========================================
// START WEBSITE
// ==========================================

loadOverallRanking();
