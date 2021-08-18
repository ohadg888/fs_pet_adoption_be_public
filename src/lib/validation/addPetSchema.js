import * as yup from "yup";

const addPetSchema = yup.object().shape({
  bio: yup.string().required(),
  breed: yup.string().required(),
  color: yup.string().required(),
  diet: yup.string().required(),
  height: yup.string().required(),
  hypoallergenic: yup.string().required(),
  name: yup.string().required(),
  status: yup.string().required(),
  type: yup.string().required(),
  weight: yup.string().required(),
});

export default addPetSchema;
