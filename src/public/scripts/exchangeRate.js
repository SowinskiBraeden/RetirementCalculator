async function convert(from) {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}`);
    const data = await res.json();

    return data;
}