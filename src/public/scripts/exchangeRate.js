function convert(from) {
    fetch(`https://api.frankfurter.dev/v1/latest?base=${from}`)
      .then((resp) => resp.json())
      .then((data) => {
        console.log(data);
    });
}