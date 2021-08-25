import { ObjectId } from "mongodb";
import userProfileSchema from "../lib/validation/userProfileSchema";
import withDB from "../lib/withDB";
import authUser from "../lib/middlewares/authUser";
import authAdmin from "../lib/middlewares/authAdmin";

const userRoutes = (app) => {
  app.get("/api/user/info", authUser, async (req, res) => {
    delete req.user.hashedPassword;
    res
      .status(200)
      .json({ message: "SUCCESS: got user by id", result: req.user });
  });

  app.put("/api/user/:id", authUser, async (req, res) => {
    const { dataToUpdate } = req.body;
    try {
      withDB(async (db) => {
        await db
          .collection("users")
          .updateOne({ _id: ObjectId(req.user._id) }, { $set: dataToUpdate });
        res.status(201).json({
          message: "SUCCESS: user was updated",
        });
      }, res);
    } catch (error) {
      res.status(500).json({ message: "Error: iternal server error" });
    }
  });

  app.get("/api/user", authUser, authAdmin, async (req, res) => {
    withDB(async (db) => {
      const users = await db.collection("users").find({}).toArray();
      res
        .status(200)
        .json({ message: "SUCCESS: got all users", result: users });
    }, res);
  });

  app.get("/api/user/:id/full", async (req, res) => {
    const userID = req.params.id;
    withDB(async (db) => {
      const userInfo = await db
        .collection("users")
        .findOne({ _id: ObjectId(userID) });
      delete userInfo.hashedPassword;
      res
        .status(200)
        .json({ message: "SUCCESS: got user by id", result: userInfo });
    }, res);
  });
};

export default userRoutes;
