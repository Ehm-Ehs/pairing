import * as Yup from "yup";

export const validationSchema = Yup.object({
  numParticipants: Yup.number()
    .positive("Number of participants must be greater than zero")
    .integer("Number of participants must be an integer")
    .required("Number of participants is required"),
  numGroups: Yup.number()
    .positive("Number of groups must be greater than zero")
    .integer("Number of groups must be an integer")
    .required("Number of groups is required")
    .test(
      "divisible",
      "Number of participants must be divisible by number of groups",
      function (numGroups) {
        const { numParticipants } = this.parent;
        if (numGroups === 0) return false;
        return Number(numParticipants) % numGroups === 0;
      }
    ),
  groupingPurpose: Yup.string().required("Group purpose is required"),
  characteristics: Yup.array().of(
    Yup.object({
      name: Yup.string().required("Characteristic name is required"),
      count: Yup.number()
        .positive("Count must be greater than zero")
        .integer("Count must be an integer")
        .required("Count is required"),
    })
  ),
});
