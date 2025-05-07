function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    }
}

function success(position) {
    const { latitude, longitude } = position.coords;

    fetch("api/location" , {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ latitude, longitude })
    }).then(res => res.json())
    .then(data => {
        console.log(data.results[0].formatted_address);
    })
}

function error(err) {
    console.error("Geolocation error: ", err);
}
