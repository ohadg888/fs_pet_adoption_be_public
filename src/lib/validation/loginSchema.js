import * as yup from "yup";

// const phoneRegex = /^05d([-]{0,1})d{7}$/;

const loginSchema = yup.object().shape({
  loginEmail: yup.string().email().required(),
  loginPassword: yup.string().min(6).required(),
});

export default loginSchema;
