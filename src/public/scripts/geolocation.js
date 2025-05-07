async function diffCountries() {
    const res = await fetch("/static/json/countries.json");
    const data = await res.json();
    
    return data.countries;
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    }
}

async function success(position) {
    const { latitude, longitude } = position.coords;
    let countryCurrency;

    const countries = await diffCountries();

    const res = await fetch("api/location" , {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ latitude, longitude })
    });
    
    const data = await res.json();

    countries.forEach(country => {
        if (country.country === data.results[0].formatted_address) {
            countryCurrency = country.currency_abbreviation;

            convert(countryCurrency);
        }
    });
}

function error(err) {
    console.error("Geolocation error: ", err);
}

getLocation();