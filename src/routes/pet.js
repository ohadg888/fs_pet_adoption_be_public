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
    const fileType = file.mimetype.split("/")[1];
    callback(null, uuidv4() + `.${fileType}`);
  },
});

const upload = multer({ storage: storage });

const petRoutes = (app) => {
  app
    .route("/api/pet")
    .post(authUser, authAdmin, upload.single("petPic"), async (req, res) => {
      console.log(req.file);
      const petData = { ...req.body };
      delete petData.petPic;
      petData.picture = req.file.filename;
      petData.ownerID = null;
      console.log(req.file);
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
          .findOne({ _id: ObjectId(petID) });
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
    const { type } = req.body;
    const petID = req.params.id;
    withDB(async (db) => {
      await db
        .collection("pets")
        .updateOne(
          { _id: ObjectId(petID) },
          { $set: { status: type, ownerID: req.user._id.toString() } }
        );
      await db
        .collection("users")
        .updateOne({ _id: req.user._id }, { $push: { myPets: petID } });
      res.status(200).json({ message: `SUCCESS: pet was ${type}` });
    }, res);
  });

  app.post("/api/pet/:id/return", authUser, async (req, res) => {
    const petID = req.params.id;
    console.log(petID);
    withDB(async (db) => {
      console.log(345);
      const pet = await db.collection("pets").findOne({ _id: ObjectId(petID) });
      console.log(123);
      console.log(pet.ownerID);
      await db
        .collection("pets")
        .updateOne(
          { _id: ObjectId(petID) },
          { $set: { status: "available", ownerID: null } }
        );
      await db
        .collection("users")
        .updateOne(
          { _id: ObjectId(pet.ownerID) },
          { $pull: { myPets: petID } }
        );
      res.status(200).json({ message: `SUCCESS: pet was returned` });
    }, res);
  });

  app
    .route("/api/pet/:id/save")
    .post(authUser, async (req, res) => {
      const petID = req.params.id;
      withDB(async (db) => {
        await db
          .collection("users")
          .updateOne({ _id: req.user._id }, { $push: { savedPets: petID } });
        const user = await db
          .collection("users")
          .findOne({ _id: req.user._id });
        res
          .status(200)
          .json({ message: "SUCCESS: pet was saved", result: user });
      }, res);
    })
    .delete(authUser, async (req, res) => {
      const petID = req.params.id;
      withDB(async (db) => {
        await db
          .collection("users")
          .updateOne({ _id: req.user._id }, { $pull: { savedPets: petID } });
        const user = await db
          .collection("users")
          .findOne({ _id: req.user._id });
        res
          .status(200)
          .json({ message: "SUCCESS: pet was unsaved", result: user });
      }, res);
    });

  app.get("/api/pet/user/:id", async (req, res) => {
    const userID = req.params.id;
    withDB(async (db) => {
      const userInfo = await db
        .collection("users")
        .findOne({ _id: ObjectId(userID) });
      const myPets = await db
        .collection("pets")
        .find({ ownerID: userInfo._id.toString() })
        .toArray();
      userInfo.savedPets = userInfo.savedPets.map((id) => ObjectId(id));
      const savedPets = await db
        .collection("pets")
        .find({ _id: { $in: userInfo.savedPets } })
        .toArray();
      res.status(200).json({
        message: "SUCCESS: get pets by userID",
        result: { myPets: myPets, savedPets: savedPets },
      });
    }, res);
  });
};

export default petRoutes;
