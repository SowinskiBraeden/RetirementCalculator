const { getCollection } = require('./src/database/connection');

async function saveExchangeRates() {
    const { currencies } = getCollection();
    await currencies.insertMany(convert());
}