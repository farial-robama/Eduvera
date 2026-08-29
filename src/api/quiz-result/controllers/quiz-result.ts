import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::quiz-result.quiz-result',
  ({ strapi }) => ({
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { data } = ctx.request.body;

      if (!data?.quiz) {
        return ctx.badRequest('Quiz is required');
      }

      const result = await strapi.documents('api::quiz-result.quiz-result').create({
        data: {
          ...data,
          student: user.id,
        },
      });

      return { data: result };
    },
  })
);