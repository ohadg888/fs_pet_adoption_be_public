import { ObjectId } from "mongodb";
import userProfileSchema from "../lib/validation/userProfileSchema";
import withDB from "../lib/withDB";
import authUser from "../lib/middlewares/authUser";
import authAdmin from "../lib/middlewares/authAdmin";

const userRoutes = (app) => {
  app
    .route("/api/user/:id")
    .get(async (req, res) => {
      const userID = req.params.id;
      withDB(async (db) => {
        const userInfo = await db
          .collection("users")
          .find({ _id: ObjectId(userID) })
          .toArray();
        delete userInfo[0].password;
        res
          .status(200)
          .json({ message: "SUCCESS: got user by id", result: userInfo });
      }, res);
    })
    .put(authUser, async (req, res) => {
      const { dataToUpdate } = req.body;
      const userID = req.params.id;
      console.log(req.body);
      console.log(userID);
      try {
        withDB(async (db) => {
          await db
            .collection("users")
            .updateOne({ _id: ObjectId(userID) }, { $set: dataToUpdate });
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
      const userInfo = await db.collection("users").find({}).toArray();
      res
        .status(200)
        .json({ message: "SUCCESS: got all users", result: userInfo });
    }, res);
  });

  app.get("/api/user/:id/full", async (req, res) => {
    const userID = req.params.id;
    withDB(async (db) => {
      const userInfo = await db
        .collection("users")
        .find({ _id: ObjectId(userID) })
        .toArray();
      delete userInfo[0].hashedPassword;
      res
        .status(200)
        .json({ message: "SUCCESS: got user by id", result: userInfo[0] });
    }, res);
  });
};

export default userRoutes;
