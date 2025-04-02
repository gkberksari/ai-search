import { z } from "zod";

export const applicantSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  rating: z.number(),
  isFavoritedByMe: z.boolean(),
  profilePhotoUrl: z.string().nullable(),
  collaborators: z.object({
    assignees: z.array(z.any()),
    autoAssignees: z.array(z.any()),
    __typename: z.string(),
  }),
  activeApplication: z.object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    aiFit: z.number().nullable(),
    score: z.number().nullable(),
    salaryExp: z.number().nullable(),
    salaryExpCurr: z.string().nullable(),
    salaryExpPeriod: z.string().nullable(),
    lexorank: z.string(),
    resume: z
      .object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        size: z.number(),
        pageCount: z.number(),
        uploadedAt: z.string(),
        __typename: z.string(),
      })
      .nullable(),
    jobListing: z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      type: z.string(),
      collaborators: z.object({
        autoAssignees: z.array(z.any()),
        __typename: z.string(),
      }),
      __typename: z.string(),
    }),
    stage: z.object({
      id: z.string(),
      name: z.string(),
      __typename: z.string(),
    }),
    applicant: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      profilePhotoUrl: z.string().nullable(),
      email: z.string(),
      __typename: z.string(),
    }),
    rejectedReasons: z.array(z.any()),
    __typename: z.string(),
  }),
  email: z.string(),
  phoneNumber: z.string(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  age: z.number().nullable(),
  longitude: z.number().nullable(),
  country: z.string().nullable(),
  gender: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gradUni: z.string().nullable(),
  university: z
    .object({
      id: z.string(),
      name: z.string(),
      __typename: z.string(),
    })
    .nullable(),
  universityName: z.string().nullable(),
  salaryExp: z.string().nullable(),
  salaryExp2: z.string().nullable(),
  salaryExpCurr: z.string().nullable(),
  salaryExpPeriod: z.string().nullable(),
  sourceLink: z.string().nullable(),
  sourceType: z.string(),
  sourceUpdatedAt: z.string(),
  updatedAt: z.string(),
  myPermission: z.object({
    id: z.string(),
    canViewApplicantPhoneNumber: z.boolean(),
    canViewApplicantLocation: z.boolean(),
    canViewApplicantFormAnswers: z.boolean(),
    canViewApplicantExpectedSalary: z.boolean(),
    canDeleteApplicants: z.boolean(),
    canAssignMembersToApplicants: z.boolean(),
    __typename: z.string(),
  }),
  createdAt: z.string(),
  isViewedByMe: z.boolean(),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      __typename: z.string(),
    })
  ),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      __typename: z.string(),
    })
  ),
  __typename: z.string(),
});

export type Applicant = z.infer<typeof applicantSchema>;
