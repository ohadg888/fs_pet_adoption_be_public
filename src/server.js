import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import petRoutes from "./routes/pet";
import userRoutes from "./routes/user";
import bcrypt from "bcrypt";
import withDB from "./lib/withDB";
import signupSchema from "./lib/validation/signupSchema";
import loginSchema from "./lib/validation/loginSchema";
import jwt from "jsonwebtoken";

const myPort = 8000;
const app = express();
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cors());
app.use("/assets/petPics", express.static("assets/petPics"));
dotenv.config();

petRoutes(app);
userRoutes(app);

app.post("/api/login", async (req, res) => {
  const { loginFormData } = req.body;
  try {
    const isValid = await loginSchema.isValid(loginFormData);
    if (isValid) {
      withDB(async (db) => {
        const userInfo = await db
          .collection("users")
          .findOne({ email: loginFormData.loginEmail });
        const isPasswordSame = await bcrypt.compare(
          loginFormData.loginPassword,
          userInfo.hashedPassword
        );
        if (isPasswordSame) {
          const accessToken = jwt.sign(
            userInfo._id.toString(),
            process.env.ACCESS_TOKEN_SECRET
          );
          res.status(200).json({
            message: "SUCCESS: user logged-in",
            accessToken: accessToken,
            userID: userInfo._id.toString(),
            loggedIn: true,
          });
        } else {
          res
            .status(400)
            .json({ message: "Error: password is incorrect", loggedIn: false });
        }
      }, res);
    } else {
      res
        .status(400)
        .json({ message: "Error: data is invalid", loggedIn: false });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error: iternal server error", loggedIn: false });
  }
});

app.post("/api/signup", async (req, res) => {
  const { signupFormData } = req.body;
  try {
    const isValid = await signupSchema.isValid(signupFormData);
    if (
      isValid === true &&
      signupFormData.password === signupFormData.confirmPassword
    ) {
      const hashedPassword = await bcrypt.hash(signupFormData.password, 10);
      const newUser = {
        firstName: signupFormData.firstName,
        lastName: signupFormData.lastName,
        email: signupFormData.email,
        hashedPassword: hashedPassword,
        phoneNumber: signupFormData.phoneNumber,
        myPets: [],
        savedPets: [],
        role: "basic",
        createdOn: new Date(),
      };
      withDB(async (db) => {
        const userInfo = await db.collection("users").insertOne(newUser);
        res.status(201).json({
          message: "SUCCESS: user created",
          userID: userInfo.insertedId,
        });
      }, res);
    } else if (!isValid) {
      res.status(400).json({ message: "Error: invalid data" });
    } else {
      res.status(400).json({ message: "Error: passwords must be the same" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error: iternal server error" });
  }
});

app.listen(myPort, () => console.log(`Listening to port ${myPort}`));
