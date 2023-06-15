const fs = require("fs");
const csv = require("csvtojson");

const createData = async () => {
  let newData = await csv().fromFile("pokemon.csv");

  // array of Pokemon objects
  // console.log("newData", newData);

  let totalPokemons = 721;

  newData = new Set(newData);
  newData = Array.from(newData).slice(0, totalPokemons);

  // console.log("newData", newData);
  let index = 0;

  newData = newData.map((pokemon) => ({
    name: pokemon.Name,
    types: pokemon.Type2
      ? [pokemon.Type1.toLowerCase(), pokemon.Type2.toLowerCase()]
      : [pokemon.Type1.toLowerCase()],
    id: String(++index),
    // url: `/images/${index}.png`,
    url: `http://localhost:5000/images/${index}.png`,
  }));

  // console.log("newData", newData);
  const pokemons = { data: newData, totalPokemons: newData.length };

  // save data to db.json
  // fs.writeFileSync("../db.json", JSON.stringify(newData));
  fs.writeFileSync("../pokemons.json", JSON.stringify(pokemons));

  console.log("done");
};

createData();
