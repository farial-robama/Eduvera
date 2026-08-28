// export default async (policyContext: any, _config: any, { strapi }: any) => {
//   const { user } = policyContext.state;

  
//   if (!user) {
//     return false;
//   }

//   const roleType = user.role?.type;

//   if (roleType === 'admin' || roleType === 'content-manager') {
//     return true;
//   }

//   if (roleType !== 'instructor') {
//     return false;
//   }

//   const { action, params, request } = policyContext;
//   const uid = policyContext.state.route?.uid;

//   /**
//    * CREATE
//    */
//   if (action === 'create') {
//     const data = request.body?.data;

//     // Creating a Course
//     if (uid === 'api::course.course') {
//       const instructorId =
//         data?.instructor?.connect?.[0]?.id ??
//         data?.instructor?.set?.[0]?.id ??
//         data?.instructor;

//       return String(instructorId) === String(user.id);
//     }

//     // Creating Lesson or Quiz
//     const courseId =
//       data?.course?.connect?.[0]?.id ??
//       data?.course?.set?.[0]?.id ??
//       data?.course;

//     if (!courseId) {
//       return false;
//     }

//     const course = await strapi.documents('api::course.course').findOne({
//       documentId: String(courseId),
//       populate: {
//         instructor: true,
//       },
//     });

//     return String(course?.instructor?.id) === String(user.id);
//   }

//   /**
//    * FIND ONE
//    *
//    * Instructor can view only their own course/lesson/quiz.
//    */
//   if (action === 'findOne') {
//     if (uid === 'api::course.course') {
//       const course = await strapi.documents('api::course.course').findOne({
//         documentId: params.documentId,
//         populate: {
//           instructor: true,
//         },
//       });

//       return String(course?.instructor?.id) === String(user.id);
//     }

//     if (uid === 'api::lesson.lesson') {
//       const lesson = await strapi.documents('api::lesson.lesson').findOne({
//         documentId: params.documentId,
//         populate: {
//           course: {
//             populate: {
//               instructor: true,
//             },
//           },
//         },
//       });

//       return String(lesson?.course?.instructor?.id) === String(user.id);
//     }

//     if (uid === 'api::quiz.quiz') {
//       const quiz = await strapi.documents('api::quiz.quiz').findOne({
//         documentId: params.documentId,
//         populate: {
//           course: {
//             populate: {
//               instructor: true,
//             },
//           },
//         },
//       });

//       return String(quiz?.course?.instructor?.id) === String(user.id);
//     }

//     return false;
//   }

//   /**
//    * UPDATE / DELETE
//    */
//   if (action === 'update' || action === 'delete') {
//     if (uid === 'api::course.course') {
//       const course = await strapi.documents('api::course.course').findOne({
//         documentId: params.documentId,
//         populate: {
//           instructor: true,
//         },
//       });

//       return String(course?.instructor?.id) === String(user.id);
//     }

//     if (uid === 'api::lesson.lesson') {
//       const lesson = await strapi.documents('api::lesson.lesson').findOne({
//         documentId: params.documentId,
//         populate: {
//           course: {
//             populate: {
//               instructor: true,
//             },
//           },
//         },
//       });

//       return String(lesson?.course?.instructor?.id) === String(user.id);
//     }

//     if (uid === 'api::quiz.quiz') {
//       const quiz = await strapi.documents('api::quiz.quiz').findOne({
//         documentId: params.documentId,
//         populate: {
//           course: {
//             populate: {
//               instructor: true,
//             },
//           },
//         },
//       });

//       return String(quiz?.course?.instructor?.id) === String(user.id);
//     }

//     return false;
//   }

//   return false;
// };




export default async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;
  if (!user) {
    strapi.log.info('[is-course-owner] BLOCKED: no user on request');
    return false;
  }

  const roleType = user.role?.type;
  strapi.log.info(`[is-course-owner] user=${user.id} roleType=${roleType}`);

  if (roleType === 'admin' || roleType === 'content_manager') return true;
  if (roleType !== 'instructor') {
    strapi.log.info(`[is-course-owner] BLOCKED: role "${roleType}" is not instructor/admin/content_manager`);
    return false;
  }

  const ctx = policyContext;
  const idParam = ctx.params?.id; // in Strapi v5 this is the documentId string, NOT the numeric id
  strapi.log.info(`[is-course-owner] idParam=${idParam} url=${ctx.request.url}`);

  let course = null;
  if (idParam && ctx.request.url.includes('/courses')) {
    course = await strapi.documents('api::course.course').findOne({
      documentId: idParam,
      populate: ['instructor'],
    });
  }

  if (!course) {
    strapi.log.info('[is-course-owner] BLOCKED: could not find course for that id');
    return false;
  }

  strapi.log.info(`[is-course-owner] course.instructor=${course.instructor?.id} vs user=${user.id}`);
  return course.instructor?.id === user.id;
};