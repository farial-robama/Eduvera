/**
 * Policy: is-course-owner
 *
 * Allows:
 * - Admin → everything
 * - Content Manager → everything
 * - Instructor → only their own courses/lessons/quizzes
 *
 * Denies:
 * - Unauthenticated users
 * - Students
 * - Other instructors' content
 */

export default async (policyContext: any, _config: any, { strapi }: any) => {
  const { user } = policyContext.state;

  // No authenticated user
  if (!user) {
    return false;
  }

  const roleType = user.role?.type;

  // Admin and Content Manager can access everything
  if (roleType === 'admin' || roleType === 'content-manager') {
    return true;
  }

  // Only instructors can continue
  if (roleType !== 'instructor') {
    return false;
  }

  const { action, params, request } = policyContext;

  /*
   * CREATE
   *
   * There is no existing course/lesson/quiz yet,
   * so check the course/instructor information in the request body.
   */
  if (action === 'create') {
    const data = request.body?.data;

    // Creating a Course directly
    if (policyContext.state.route?.uid === 'api::course.course') {
      const instructorId =
        data?.instructor?.connect?.[0]?.id ??
        data?.instructor?.set?.[0]?.id ??
        data?.instructor;

      return String(instructorId) === String(user.id);
    }

    // Creating a Lesson or Quiz
    // They must belong to a course owned by this instructor.
    const courseId =
      data?.course?.connect?.[0]?.id ??
      data?.course?.set?.[0]?.id ??
      data?.course;

    if (!courseId) {
      return false;
    }

    const course = await strapi.documents('api::course.course').findOne({
      documentId: String(courseId),
      populate: {
        instructor: true,
      },
    });

    if (!course?.instructor) {
      return false;
    }

    return String(course.instructor.id) === String(user.id);
  }

  /*
   * UPDATE / DELETE
   *
   * Find the existing entity and determine its course.
   */
  const uid = policyContext.state.route?.uid;

  let courseId: string | undefined;

  if (uid === 'api::course.course') {
    const course = await strapi
      .documents('api::course.course')
      .findOne({
        documentId: params.documentId,
        populate: {
          instructor: true,
        },
      });

    if (!course?.instructor) {
      return false;
    }

    return String(course.instructor.id) === String(user.id);
  }

  if (uid === 'api::lesson.lesson') {
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: params.documentId,
      populate: {
        course: {
          populate: {
            instructor: true,
          },
        },
      },
    });

    courseId = lesson?.course?.documentId;
  }

  if (uid === 'api::quiz.quiz') {
    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: params.documentId,
      populate: {
        course: {
          populate: {
            instructor: true,
          },
        },
      },
    });

    courseId = quiz?.course?.documentId;
  }

  if (!courseId) {
    return false;
  }

  const course = await strapi.documents('api::course.course').findOne({
    documentId: courseId,
    populate: {
      instructor: true,
    },
  });

  if (!course?.instructor) {
    return false;
  }

  return String(course.instructor.id) === String(user.id);
};