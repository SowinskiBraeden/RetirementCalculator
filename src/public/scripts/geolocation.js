function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getLatestExchange, error);
    }
}

async function getLatestExchange(position) {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;
    const res = await fetch(`/exRates/${lat}/${lon}`);
    const data = await res.json();

    console.log(data);
}

function error(err) {
    console.error("Geolocation error: ", err);
}