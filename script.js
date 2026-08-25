const API_BASE = "https://YOUR-WORKER.workers.dev/api";

async function fetchJSON(endpoint) {

    const response =
        await fetch(API_BASE + endpoint);

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.json();
}


async function test() {

    const data =
        await fetchJSON(
            "/leagues-classic/164381/standings/"
        );

    console.log(data);
}

test();
