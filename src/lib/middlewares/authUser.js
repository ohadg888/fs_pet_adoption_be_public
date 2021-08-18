import jwt from "jsonwebtoken";
import withDB from "../withDB";
import { ObjectId } from "mongodb";

function authUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Error: not authorized" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userID) => {
    if (err) return res.status(403).json({ message: "Error: not allowed" });
    req.userID = userID;
    withDB(async (db) => {
      const userInfo = await db
        .collection("users")
        .findOne({ _id: ObjectId(userID) });
      req.user = userInfo;
      next();
    }, res);
  });
}

export default authUser;
