import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::quiz-result.quiz-result",
  ({ strapi }) => ({
   
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("You must be logged in");
      }

      const { data } = ctx.request.body;

      if (!data?.quiz) {
        return ctx.badRequest("Quiz is required");
      }

      const result = await strapi
        .documents("api::quiz-result.quiz-result")
        .create({
          data: {
            ...data,
            student: user.id,
          },
        });

      return { data: result };
    },

    
    async find(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("You must be logged in");
      }

      const results = await strapi
        .documents("api::quiz-result.quiz-result")
        .findMany({
          filters: {
            student: {
              id: {
                $eq: user.id,
              },
            },
          },
        });

      return {
        data: results,
        meta: {
          pagination: {
            page: 1,
            pageSize: results.length,
            pageCount: results.length > 0 ? 1 : 0,
            total: results.length,
          },
        },
      };
    },

    
    async findOne(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("You must be logged in");
      }

      const result = await strapi
        .documents("api::quiz-result.quiz-result")
        .findOne({
          documentId: ctx.params.documentId,
          populate: {
            student: true,
          },
        });

      if (!result) {
        return ctx.notFound("Quiz result not found");
      }

      if (String(result.student?.id) !== String(user.id)) {
        return ctx.forbidden("You can only access your own quiz result");
      }

      return {
        data: result,
      };
    },
  }),
);
