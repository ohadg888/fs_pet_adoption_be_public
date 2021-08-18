import * as yup from "yup";

// const phoneRegex = /^05d([-]{0,1})d{7}$/;

const signupSchema = yup.object().shape({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  confirmPassword: yup.string().min(6).required(),
  phoneNumber: yup.string().required(),
});

export default signupSchema;
