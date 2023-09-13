"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
    class Game extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Game.init(
        {
            api: DataTypes.STRING, // api for the game. wacs, wco or fawk
            provider: DataTypes.STRING,
            code: DataTypes.STRING, // game code or provider game code/id
            name: DataTypes.STRING, // game name
            category: DataTypes.STRING, // game category
            tags: DataTypes.ARRAY(DataTypes.STRING), // game tags
            image: DataTypes.STRING, // game image url, starting with /img/img_name.jpg
            enabled: { type: DataTypes.BOOLEAN, defaultValue: true }, // is the game enabled? can be updated by the admin. if enabled, user can see & play the game
            is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // for soft delete
            order: { type: DataTypes.INTEGER, defaultValue: 0 }, // sort order in which the games are displayed. 0 is the first game, can be updated by the admin
            is_popular: { type: DataTypes.BOOLEAN, defaultValue: false }, // is the game popular? can be updated by the admin
            is_featured: { type: DataTypes.BOOLEAN, defaultValue: false }, // is the game featured? can be updated by the admin
            is_new: { type: DataTypes.BOOLEAN, defaultValue: false }, // is the game new? can be updated by the admin
        },
        {
            sequelize,
            modelName: "Game",
        }
    );
    return Game;
};
