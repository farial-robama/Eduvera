import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::course.course',
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const roleType = user.role?.type;

      if (roleType !== 'instructor') {
        return ctx.forbidden('Only instructors can create courses');
      }

      const { data } = ctx.request.body;

      const course = await strapi.documents('api::course.course').create({
        data: {
          ...data,
          instructor: user.documentId,
        },
      });

      return { data: course };
    },
  })
);