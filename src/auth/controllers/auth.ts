import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::auth.auth",
  ({ strapi }) => ({
    async register(ctx) {
      const {
        username,
        email,
        password,
        role,
      } = ctx.request.body;

      // Basic validation
      if (!username || !email || !password || !role) {
        return ctx.badRequest(
          "Username, email, password and role are required."
        );
      }

      // Only these two roles are allowed
      if (!["student", "instructor"].includes(role)) {
        return ctx.badRequest(
          "Invalid role. Only student or instructor is allowed."
        );
      }

      try {
        // Check existing email
        const existingEmail =
          await strapi.db
            .query("plugin::users-permissions.user")
            .findOne({
              where: {
                email: email.toLowerCase(),
              },
            });

        if (existingEmail) {
          return ctx.badRequest(
            "An account with this email already exists."
          );
        }

        // Check existing username
        const existingUsername =
          await strapi.db
            .query("plugin::users-permissions.user")
            .findOne({
              where: {
                username,
              },
            });

        if (existingUsername) {
          return ctx.badRequest(
            "This username is already taken."
          );
        }

        // Find requested role
        const userRole =
          await strapi.db
            .query("plugin::users-permissions.role")
            .findOne({
              where: {
                type: role,
              },
            });

        if (!userRole) {
          return ctx.badRequest(
            `The ${role} role does not exist in Strapi.`
          );
        }

        // Hash password
        const hashedPassword =
          await strapi
            .plugin("users-permissions")
            .service("user")
            .hashPassword(password);

        // Create user
        const user =
          await strapi.db
            .query("plugin::users-permissions.user")
            .create({
              data: {
                username,
                email: email.toLowerCase(),
                password: hashedPassword,
                provider: "local",
                confirmed: true,
                blocked: false,
                role: userRole.id,
              },
              populate: ["role"],
            });

        // Generate JWT
        const jwt =
          strapi
            .plugin("users-permissions")
            .service("jwt")
            .issue({
              id: user.id,
            });

        return ctx.send({
          jwt,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        strapi.log.error(
          "Custom registration error:",
          error
        );

        return ctx.internalServerError(
          "Unable to create account."
        );
      }
    },
  })
);