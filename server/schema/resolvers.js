const { User, Book } = require("../models");
// import sign token function from auth
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require("../utils/auth");
const { countDocuments } = require("../models/User");

const resolvers = {
  // get a single user by either their id or their username
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const foundUser = await User.findOne({ _id: context.user._id })
        .select('-__v -password');
        return foundUser;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, args, context) => {
      const user = await User.create(args);

      if (!user) {
        return console.error("Something is wrong!");
      }
      const token = signToken(user);
      return { token, user };
    },
    // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
    // {body} is destructured req.body
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError ("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        return console.error("Wrong password!");
      }
      const token = signToken(user);
      return { token, user };
    },
    // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
    // user comes from `req.user` created in the auth middleware function
    saveBook: async (parent, { book }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true }
        )
      }
       throw new AuthenticationError('Your need to be logged in!')
    },
    // remove a book from `savedBooks`
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updateUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );
        console.log(updateUser)
        return updateUser;
      }
      throw new AuthenticationError('Your need to be logged in!')
    },
  },
};

module.exports = resolvers;