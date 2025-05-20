// /StackFusionZiyiliuTop/backend/src/api/v1/jwtRouter.ts
import {Router} from "express";
import cookieParser from "cookie-parser";
import {UserModel} from "models/user.model";
import {successResponse, errorResponse} from "middlewares/response";
import {signUserToken, signServerToken, setAuthCookie,} from "utils/jwt.util";

const jwtRouter = Router()
jwtRouter.use(cookieParser())

/** Handle user login. Public API
 *  Request: POST /api/v1/jwt/login
 *  Body: {"email": "xxx@xxx.com", "password": "password"}
 *  Response 200: "data": {
 *      "uuid": "xxx",
 *      "email": "xxx@xxx.com",
 *      "username": "xxx",
 *      "role": [],
 *      "created_at": "2000-01-01T00:00:00.000Z",
 *      "updated_at": "2000-01-01T00:00:00.000Z"
 *  }
 */
jwtRouter.post("/login", async (req, res) => {
    const {email, password} = req.body
    if (!email || !password) {
        res.status(400).json(errorResponse(req, 400, "Email and password are required"))
        return
    }
    try {
        const user = new UserModel(null, email)
        const exists = await user.fetchUser()
        if (!exists || !(await user.authenticateUser(password))) {
            res.status(401).json(errorResponse(req, 401, "Invalid credentials"))
            return
        }
        req.user = exists as UserModel

        // issue short term token with ACCESS_TOKEN_EXPIRY
        const token = await signUserToken(user.uuid!)
        // set cookie
        setAuthCookie(res, process.env.USER_ACCESS_COOKIE_NAME!, token, Number(process.env.ACCESS_TOKEN_EXPIRY)!)

        res.status(200).json(successResponse(req, {user, token}, "Login successful"))
    } catch (err) {
        console.error(err)
        res.status(500).json(errorResponse(req, 500, "Internal server error"))
    }
})

/** Handle user logout. Admin, Correspond, Cookie STT / Header LTT
 *  Request: POST /api/v1/jwt/logout
 *  Header: {Authorization "Bearer ${LTT}"}
 *  Response 200: "data": {}
 */
jwtRouter.post("/logout", async (req, res) => {
    // clear cookies
    res.clearCookie(process.env.USER_ACCESS_COOKIE_NAME!)
    res.status(200).json(successResponse(req, {}, "Logout successful"))
})

/** Handle server login/refresh. Public API
 *  Request: POST /api/v1/jwt/server
 *  Response 200: "data": {}
 */
jwtRouter.post("/server", async (req, res) => {
    // server token generation
    const token = await signServerToken()
    // set cookie
    setAuthCookie(res, process.env.SERVER_ACCESS_COOKIE_NAME!, token, Number(process.env.SERVER_TOKEN_EXPIRY)!)
    res.status(200).json(successResponse(req, {}, "Server token generated"))
})

export default jwtRouter
