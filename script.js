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

    const data = await fetchJSON(
        "/leagues-classic/164381/standings/"
    );

    if (data) {

        console.log(
            "FPL API connection successful!"
        );

        console.log(data);

    } else {

        console.error(
            "FPL API connection failed."
        );
    }
}


testAPI();
