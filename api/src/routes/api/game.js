// All routes for Playable Games on site. This includes: Games that can be played on the site, and the games that are available on the site.
// Not to be confused with game sessions, which are the game sessions that are played by users.
// Add, approve, edit or delete games

import express from "express";
import { query, validationResult, body } from "express-validator";
import { Op } from "sequelize";
import db from "../../db/models/index.js";
import Sequelize from "sequelize";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
import { defaultFawkGames } from "../../utils/games/defaultGames.js"; // import default games for reset and new installs
import axios from "axios";

const router = express.Router();

router
    // all users can get all games
    .get(
        "/",
        query("api").optional().isString(),
        query("provider").optional().isString(),
        query("search").optional().isString(),
        query("tags").optional().isString(),
        query("category").optional().isString(),
        query("enabled").optional().isBoolean(),
        query("limit").optional().isInt({ min: 0, max: 100 }),
        query("skip").optional().isInt({ min: 0 }),
        async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { api, provider, search, tags, category, enabled, limit, skip } = req.query;

                let where = {};

                // if enabled is provided, use it
                if (enabled) where.enabled = enabled;

                if (api) where.api = api;

                if (provider) where.provider = provider

                if (category) where.category = category;

                if (search) {
                    // search by name, api, provider, category or tags
                    where = {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${search}%` } },
                            { api: { [Op.iLike]: `%${search}%` } },
                            { provider: { [Op.iLike]: `%${search}%` } },
                            { category: { [Op.iLike]: `%${search}%` } },
                            { tags: { [Op.contains]: [search] } },
                        ],
                    };
                }

                if (tags) {
                    where.tags = {
                        [Op.contains]: tags.split(","),
                    };
                }

                const games = await db.Game.findAll({
                    where,
                    limit,
                    offset: skip,
                    order: [["order", "ASC"]], // order by sort order
                });

                return res.json(games);
            } catch (error) {
                logger.error(error);
                res
                    .status(400)
                    .send("Request Failed");
            }
        })
    // Add a game. only admins can add games
    .post(
        "/",
        authorizer,
        body("name").isString(),
        body("code").isString(),
        body("provider").isString(),
        body("api").isString(),
        body("tags").optional().isArray(),
        body("image").optional().isString(),
        body("enabled").optional().isBoolean(),
        body("is_popular").optional().isBoolean(),
        body("is_featured").optional().isBoolean(),
        body("is_new").optional().isBoolean(),
        async (req, res) => {
            try {
                if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
                const errors = validationResult(req);

                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const {
                    name,
                    code,
                    provider,
                    api,
                    tags,
                    image,
                    enabled,
                    is_popular,
                    is_featured,
                    is_new,
                } = req.body;


                const maxOrder = await db.Game.max("order"); // get next available order
                const game = await db.Game.create({
                    name,
                    code,
                    provider,
                    api,
                    tags,
                    image,
                    enabled,
                    is_popular,
                    is_featured,
                    is_new,
                    order: maxOrder + 1,
                });

                return res.status(200).send("Game added");

            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        })
    // only Admins can enable or disable games, set the game as popular, featured, or new. Either by id or by provider
    .put(
        "/",
        authorizer,
        body("id").optional().isInt(),
        body("provider").optional().isString(),
        body("enabled").optional().isBoolean(),
        body("is_popular").optional().isBoolean(),
        body("is_featured").optional().isBoolean(),
        body("is_new").optional().isBoolean(),
        async (req, res) => {
            try {
                if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { id, provider, enabled, is_popular, is_featured, is_new } = req.body;

                const where = {};

                if (id) where.id = id;

                if (provider) where.provider = provider;

                if (!id && !provider) return res.status(400).send("No id or game provider provided");

                const games = await db.Game.findAll({ where, });

                if (games.length === 0) return res.status(400).send("No games found");

                for (const game of games) {
                    if (enabled !== undefined) game.enabled = enabled;
                    if (is_popular !== undefined) game.is_popular = is_popular;
                    if (is_featured !== undefined) game.is_featured = is_featured;
                    if (is_new !== undefined) game.is_new = is_new;
                    await game.save();
                }

                return res.status(200).send('Games updated');

            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        }
    )
    //  admins can set the order of games by id
    .put(
        "/order",
        authorizer,
        body("id").isInt(),
        body("order").isInt({ min: -1 }),
        async (req, res) => {
            try {
                if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { id, order } = req.body;

                const game = await db.Game.findByPk(id);

                if (!game) return res.status(400).send("No game found");

                // if game order is 0, return if order is -1
                if (game.order === 0 && order === -1) {
                    return res.status(400).send("Game is already first");
                }

                // if game order is last game, return if order is 1
                const lastGame = await db.Game.findOne({ order: [["order", "DESC"]], });

                if (game.order === lastGame.order && order === 1) {
                    return res.status(400).send("Game is already last");
                }

                // if order is +1, switch order with next game, if -1 switch with previous game
                if (order === -1) {
                    const previousGame = await db.Game.findOne({
                        where: {
                            order: game.order - 1,
                        },
                    });

                    if (previousGame) {
                        previousGame.order = game.order;
                        await previousGame.save();
                    }
                } else if (order === 1) {
                    const nextGame = await db.Game.findOne({
                        where: {
                            order: game.order + 1,
                        },
                    });

                    if (nextGame) {
                        nextGame.order = game.order;
                        await nextGame.save();
                    }
                }

                game.order = game.order + order;
                await game.save();

                return res.status(200).send('Game order updated');
            } catch (error) {
                logger.error(error);
                res
                    .status(400)
                    .send("Request Failed");
            }
        }
    )
    // Admins can reset game list. This is for first run only when no games exist in the database.
    .put(
        "/reset",
        authorizer,
        async (req, res) => {
            try {
                if (req.user.role !== "admin") return res.status(401).send("Unauthorized");

                // delete all games from database
                await db.Game.destroy({
                    truncate: true,
                });

                // if games exist, return
                // const gamesCheck = await db.Game.findAll();
                // if (gamesCheck.length > 0) return res.send("Games already exist. Reset aborted");

                // add fawk games
                await db.sequelize.query(defaultFawkGames);

                return res.send("Games Reset");

                // Wacs games are not added by default. Remove the return above to add them.

                // add wacs games
                const response = await axios.get("https://pi.njoybingo.com/v2/publisher/games/fancybet");
                const { providers } = response.data;
                let order = 0;
                for (const provider of providers) {
                    if (provider.games?.length > 0) {
                        for (const game of provider.games) {
                            if (!game.name || !game.code || game.code.includes('DISABLED') || game.code.includes('DISBALED')) continue;
                            // create new game
                            const newGame = await db.Game.create({
                                api: "wacs",
                                name: game.name,
                                code: game.code,
                                category: game.category,
                                tags: game.name.split(" ").filter(tag => tag !== "").concat(game.category, provider.name),
                                // image: game.image ? game.image?.url : "",
                                image: game.image?.url ? `/img/wacs/${provider.name}/${game.code}.jpg` : "",
                                provider: provider.name,
                                enabled: provider.name === "evolution" || provider.name === "netent" ? true : false,
                                is_popular: false,
                                is_featured: false,
                                is_new: false,
                                order,
                            });
                            order++;
                        }
                    }
                }

                return res.send("Games Reset");
            } catch (error) {
                logger.error(error);
                res
                    .status(400)
                    .send("Request Failed");
            }
        }
    )
    .put( // Update a game by id. Only admins can update games
        "/:id",
        authorizer,
        body("name").isString(),
        body("code").isString(),
        body("provider").isString(),
        body("api").isString(),
        body("tags").optional().isArray(),
        body("image").optional().isString(),
        body("enabled").optional().isBoolean(),
        body("is_popular").optional().isBoolean(),
        body("is_featured").optional().isBoolean(),
        body("is_new").optional().isBoolean(),
        async (req, res) => {
            try {
                if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { id } = req.params;

                if (!id) return res.status(400).send("No id provided");

                const game = await db.Game.findByPk(parseInt(id));

                if (!game) return res.status(400).send("No game found");

                const {
                    name,
                    code,
                    provider,
                    api,
                    tags,
                    image,
                    enabled,
                    is_popular,
                    is_featured,
                    is_new,
                } = req.body;

                if (name) game.name = name;
                if (code) game.code = code;
                if (provider) game.provider = provider;
                if (api) game.api = api;
                if (tags) game.tags = tags;
                if (image) game.image = image;
                if (enabled) game.enabled = enabled;
                if (is_popular) game.is_popular = is_popular;
                if (is_featured) game.is_featured = is_featured;
                if (is_new) game.is_new = is_new;

                await game.save();

                return res.status(200).send("Game updated");

            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        }
    )
    // soft delete a game by id
    .delete(
        "/:id",
        authorizer,
        async (req, res) => {
            try {
                if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { id } = req.params;

                if (!id) return res.status(400).send("No id provided");

                const game = await db.Game.findByPk(parseInt(id));

                if (!game) return res.status(400).send("No game found");

                game.enabled = false;
                game.is_deleted = true;
                await game.save();

                return res.status(200).send(true);
            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        }
    )
    // get all unique game providers from database
    .get(
        "/providers",
        query("enabled").optional().isBoolean(),
        // authorizer,
        async (req, res) => {
            try {
                // if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { enabled } = req.query;

                let providers;

                // if enabled query param is provided, get only providers with atleast one enabled game
                if (enabled) {
                    providers = await db.Game.findAll({
                        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("provider")), "provider"],],
                        where: {
                            enabled: enabled,
                        },
                        group: ["provider"],
                    });
                } else {
                    providers = await db.Game.findAll({
                        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("provider")), "provider"],],
                        group: ["provider"],
                    });
                }

                // create json array with provider names
                const providersArray = [];
                for (const provider of providers) {
                    if (!provider.provider) continue; // if provider.provider is null or undefined, skip
                    providersArray.push(provider.provider);
                }

                providersArray.sort(); // sort array alphabetically

                return res.json(providersArray);
            } catch (error) {
                logger.error(error);
                res
                    .status(400)
                    .send("Request Failed");
            }
        }
    );

export default router;