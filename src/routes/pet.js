import { ObjectId } from "mongodb";
import multer from "multer";
import addPetSchema from "../lib/validation/addPetSchema";
import withDB from "../lib/withDB";
import authUser from "../lib/middlewares/authUser";
import authAdmin from "../lib/middlewares/authAdmin";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./assets/petPics/");
  },
  filename: function (req, file, callback) {
    console.log(file);
    callback(null, uuidv4());
  },
});
const upload = multer({ storage: storage });
const petRoutes = (app) => {
  app
    .route("/api/pet")
    .post(authUser, authAdmin, upload.single("petPic"), async (req, res) => {
      console.log(req.file);
      const petData = { ...req.body };
      petData.ownerID = null;
      console.log(123);
      try {
        console.log(petData);
        const isValid = await addPetSchema.isValid(petData);
        console.log(isValid);
        if (isValid) {
          withDB(async (db) => {
            const petInfo = await db.collection("pets").insertOne(petData);
            res.status(201).json({
              message: "SUCCESS: pet was added",
              result: petInfo.insertedId,
            });
          }, res);
        } else {
          res.status(400).json({ message: "Error: data is invalid" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error: iternal server error" });
      }
    })
    .get((req, res) => {
      withDB(async (db) => {
        const pets = await db.collection("pets").find({}).toArray();
        res.status(200).json({ message: "SUCCESS", result: pets });
      }, res);
    });

  app
    .route("/api/pet/:id")
    .get((req, res) => {
      const petID = req.params.id;
      withDB(async (db) => {
        const pets = await db
          .collection("pets")
          .findOne({ _id: ObjectId(petID) })
          .toArray();
        res.status(200).json({ message: "SUCCESS", result: pets });
      }, res);
    })
    .put(authUser, authAdmin, async (req, res) => {
      const { petData } = req.body;
      const petID = req.params.id;
      try {
        const isValid = await addPetSchema.isValid(petData);
        console.log(isValid);
        if (isValid) {
          withDB(async (db) => {
            const petInfo = await db
              .collection("pets")
              .updateOne({ _id: ObjectId(petID) }, { $set: petData });
            res.status(201).json({
              message: "SUCCESS: pet was updated",
            });
          }, res);
        } else {
          res.status(400).json({ message: "Error: data is invalid" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error: iternal server error" });
      }
    });

  app.post("/api/pet/:id/adopt", authUser, async (req, res) => {
    const { type, userID } = req.body;
    const petID = req.params.id;
    withDB(async (db) => {
      await db
        .collection("pets")
        .updateOne(
          { _id: ObjectId(petID) },
          { $set: { statusField: type, ownerID: userID } }
        );
      await db
        .collection("users")
        .updateOne({ _id: ObjectId(userID) }, { $push: { myPets: petID } });
      res.status(200).json({ message: `SUCCESS: pet was ${type}` });
    }, res);
  });

  app.post("/api/pet/:id/return", authUser, async (req, res) => {
    const { userID } = req.body;
    const petID = req.params.id;
    withDB(async (db) => {
      await db
        .collection("pets")
        .updateOne(
          { _id: ObjectId(petID) },
          { $set: { statusField: "available" }, ownerID: null }
        );
      await db
        .collection("users")
        .updateOne({ _id: ObjectId(userID) }, { $pull: { myPets: petID } });
      res.status(200).json({ message: `SUCCESS: pet was returned` });
    }, res);
  });

  app
    .route("/api/pet/:id/save")
    .post(authUser, async (req, res) => {
      const { userID } = req.body;
      const petID = req.params.id;
      withDB(async (db) => {
        await db
          .collection("users")
          .updateOne(
            { _id: ObjectId(userID) },
            { $push: { savedPets: petID } }
          );
        res.status(200).json({ message: "SUCCESS: pet was saved" });
      }, res);
    })
    .delete(authUser, async (req, res) => {
      const { userID } = req.body;
      const petID = req.params.id;
      withDB(async (db) => {
        await db
          .collection("users")
          .updateOne(
            { _id: ObjectId(userID) },
            { $pull: { savedPets: petID } }
          );
        res.status(200).json({ message: "SUCCESS: pet was unsaved" });
      }, res);
    });

  app.get("/api/pet/user/:id", async (req, res) => {
    const { petData } = req.body;
    const petID = req.params.id;
    withDB(async (db) => {
      const userInfo = await db.collection("users").insert(petData);
      res.status(200).json({ message: "SUCCESS: pet was added" });
    }, res);
  });
};

export default petRoutes;
