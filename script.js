const API_BASE =
    "https://fpl-api-proxy.sakriyaawal.workers.dev/api";


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


// Test FPL API connection
async function testAPI() {

    const status =
        document.getElementById("status");

    status.textContent =
        "Loading FPL data...";


    const data = await fetchJSON(
        "/leagues-classic/164381/standings/"
    );


    if (data) {

        status.textContent =
            "FPL API connection successful!";

        console.log(data);

    } else {

        status.textContent =
            "FPL API connection failed.";

    }
}


testAPI();
