// /StackFusionZiyiliuTop/backend/src/index.ts
import {default as logger} from "jet-logger";
import {PORT} from "@src/common/constants/ENV";
import server from "@src/server";

/******************************************************************************
 Run
 ******************************************************************************/

const SERVER_START_MSG = ("Express server started on port: " + PORT.toString());

server.listen(PORT, () => logger.info(SERVER_START_MSG));
