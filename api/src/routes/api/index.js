import express from "express";
import userRoutes from "./users.js";
import siteRoutes from "./site.js";
import teamRoutes from "./team.js";
import bankAccountRoutes from "./bankAccounts.js";
import depositRoutes from "./deposit.js";
import withdrawRoutes from "./withdraw.js";
import offerRoutes from "./offer.js";
import gameRoutes from "./game.js";
import betsRoutes from "./bets.js";
import transactionRoutes from "./transactions.js"; // Transaction Routes
import pokerRoutes from "./poker.js"; // FAWK Poker Integration routes
import wcoRoutes from "./wco"; // WCO/Supernowa Integration routes
import wacsRoutes from "./wacs"; // WACS Integration routes
import sportsRoutes from "./sports"; // sportsbook routes

const router = express.Router();
router
  .get("/", function (req, res) {
    // render the /api view
    res.send(`This is a ${req.method} request to ${req.originalUrl}`);
  })

  // Import all api endpoints below. users.js will be imported as /api/users
  .use("/users", userRoutes)
  .use("/site", siteRoutes) // Site settings route
  .use("/team", teamRoutes) // Admin route
  .use("/bankAccounts", bankAccountRoutes) // Bank Account routes
  .use("/deposit", depositRoutes) // Deposit routes
  .use("/withdraw", withdrawRoutes) // Withdraw routes
  .use("/offer", offerRoutes) // Offer routes
  .use("/game", gameRoutes) // Playable Game List routes
  .use("/bets", betsRoutes) // Bet Routes
  .use("/transactions", transactionRoutes) // Transaction Routes
  .use("/poker", pokerRoutes) // FAWK Poker Integration routes
  // .use("/wco", wcoRoutes) // WCO/Supernowa Integration routes
  // .use("/wacs", wacsRoutes) // WACS Integration routes
  .use("/sports", sportsRoutes); // Odds API routes (Data fetched from The Odds API - https://the-odds-api.com/) with caching to minimize API calls
export default router;
