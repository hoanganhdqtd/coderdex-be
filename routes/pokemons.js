var express = require("express");
var router = express.Router();
const fs = require("fs");

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

// GET Pokemons
router.get("/", function (req, res, next) {
  const allowedFilter = ["page", "limit", "search", "type"];
  try {
    // const { url, params, query, body } = req;
    const { query } = req;

    // const { page, limit, search, type } = query;
    let { page, limit, ...filterQuery } = query;

    // only page, limit, search, type allowed

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const filterKeys = Object.keys(filterQuery);

    // console.log("filterKeys:", filterKeys);

    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    // Read data from pokemons.json then parse to JSobject
    const db = fs.readFileSync("pokemons.json", "utf-8");

    // console.log("db:", db);

    const pokemons = JSON.parse(db);

    let result = [];

    // Filter pokemons

    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        pokemons.data =
          condition === "search"
            ? pokemons.data.filter(
                (pokemon) =>
                  pokemon.name.includes(
                    filterQuery[condition].trim().toLowerCase()
                  ) ||
                  pokemon.types.includes(
                    filterQuery[condition].trim().toLowerCase()
                  )
              )
            : pokemons.data.filter((pokemon) =>
                pokemon.types.includes(
                  filterQuery[condition].trim().toLowerCase()
                )
              );
      });
      result = pokemons.data;
    } else {
      result = pokemons.data;
    }

    // console.log("result", result);

    //Number of items skip for selection
    let offset = limit * (page - 1);

    result = result.slice(offset, offset + limit);

    // res.send("respond with a resource");
    res.status(200).send({ data: result });
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

// GET a Pokemon by id
router.get("/:id", function (req, res, next) {
  try {
    // const { url, params, query, body } = req;
    const { id } = req.params;
    // console.log("id:", id);

    const db = fs.readFileSync("pokemons.json", "utf-8");

    const { data } = JSON.parse(db);

    const pokemonToFind = data.find((pokemon) => pokemon.id === id);

    // console.log("pokemonToFind:", pokemonToFind);

    if (!pokemonToFind) {
      throw new Error(`Pokemon with id ${id} not found`);
    }

    const resultIndex = data.findIndex((pokemon) => pokemon.id === id);

    const previousPokemon = data[(resultIndex + data.length - 1) % data.length];
    const nextPokemon = data[(resultIndex + 1) % data.length];

    result = { pokemon: pokemonToFind, previousPokemon, nextPokemon };

    // res.send("respond with a resource");
    res.status(200).send({ data: result });
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

// POST to add new pokemon
router.post("/", function (req, res, next) {
  try {
    // const { url, params, query, body } = req;
    // const { name, id, url, types } = req.body;

    let { name, id, url, types } = req.body;
    name = name?.trim()?.toLowerCase();
    url = url?.trim()?.toLowerCase();
    id = id?.trim()?.toLowerCase();

    // types = [types[0].trim().toLowerCase(), types[1].trim().toLowerCase()];
    for (let i = 0; i < types.length; i++) {
      types[i] = types[i]?.trim()?.toLowerCase();
    }

    const db = fs.readFileSync("pokemons.json", "utf-8");

    const pokemons = JSON.parse(db);
    const { data, totalPokemons } = pokemons;

    if (!(types[0].length || types[1].length) || !id || !name || !url) {
      throw new Error("Missing required data (name, url, types, id)");
    }

    const pokemonToPost = {
      name,
      // types: types.split(",").map((type) => type.trim().toLowerCase()),
      types: [],
      id,
      url,
    };

    // if (pokemonToPost.types.length > 2) {
    //   throw new Error("Pokémon can only have one or two types.");
    // }

    types.forEach((type) => {
      if (type) {
        if (!pokemonTypes.includes(type)) {
          throw new Error("Pokémon's type is invalid.");
        }
        pokemonToPost.types.push(type);
      }

      // if (formattedType) {
      //   if (!pokemonTypes.includes(formattedType)) {
      //     throw new Error("Pokémon's type is invalid.");
      //   }
      //   pokemonToPost.types.push(formattedType);
      // }
    });

    // if (!pokemonToPost.types.length) {
    //   throw new Error("Pokémon's type is invalid.");
    // }

    data.forEach((pokemon) => {
      if (pokemon.name === name || pokemon.id === id) {
        throw new Error("The Pokémon does exist.");
      }
    });

    // const result = [...pokemons, pokemonToPost];
    const result = {
      data: [...data, pokemonToPost],
      totalPokemons: totalPokemons + 1,
    };

    // console.log("result:", result);

    // turn result to string type to update pokemons.json
    fs.writeFileSync("pokemons.json", JSON.stringify(result));

    // res.send("respond with a resource");
    res.status(200).send(pokemonToPost);
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

// PUT to update a pokemon by id
// router.put("/:id", function (req, res, next)
router.put("/:id", function (req, res, next) {
  try {
    const { params, body } = req;
    const { id } = params;
    let { name, url, types, id: newId } = body;

    name = name?.trim()?.toLowerCase();
    url = url?.trim()?.toLowerCase();
    newId = newId?.trim()?.toLowerCase();

    for (let i = 0; i < types.length; i++) {
      types[i] = types[i]?.trim()?.toLowerCase();
    }

    if (!newId && !name && !url && !(types[0].length || types[1].length)) {
      throw new Error(
        "At least one of these fields (name, url, types, id) required to update"
      );
    }

    const db = fs.readFileSync("pokemons.json", "utf-8");

    const { data, totalPokemons } = JSON.parse(db);

    let pokemonToUpdate = data.find((pokemon) => pokemon.id === id);

    if (!pokemonToUpdate) {
      // res.status(500).send("Pokemon not found");
      throw new Error("Not found pokémon to update");
    }

    // pokemonToUpdate = {
    //   ...pokemonToUpdate,
    //   id: newId,
    //   name,
    //   url,
    //   types: typesArray,
    // };

    if (newId) {
      data.forEach((pokemon) => {
        if (pokemon.id !== id && pokemon.id === newId) {
          throw new Error("The Pokémon does exist.");
        }
      });
      pokemonToUpdate.id = newId;
    }

    if (name) {
      data.forEach((pokemon) => {
        if (pokemon.name === name && pokemon.id !== id) {
          throw new Error("The Pokémon does exist.");
        }
      });
      pokemonToUpdate.name = name;
    }

    if (url) {
      pokemonToUpdate.url = url;
    }

    // if (types) {
    //   // const typesArray = types
    //   //   .split(",")
    //   //   .map((type) => type.trim().toLowerCase());

    //   if (types.length > 2) {
    //     throw new Error("Pokémon can only have either one or two types.");
    //   }

    //   types.forEach((type) => {
    //     if (!pokemonTypes.includes(type)) {
    //       throw new Error("Pokémon's type is invalid.");
    //     }
    //   });

    //   pokemonToUpdate.types = types;
    // }

    if (types) {
      pokemonToUpdate.types = [];
      types.forEach((type) => {
        if (type) {
          if (!pokemonTypes.includes(type)) {
            throw new Error("Pokémon's type is invalid.");
          }
          pokemonToUpdate.types.push(type);
        }
      });
      if (!pokemonToUpdate.types.length) {
        throw new Error("Pokémon's type is invalid.");
      }
    }

    const result = {
      data: [...data.filter((pokemon) => pokemon.id !== id), pokemonToUpdate],
      totalPokemons,
    };
    fs.writeFileSync("pokemons.json", JSON.stringify(result));

    res.status(200).send(pokemonToUpdate);
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

// DELETE a pokemon by id
router.delete("/:id", function (req, res, next) {
  try {
    const { id } = req.params;

    const db = fs.readFileSync("pokemons.json", "utf-8");

    const { data, totalPokemons } = JSON.parse(db);

    const pokemonToDelete = data.find((pokemon) => pokemon.id === id);

    if (!pokemonToDelete) {
      // res.status(500).send("Pokemon not found");
      throw new Error("Not found Pokemon to delete");
    }

    const result = {
      data: data.filter((pokemon) => pokemon.id !== id),
      totalPokemons: totalPokemons - 1,
    };
    fs.writeFileSync("pokemons.json", JSON.stringify(result));
    res.status(200).send(pokemonToDelete);
  } catch (err) {
    err.statusCode = 404;
    next(err);
  }
});

module.exports = router;
