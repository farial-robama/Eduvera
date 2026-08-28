import type { Core } from '@strapi/strapi';

export default async (
  policyContext: any,
  config: any,
  { strapi }: { strapi: Core.Strapi }
) => {
  const { user } = policyContext.state;

  if (!user) {
    strapi.log.info('[is-course-owner] BLOCKED: no user on request');
    return false;
  }

  const roleType = user.role?.type;
  strapi.log.info(
    `[is-course-owner] user=${user.id} roleType=${roleType}`
  );

  if (roleType === 'admin' || roleType === 'content_manager') {
    return true;
  }

  if (roleType !== 'instructor') {
    strapi.log.info(
      `[is-course-owner] BLOCKED: role "${roleType}" is not allowed`
    );
    return false;
  }

  const ctx = policyContext;

  
  if (
    ctx.method === 'POST' &&
    ctx.request.url.endsWith('/courses')
  ) {
    strapi.log.info(
      '[is-course-owner] ALLOWED: instructor creating a new course'
    );
    return true;
  }

  let courseDocId: string | null = null;

  // update/delete
  if (ctx.params?.id && ctx.request.url.includes('/courses')) {
    courseDocId = ctx.params.id;
  }

  // creating a lesson/quiz 
  if (!courseDocId && ctx.request.body?.data?.course) {
    courseDocId = ctx.request.body.data.course;
  }

  // Updating/deleting an existing lesson/quiz
  if (!courseDocId && ctx.params?.id) {
    const type = ctx.request.url.includes('/lessons')
      ? 'api::lesson.lesson'
      : ctx.request.url.includes('/quizzes')
      ? 'api::quiz.quiz'
      : null;

    if (type) {
      const entity: any = await strapi.documents(type as any).findOne({
        documentId: ctx.params.id,
        populate: ['course'],
      });

      courseDocId = entity?.course?.documentId ?? null;
    }
  }

  strapi.log.info(
    `[is-course-owner] resolved courseDocId=${courseDocId}`
  );

  if (!courseDocId) {
    strapi.log.info(
      '[is-course-owner] BLOCKED: could not resolve a course id'
    );
    return false;
  }

  const course: any = await strapi
    .documents('api::course.course')
    .findOne({
      documentId: courseDocId,
      populate: ['instructor'],
    });

  if (!course) {
    strapi.log.info('[is-course-owner] BLOCKED: course not found');
    return false;
  }

  strapi.log.info(
    `[is-course-owner] course.instructor=${course.instructor?.id} vs user=${user.id}`
  );

  return course.instructor?.id === user.id;
};