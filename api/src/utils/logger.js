import * as winston from "winston";
import "winston-daily-rotate-file";

export const transport = new winston.transports.DailyRotateFile({
  filename: "./srclogs/spade365-%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: false, // dont zip the log files
  maxSize: "20m",
  maxFiles: "14d",
});
export const transportConsole = new winston.transports.Console({
  timestamp: true,
});

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize({
      all: true,
    }),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(
      (info) =>
        `${info.timestamp} ${info.level}: ${info.message}` +
        (info.splat !== undefined ? `${info.splat}` : " ")
    )
  ),
});

if (process.env.NODE_ENV != "production") {
  logger.add(transportConsole);
}
if (process.env.NODE_ENV == "production") {
  logger.add(transport);
}
transport.on("rotate", function (oldFilename, newFilename) {
  logger.info(
    `finished logging ${oldFilename}. Started new log ${newFilename}`
  );
});
