import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to enroll.');
    }

    const { course, enrolledAt } = ctx.request.body.data || {};

    if (!course) {
      return ctx.badRequest('course is required');
    }

    const entry = await strapi.documents('api::enrollment.enrollment').create({
      data: {
        student: user.id,
        course,
        enrolledAt: enrolledAt || new Date().toISOString(),
      },
    });

    return { data: entry };
  },
}));